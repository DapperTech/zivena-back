import { z } from "zod";

export const catalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(96).default(24),
  search: z.string().trim().max(100).default(""),
  category: z.string().trim().min(1).max(140).optional(),
  subcategory: z.string().trim().min(1).max(140).optional(),
  featured: z.union([z.boolean(), z.enum(["true", "false"]).transform(value => value === "true")]).optional(),
  sort: z.enum(["relevance", "name-asc", "name-desc", "sku"]).default("relevance"),
  view: z.enum(["summary", "detail"]).default("summary")
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

export const catalogRequestSchema = z.object({
  query: catalogQuerySchema,
  params: z.object({}),
  body: z.object({})
});

export const catalogIdRequestSchema = z.object({
  query: z.object({}),
  params: z.object({ id: z.string().min(1).max(120) }),
  body: z.object({})
});

export const catalogSlugRequestSchema = z.object({
  query: z.object({}),
  params: z.object({ slug: z.string().min(1).max(360).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) }),
  body: z.object({})
});

export const subcategoriesRequestSchema = z.object({
  query: z.object({ category: z.string().trim().min(1).max(140).optional() }),
  params: z.object({}),
  body: z.object({})
});
