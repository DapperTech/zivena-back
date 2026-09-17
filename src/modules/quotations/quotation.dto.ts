import { z } from "zod";
import {
  emptyBodySchema,
  emptyQuerySchema,
  idParamsSchema,
  metadataSchema,
  objectIdSchema
} from "../../shared/validation/commonSchemas";

const optionalText = (max: number) => z.string().trim().max(max).optional();

const addressSchema = z.object({
  street: optionalText(140),
  externalNumber: optionalText(30),
  internalNumber: optionalText(30),
  neighborhood: optionalText(140),
  city: optionalText(120),
  state: optionalText(120),
  country: optionalText(120),
  postalCode: optionalText(12),
  references: optionalText(260)
});

const quotationContactSchema = z.object({
  name: z.string().trim().min(2).max(160),
  company: optionalText(180),
  email: z.string().trim().email().optional(),
  phone: optionalText(40)
});

const quotationAssigneeSchema = z.object({
  userId: optionalText(120),
  uid: z.string().trim().min(2).max(160),
  name: z.string().trim().min(2).max(140),
  email: z.string().trim().email().optional()
});

const quotationItemSchema = z.object({
  productId: optionalText(120),
  sku: z.string().trim().min(1).max(120),
  name: z.string().trim().min(2).max(240),
  imageUrl: z.string().trim().url().optional(),
  technique: optionalText(140),
  quantity: z.number().int().min(1).max(10_000_000),
  unitPrice: z.number().finite().nonnegative().max(100_000_000),
  metadata: metadataSchema.optional()
});

const editableQuotationSchema = z.object({
  clientId: objectIdSchema.optional(),
  contact: quotationContactSchema,
  products: z.array(quotationItemSchema).min(1).max(100),
  address: addressSchema.optional(),
  status: z
    .enum(["draft", "generated", "sent", "approved", "rejected", "expired"])
    .default("draft"),
  taxRate: z.number().finite().min(0).max(100).default(16),
  currency: z.string().trim().length(3).default("MXN"),
  expiresAt: z.coerce.date().optional(),
  notes: optionalText(8000),
  terms: optionalText(4000),
  assignedTo: quotationAssigneeSchema.optional(),
  metadata: metadataSchema
});

export const createQuotationSchema = z.object({
  body: editableQuotationSchema.extend({
    status: z.literal("draft").default("draft")
  }),
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export const updateQuotationSchema = z.object({
  body: editableQuotationSchema.partial(),
  params: idParamsSchema,
  query: emptyQuerySchema
});

export const listQuotationsSchema = z.object({
  body: emptyBodySchema,
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export const quotationByIdSchema = z.object({
  body: emptyBodySchema,
  params: idParamsSchema,
  query: emptyQuerySchema
});

export const generateQuotationSchema = z.object({
  body: emptyBodySchema,
  params: idParamsSchema,
  query: emptyQuerySchema
});

export type CreateQuotationDto = z.infer<typeof createQuotationSchema>["body"];
export type UpdateQuotationDto = z.infer<typeof updateQuotationSchema>["body"];
export type QuotationItemDto = z.infer<typeof quotationItemSchema>;
