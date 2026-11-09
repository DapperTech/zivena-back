import { disconnect } from "mongoose";
import { connectDatabase } from "../config/database";
import { env } from "../config/env";
import { ProductModel } from "../modules/products/product.model";
import { productSlug } from "../modules/products/productSlug";

async function run(): Promise<void> {
  if (!env.mongoUri) throw new Error("MONGO_URI is required");
  await connectDatabase();
  const products = await ProductModel.find({}, { _id: 0, id: 1, slug: 1, name: 1, sku: 1 }).lean();
  const bySlug = new Map<string, string>();
  const missing: Array<{ id: string; slug: string }> = [];
  for (const product of products) {
    const slug = product.slug || productSlug(product.name, product.sku);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid slug for ${product.id}`);
    const previous = bySlug.get(slug);
    if (previous && previous !== product.id) throw new Error(`Slug collision: ${previous}, ${product.id}`);
    bySlug.set(slug, product.id);
    if (!product.slug) missing.push({ id: product.id, slug });
  }
  const apply = process.argv.includes("--apply");
  console.info(JSON.stringify({ database: env.mongoDbName, products: products.length, missing: missing.length,
    duplicateSlugs: products.length - bySlug.size, mode: apply ? "apply" : "dry-run" }));
  if (!apply) return;

  for (let offset = 0; offset < missing.length; offset += 200) {
    const batch = missing.slice(offset, offset + 200);
    const result = await ProductModel.bulkWrite(batch.map(({ id, slug }) => ({
      updateOne: { filter: { id, $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }] },
        update: { $set: { slug } }, upsert: false },
    })));
    if (result.matchedCount !== batch.length) throw new Error(`Concurrent slug change detected in batch ${offset}`);
  }
  await ProductModel.collection.createIndex({ slug: 1 },
    { name: "slug_1", unique: true, partialFilterExpression: { slug: { $type: "string" } } });
  const remaining = await ProductModel.countDocuments({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }] });
  if (remaining) throw new Error(`${remaining} products still have no slug`);
  console.info(JSON.stringify({ backfilled: missing.length, uniqueIndex: "slug_1", verified: products.length }));
}

run()
  .catch((error: unknown) => {
    console.error("[product-slugs]", error instanceof Error ? error.name : "Unknown error");
    if (error instanceof Error && error.name === "Error") console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => { await disconnect(); });
