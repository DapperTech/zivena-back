import { z } from "zod";
import { emptyBodySchema, emptyQuerySchema } from "../../shared/validation/commonSchemas";

const sourceSchema = z.object({
  portal: z.string().min(1),
  url: z.string().url(),
  extractedAt: z.string().min(1)
});

const imageSchema = z.object({
  originalUrl: z.string().url(),
  mediaUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  url: z.string().url().optional(),
  title: z.string().optional(),
  alt: z.string().optional(),
  magentoProductId: z.string().optional(),
  source: z.string().optional()
});

const attributeSchema = z.object({ name: z.string(), value: z.string() });

const productPayloadSchema = z.object({
  id: z.string().min(2).max(120),
  sku: z.string().min(1).max(120),
  name: z.string().min(2).max(240),
  url: z.string().url(),
  magentoProductId: z.string().min(1),
  productType: z.string().min(1),
  categoryIds: z.array(z.string()).default([]),
  subcategoryIds: z.array(z.string()).default([]),
  description: z.string(),
  featured: z.boolean().default(false),
  availability: z.object({
    status: z.string(),
    availableQuantity: z.number().optional(),
    text: z.string()
  }),
  images: z.array(imageSchema).min(1),
  variants: z.array(
    z.object({
      magentoProductId: z.string(),
      options: z.array(
        z.object({
          attributeId: z.string(),
          attributeCode: z.string(),
          attribute: z.string(),
          optionId: z.string(),
          value: z.string()
        })
      ),
      images: z.array(imageSchema)
    })
  ),
  specifications: z.array(
    z.object({ section: z.string(), attributes: z.array(attributeSchema) })
  ),
  additionalAttributes: z.array(attributeSchema),
  meta: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    ogTitle: z.string().optional()
  }),
  sources: z.array(
    z.object({
      type: z.enum(["category", "subcategory"]),
      categoryId: z.string(),
      subcategoryId: z.string().optional(),
      url: z.string().url()
    })
  ),
  source: sourceSchema
});

const catalogIdParamsSchema = z.object({ id: z.string().min(2).max(120) });
const productSlugParamsSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(360)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
});

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce
    .number()
    .int()
    .refine(
      (value) => [4, 8, 12, 24, 48, 96].includes(value),
      "Limit must be 4, 8, 12, 24, 48 or 96"
    )
    .default(24),
  search: z
    .string()
    .max(100)
    .transform((value) => value.trim().replace(/\s+/g, " "))
    .default(""),
  category: z.string().trim().max(140).optional(),
  exclude: z.string().trim().min(2).max(120).optional(),
  sort: z.enum(["relevance", "name-asc", "name-desc", "sku"]).default("relevance")
});

export const productSuggestionsQuerySchema = z.object({
  query: z
    .string()
    .max(100)
    .transform((value) => value.trim().replace(/\s+/g, " ")),
  limit: z.coerce.number().int().min(1).max(10).default(8),
  category: z.string().trim().max(140).optional()
});

export const adminProductListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce
    .number()
    .int()
    .refine((value) => [20, 50, 100].includes(value), "Limit must be 20, 50 or 100")
    .default(20),
  search: z
    .string()
    .max(100)
    .transform((value) => value.trim().replace(/\s+/g, " "))
    .default(""),
  category: z.string().trim().max(140).optional(),
  visibility: z.enum(["all", "visible", "hidden"]).default("all"),
  sort: z.enum(["name-asc", "name-desc", "sku"]).default("name-asc")
});

export const listProductsSchema = z.object({
  body: emptyBodySchema,
  params: emptyBodySchema,
  query: productListQuerySchema
});

export const suggestProductsSchema = z.object({
  body: emptyBodySchema,
  params: emptyBodySchema,
  query: productSuggestionsQuerySchema
});

export const listAdminProductsSchema = z.object({
  body: emptyBodySchema,
  params: emptyBodySchema,
  query: adminProductListQuerySchema
});

export const createProductSchema = z.object({
  body: productPayloadSchema,
  params: emptyBodySchema,
  query: emptyQuerySchema
});

export const updateProductSchema = z.object({
  body: productPayloadSchema.partial(),
  params: catalogIdParamsSchema,
  query: emptyQuerySchema
});

export const productByIdSchema = z.object({
  body: emptyBodySchema,
  params: catalogIdParamsSchema,
  query: emptyQuerySchema
});

export const productBySlugSchema = z.object({
  body: emptyBodySchema,
  params: productSlugParamsSchema,
  query: emptyQuerySchema
});

export type CreateProductDto = z.infer<typeof createProductSchema>["body"];
export type UpdateProductDto = z.infer<typeof updateProductSchema>["body"];
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type ProductSuggestionsQuery = z.infer<typeof productSuggestionsQuerySchema>;
export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;
