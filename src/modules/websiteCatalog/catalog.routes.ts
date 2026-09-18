import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { sendSuccess } from "../../shared/http/response";
import { NotFoundAppError } from "../../shared/errors/AppError";
import {
  catalogQuerySchema, catalogRequestSchema, catalogIdRequestSchema,
  catalogSlugRequestSchema, subcategoriesRequestSchema
} from "./catalog.dto";
import { WebsiteCatalogRepository } from "./catalog.repository";

const repository = new WebsiteCatalogRepository();

/** Public website API v2: GET routes only, independent from panel API v1. */
export const websiteCatalogRoutes = Router();

websiteCatalogRoutes.get("/categories", async (_req, res) => {
  sendSuccess(res, await repository.categories());
});
websiteCatalogRoutes.get("/subcategories", validate(subcategoriesRequestSchema), async (req, res) => {
  const { query } = subcategoriesRequestSchema.parse({ query: req.query, params: {}, body: {} });
  sendSuccess(res, await repository.subcategories(query.category));
});
websiteCatalogRoutes.get("/products", validate(catalogRequestSchema), async (req, res) => {
  sendSuccess(res, await repository.products(catalogQuerySchema.parse(req.query)));
});
websiteCatalogRoutes.get("/products/slug/:slug", validate(catalogSlugRequestSchema), async (req, res) => {
  const product = await repository.productBySlug(String(req.params.slug));
  if (!product) throw new NotFoundAppError("Product not found");
  sendSuccess(res, product);
});
websiteCatalogRoutes.get("/products/:id", validate(catalogIdRequestSchema), async (req, res) => {
  const product = await repository.product(String(req.params.id));
  if (!product) throw new NotFoundAppError("Product not found");
  sendSuccess(res, product);
});
