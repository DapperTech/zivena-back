import { z } from "zod";
import {
  emptyBodySchema,
  emptyQuerySchema,
  idParamsSchema,
  metadataSchema,
  objectIdSchema
} from "../../shared/validation/commonSchemas";

const addressSchema = z.object({
  street: z.string().max(140).optional(),
  externalNumber: z.string().max(30).optional(),
  internalNumber: z.string().max(30).optional(),
  neighborhood: z.string().max(140).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  postalCode: z.string().max(12).optional(),
  references: z.string().max(260).optional()
});

const orderItemSchema = z.object({
  productId: objectIdSchema.optional(),
  sku: z.string().max(80).optional(),
  name: z.string().max(180).optional(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  metadata: metadataSchema.optional()
});

const orderPayloadSchema = z.object({
  quotationId: objectIdSchema.optional(),
  clientId: objectIdSchema,
  products: z.array(orderItemSchema).min(1),
  shippingAddress: addressSchema.optional(),
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled"]).default("pending"),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).default("pending"),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  currency: z.string().min(3).max(3).default("MXN"),
  orderedAt: z.coerce.date().optional(),
  metadata: metadataSchema
});

export const createOrderSchema = z.object({
  body: orderPayloadSchema,
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export const updateOrderSchema = z.object({
  body: orderPayloadSchema.partial(),
  params: idParamsSchema,
  query: emptyQuerySchema
});

export const orderByIdSchema = z.object({
  body: emptyBodySchema,
  params: idParamsSchema,
  query: emptyQuerySchema
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>["body"];
export type UpdateOrderDto = z.infer<typeof updateOrderSchema>["body"];
