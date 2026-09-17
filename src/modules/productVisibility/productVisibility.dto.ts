import { z } from "zod";
import { emptyBodySchema, emptyQuerySchema } from "../../shared/validation/commonSchemas";

const visibilitySkuParamsSchema = z.object({
  sku: z.string().trim().min(1).max(120)
});

export const listProductVisibilitySchema = z.object({
  body: emptyBodySchema,
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export const setProductVisibilitySchema = z.object({
  body: z.object({ isVisible: z.boolean() }),
  params: visibilitySkuParamsSchema,
  query: emptyQuerySchema
});

export type SetProductVisibilityDto = z.infer<typeof setProductVisibilitySchema>["body"];
