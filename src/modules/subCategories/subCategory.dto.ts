import { z } from "zod";
import { emptyBodySchema, emptyQuerySchema } from "../../shared/validation/commonSchemas";

const subCategoryPayloadSchema = z.object({
  id: z.string().min(2).max(180),
  categoryId: z.string().min(2).max(140),
  name: z.string().min(2).max(140),
  slug: z.string().min(2).max(180),
  url: z.string().url(),
  sortOrder: z.number().int().min(0),
  source: z.object({
    portal: z.string().min(1),
    url: z.string().url(),
    extractedAt: z.string().min(1)
  })
});

const subCategoryIdParamsSchema = z.object({ id: z.string().min(2).max(180) });

export const createSubCategorySchema = z.object({
  body: subCategoryPayloadSchema,
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export const updateSubCategorySchema = z.object({
  body: subCategoryPayloadSchema.partial(),
  params: subCategoryIdParamsSchema,
  query: emptyQuerySchema
});

export const subCategoryByIdSchema = z.object({
  body: emptyBodySchema,
  params: subCategoryIdParamsSchema,
  query: emptyQuerySchema
});

export type CreateSubCategoryDto = z.infer<typeof createSubCategorySchema>["body"];
export type UpdateSubCategoryDto = z.infer<typeof updateSubCategorySchema>["body"];
