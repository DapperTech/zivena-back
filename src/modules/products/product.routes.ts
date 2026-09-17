import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import { ProductController } from "./product.controller";
import {
  createProductSchema,
  listAdminProductsSchema,
  listProductsSchema,
  productByIdSchema,
  productBySlugSchema,
  suggestProductsSchema,
  updateProductSchema
} from "./product.dto";
import { ProductRepository } from "./product.repository";
import { ProductService } from "./product.service";

const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);
const productController = new ProductController(productService);

export const productRoutes = Router();

productRoutes.get("/", validate(listProductsSchema), productController.list);
productRoutes.get("/suggestions", validate(suggestProductsSchema), productController.suggestions);
productRoutes.get(
  "/admin",
  authGuard,
  requireRole("admin", "sales"),
  validate(listAdminProductsSchema),
  productController.adminList
);
productRoutes.get(
  "/admin/:id",
  authGuard,
  requireRole("admin", "sales"),
  validate(productByIdSchema),
  productController.getAdminById
);
productRoutes.get("/slug/:slug", validate(productBySlugSchema), productController.getBySlug);
productRoutes.get("/:id", validate(productByIdSchema), productController.getById);

productRoutes.use(authGuard, requireRole("admin"));
productRoutes.post("/", validate(createProductSchema), productController.create);
productRoutes.patch("/:id", validate(updateProductSchema), productController.update);
productRoutes.delete("/:id", validate(productByIdSchema), productController.delete);
