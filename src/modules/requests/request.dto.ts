import { z } from "zod";
import {
  emptyBodySchema,
  emptyQuerySchema,
  idParamsSchema,
  metadataSchema,
  objectIdSchema
} from "../../shared/validation/commonSchemas";

const requestProductItemSchema = z.object({
  productId: objectIdSchema.optional(),
  sku: z.string().max(80).optional(),
  quantity: z.number().int().min(1).default(1)
});

const requestPayloadSchema = z.object({
  products: z.array(requestProductItemSchema).min(1),
  name: z.string().min(2).max(140),
  phone: z.string().min(7).max(30),
  email: z.string().email().optional(),
  postalCode: z.string().max(12).optional(),
  status: z.enum(["pending", "inReview", "resolved", "rejected"]).default("pending"),
  metadata: metadataSchema
});

export const createRequestSchema = z.object({
  body: requestPayloadSchema,
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export const updateRequestSchema = z.object({
  body: requestPayloadSchema.partial(),
  params: idParamsSchema,
  query: emptyQuerySchema
});

export const requestByIdSchema = z.object({
  body: emptyBodySchema,
  params: idParamsSchema,
  query: emptyQuerySchema
});

export type CreateRequestDto = z.infer<typeof createRequestSchema>["body"];
export type UpdateRequestDto = z.infer<typeof updateRequestSchema>["body"];
