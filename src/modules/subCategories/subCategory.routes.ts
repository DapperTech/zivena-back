import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import { SubCategoryController } from "./subCategory.controller";
import { createSubCategorySchema, subCategoryByIdSchema, updateSubCategorySchema } from "./subCategory.dto";
import { SubCategoryRepository } from "./subCategory.repository";
import { SubCategoryService } from "./subCategory.service";

const subCategoryRepository = new SubCategoryRepository();
const subCategoryService = new SubCategoryService(subCategoryRepository);
const subCategoryController = new SubCategoryController(subCategoryService);

export const subCategoryRoutes = Router();

subCategoryRoutes.use(authGuard, requireRole("admin", "sales"));

subCategoryRoutes.get("/", subCategoryController.list);
subCategoryRoutes.get("/:id", validate(subCategoryByIdSchema), subCategoryController.getById);
subCategoryRoutes.post(
  "/",
  requireRole("admin"),
  validate(createSubCategorySchema),
  subCategoryController.create
);
subCategoryRoutes.patch(
  "/:id",
  requireRole("admin"),
  validate(updateSubCategorySchema),
  subCategoryController.update
);
subCategoryRoutes.delete(
  "/:id",
  requireRole("admin"),
  validate(subCategoryByIdSchema),
  subCategoryController.delete
);
