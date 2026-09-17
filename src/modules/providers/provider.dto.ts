import { z } from "zod";
import { emptyBodySchema, emptyQuerySchema, idParamsSchema, metadataSchema } from "../../shared/validation/commonSchemas";

const contactSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(30).optional(),
  position: z.string().max(120).optional()
});

const fiscalDataSchema = z.object({
  businessName: z.string().max(180).optional(),
  taxId: z.string().max(40).optional(),
  taxRegime: z.string().max(120).optional(),
  address: z.string().max(260).optional()
});

const providerPayloadSchema = z.object({
  name: z.string().min(2).max(160),
  fiscalData: fiscalDataSchema.default({}),
  logo: z.string().url().optional(),
  contact: contactSchema.default({}),
  metadata: metadataSchema,
  isActive: z.boolean().default(true)
});

export const createProviderSchema = z.object({
  body: providerPayloadSchema,
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export const updateProviderSchema = z.object({
  body: providerPayloadSchema.partial(),
  params: idParamsSchema,
  query: emptyQuerySchema
});

export const providerByIdSchema = z.object({
  body: emptyBodySchema,
  params: idParamsSchema,
  query: emptyQuerySchema
});

export type CreateProviderDto = z.infer<typeof createProviderSchema>["body"];
export type UpdateProviderDto = z.infer<typeof updateProviderSchema>["body"];
