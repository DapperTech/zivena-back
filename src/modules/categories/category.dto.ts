import { z } from "zod";
import { emptyBodySchema, emptyQuerySchema } from "../../shared/validation/commonSchemas";

const categoryPayloadSchema = z.object({
  id: z.string().min(2).max(140),
  name: z.string().min(2).max(140),
  slug: z.string().min(2).max(160),
  url: z.string().url(),
  image: z.string().url(),
  sortOrder: z.number().int().min(0),
  source: z.object({
    portal: z.string().min(1),
    url: z.string().url(),
    extractedAt: z.string().min(1)
  })
});

const categoryIdParamsSchema = z.object({ id: z.string().min(2).max(140) });

export const createCategorySchema = z.object({
  body: categoryPayloadSchema,
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export const updateCategorySchema = z.object({
  body: categoryPayloadSchema.partial(),
  params: categoryIdParamsSchema,
  query: emptyQuerySchema
});

export const categoryByIdSchema = z.object({
  body: emptyBodySchema,
  params: categoryIdParamsSchema,
  query: emptyQuerySchema
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>["body"];
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>["body"];
