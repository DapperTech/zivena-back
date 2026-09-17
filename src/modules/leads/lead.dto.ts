import { z } from "zod";
import {
  emptyBodySchema,
  emptyQuerySchema,
  idParamsSchema,
  metadataSchema
} from "../../shared/validation/commonSchemas";

const leadProductSchema = z.object({
  productId: z.string().trim().max(120).optional(),
  sku: z.string().trim().min(1).max(120),
  name: z.string().trim().min(2).max(240),
  quantity: z.number().int().min(1),
  technique: z.string().trim().max(140).optional(),
  imageUrl: z.string().url().optional()
});

const leadAssigneeSchema = z.object({
  userId: z.string().trim().max(120).optional(),
  uid: z.string().trim().min(2).max(160),
  name: z.string().trim().min(2).max(140),
  email: z.string().email().optional()
});

const manualLeadPayloadSchema = z.object({
  title: z.string().trim().min(2).max(180),
  contactName: z.string().trim().min(2).max(140),
  company: z.string().trim().max(180).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().max(40).optional(),
  source: z.enum(["manual", "referral"]).default("manual"),
  stage: z.enum(["new", "contacted", "proposal", "won", "lost"]).default("new"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  estimatedValue: z.number().nonnegative().default(0),
  currency: z.string().trim().length(3).default("MXN"),
  deadline: z.coerce.date().optional(),
  message: z.string().trim().max(4000).optional(),
  notes: z.string().trim().max(8000).optional(),
  products: z.array(leadProductSchema).default([]),
  assignedTo: leadAssigneeSchema.optional(),
  metadata: metadataSchema.default({})
});

const websiteLeadPayloadSchema = z.object({
  name: z.string().trim().min(2).max(140),
  company: z.string().trim().max(180).optional(),
  email: z.string().email(),
  phone: z.string().trim().min(7).max(40),
  deadline: z.coerce.date().optional(),
  message: z.string().trim().max(4000).optional(),
  products: z.array(leadProductSchema).min(1)
});

const leadUpdatePayloadSchema = manualLeadPayloadSchema
  .omit({ source: true })
  .partial()
  .extend({ lastActivityAt: z.coerce.date().optional() });

export const listLeadsSchema = z.object({
  body: emptyBodySchema,
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export const createWebsiteLeadSchema = z.object({
  body: websiteLeadPayloadSchema,
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export const createLeadSchema = z.object({
  body: manualLeadPayloadSchema,
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export const updateLeadSchema = z.object({
  body: leadUpdatePayloadSchema,
  params: idParamsSchema,
  query: emptyQuerySchema
});

export const leadByIdSchema = z.object({
  body: emptyBodySchema,
  params: idParamsSchema,
  query: emptyQuerySchema
});

export type WebsiteLeadDto = z.infer<typeof createWebsiteLeadSchema>["body"];
export type CreateLeadDto = z.infer<typeof createLeadSchema>["body"];
export type UpdateLeadDto = z.infer<typeof updateLeadSchema>["body"];
