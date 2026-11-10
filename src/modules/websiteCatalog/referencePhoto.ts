import type { RequestHandler } from "express";

// Only catalog filenames are accepted. The caller cannot set the origin, query,
// credentials, request headers, or redirect destination of the upstream fetch.
const catalogFile = /^(?:[\w -]+\/){0,8}[\w ()-][\w .()-]*\.(?:jpe?g|png|webp)$/i;
const maxBytes = 8_000_000;

export const referencePhoto: RequestHandler = async (req, res) => {
  const file = req.query.file;
  if (typeof file !== "string" || file.length > 400 || !catalogFile.test(file)) {
    res.sendStatus(400);
    return;
  }
  const path = file.split("/").map(encodeURIComponent).join("/");
  const url = "https://www.promoopcion.com/media/catalog/product/" + path
    + "?width=800&height=800&store=default&image-type=image";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const stop = () => controller.abort();
  res.on("close", stop);
  try {
    const upstream = await fetch(url, { redirect: "error", signal: controller.signal });
    const mime = upstream.headers.get("content-type")?.split(";")[0];
    if (!upstream.ok || !upstream.body || !mime || !["image/jpeg", "image/png", "image/webp"].includes(mime)) {
      res.sendStatus(upstream.status === 404 ? 404 : 502);
      return;
    }
    if (Number(upstream.headers.get("content-length")) > maxBytes) {
      res.sendStatus(502);
      return;
    }
    let size = 0;
    const chunks: Uint8Array[] = [];
    for await (const chunk of upstream.body) {
      size += chunk.length;
      if (size > maxBytes) { res.sendStatus(502); return; }
      chunks.push(chunk);
    }
    res.set({ "Cache-Control": "public, max-age=86400", "Content-Type": mime, "X-Content-Type-Options": "nosniff" })
      .send(Buffer.concat(chunks));
  } catch {
    if (!res.headersSent && !res.destroyed) res.sendStatus(502);
  } finally {
    clearTimeout(timeout);
    controller.abort();
    res.off("close", stop);
  }
};
