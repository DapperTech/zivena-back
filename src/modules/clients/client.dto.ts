import { z } from "zod";
import { emptyBodySchema, emptyQuerySchema, idParamsSchema, metadataSchema } from "../../shared/validation/commonSchemas";

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

const fiscalDataSchema = z.object({
  businessName: z.string().max(180).optional(),
  taxId: z.string().max(40).optional(),
  taxRegime: z.string().max(120).optional()
});

const clientPayloadSchema = z.object({
  name: z.string().min(2).max(160),
  email: z.string().email().optional(),
  addresses: z.array(addressSchema).default([]),
  phone: z.string().min(7).max(30).optional(),
  fiscalData: fiscalDataSchema.default({}),
  metadata: metadataSchema,
  isActive: z.boolean().default(true)
});

export const createClientSchema = z.object({
  body: clientPayloadSchema,
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export const updateClientSchema = z.object({
  body: clientPayloadSchema.partial(),
  params: idParamsSchema,
  query: emptyQuerySchema
});

export const clientByIdSchema = z.object({
  body: emptyBodySchema,
  params: idParamsSchema,
  query: emptyQuerySchema
});

export type CreateClientDto = z.infer<typeof createClientSchema>["body"];
export type UpdateClientDto = z.infer<typeof updateClientSchema>["body"];
