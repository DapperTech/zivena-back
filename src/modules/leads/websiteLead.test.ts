import assert from "node:assert/strict";
import { after, test } from "node:test";
import express from "express";
import { AddressInfo } from "node:net";
import { once } from "node:events";
import { errorHandler } from "../../middlewares/errorHandler";
import { createApp } from "../../app/createApp";
import { LeadRepository } from "./lead.repository";
import { LeadService } from "./lead.service";
import { LeadEntity } from "./lead.types";
import { createWebsiteLeadRoutes } from "./websiteLead.routes";
import { websiteLeadPayloadSchema } from "./websiteLead.dto";
import { QuotationService } from "../quotations/quotation.service";

const contact = {
  type: "contact" as const,
  name: "  Ana Ruiz  ",
  email: "  ANA@EXAMPLE.COM  ",
  message: "Necesito ayuda con un pedido"
};
const quotation = {
  type: "quotation" as const,
  name: "Jorge Salazar",
  email: "jorge@example.com",
  phone: "9981234567",
  products: [{ sku: "TAZ077", name: "Taza cerámica", quantity: 100 }]
};
const lead = {
  id: "lead-123",
  metadata: {},
  contactName: "Ana Ruiz",
  email: "ana@example.com",
  phone: "9981234567"
} as LeadEntity;

test("validates and normalizes public website submissions", () => {
  const parsed = websiteLeadPayloadSchema.parse(contact);
  assert.equal(parsed.name, "Ana Ruiz");
  assert.equal(parsed.email, "ana@example.com");
  assert.equal(websiteLeadPayloadSchema.safeParse({ type: "contact", name: "Ana" }).success, false);
  assert.equal(websiteLeadPayloadSchema.safeParse({ ...contact, admin: true }).success, false);
  assert.equal(websiteLeadPayloadSchema.safeParse({ ...quotation, products: [] }).success, false);
  assert.equal(websiteLeadPayloadSchema.safeParse({ ...quotation, products: [{ ...quotation.products[0], quantity: 0 }] }).success, false);
  assert.equal(websiteLeadPayloadSchema.safeParse({ ...quotation, products: Array(101).fill(quotation.products[0]) }).success, false);
  assert.equal(websiteLeadPayloadSchema.safeParse({ ...quotation, deadline: "tomorrow" }).success, false);
  assert.equal(websiteLeadPayloadSchema.safeParse({ ...quotation, products: [{ ...quotation.products[0], unitPrice: 1 }] }).success, false);
  assert.equal(websiteLeadPayloadSchema.safeParse({ ...quotation, products: [{ ...quotation.products[0], imageUrl: "javascript:alert(1)" }] }).success, false);
});

test("contact creates only a CRM opportunity; quotation links a draft", async () => {
  const calls: string[] = [];
  const repository = {
    createWebsiteContact: async (payload: { name: string }) => {
      calls.push(`contact:${payload.name}`);
      return lead;
    },
    createWebsite: async () => {
      calls.push("quotation-lead");
      return lead;
    },
    updateById: async (_id: string, payload: { metadata: Record<string, unknown> }) => {
      calls.push("link-quotation");
      return { ...lead, metadata: payload.metadata };
    }
  } as unknown as LeadRepository;
  const quotationService = {
    createWebsiteDraft: async () => {
      calls.push("draft");
      return { id: "quote-123", folio: "ZV-123" };
    }
  } as unknown as QuotationService;
  const service = new LeadService(repository, quotationService);

  const contactResponse = await service.submitWebsite(websiteLeadPayloadSchema.parse(contact));
  assert.deepEqual(contactResponse, { id: "lead-123", type: "contact", status: "received" });
  assert.deepEqual(calls, ["contact:Ana Ruiz"]);

  const quotationResponse = await service.submitWebsite(websiteLeadPayloadSchema.parse(quotation));
  assert.deepEqual(quotationResponse, { id: "lead-123", type: "quotation", status: "received", quotationId: "quote-123" });
  assert.deepEqual(calls, ["contact:Ana Ruiz", "quotation-lead", "draft", "link-quotation"]);
});

test("quotation failure removes its new CRM lead", async () => {
  let deletedId = "";
  const repository = {
    createWebsite: async () => lead,
    deleteById: async (id: string) => { deletedId = id; return true; }
  } as unknown as LeadRepository;
  const quotationService = {
    createWebsiteDraft: async () => { throw new Error("Database unavailable"); }
  } as unknown as QuotationService;
  const service = new LeadService(repository, quotationService);
  await assert.rejects(service.submitWebsite(websiteLeadPayloadSchema.parse(quotation)), /Database unavailable/);
  assert.equal(deletedId, "lead-123");
});

test("public HTTP route needs no panel token and returns no contact details", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v2/leads", createWebsiteLeadRoutes({
    submitWebsite: async (payload: { type: string }) => ({ id: "lead-123", type: payload.type, status: "received" })
  } as unknown as LeadService));
  app.use(errorHandler);
  const server = app.listen(0, "127.0.0.1");
  after(() => server.close());
  await once(server, "listening");
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v2/leads`;
  const post = (body: unknown) => fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const created = await post(contact);
  assert.equal(created.status, 201);
  const createdBody = await created.json() as { success: boolean; data: Record<string, unknown> };
  assert.deepEqual(createdBody, { success: true, data: { id: "lead-123", type: "contact", status: "received" } });
  assert.equal(JSON.stringify(createdBody).includes("ANA@EXAMPLE.COM"), false);

  const invalid = await post({ type: "quotation", name: "Ana", email: "ana@example.com", phone: "9981234567", products: [] });
  assert.equal(invalid.status, 400);
  const invalidBody = await invalid.json() as { error: { code: string } };
  assert.equal(invalidBody.error.code, "VALIDATION_ERROR");
});

test("production app accepts a preflight from the new website origin", async () => {
  const server = createApp().listen(0, "127.0.0.1");
  after(() => server.close());
  await once(server, "listening");
  const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v2/leads`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://www.zivena.mx",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type"
    }
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://www.zivena.mx");
  assert.match(response.headers.get("access-control-allow-methods") ?? "", /POST/);
});
