import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import { CategoryController } from "./category.controller";
import { categoryByIdSchema, createCategorySchema, updateCategorySchema } from "./category.dto";
import { CategoryRepository } from "./category.repository";
import { CategoryService } from "./category.service";

const categoryRepository = new CategoryRepository();
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

export const categoryRoutes = Router();

categoryRoutes.get("/", categoryController.list);

categoryRoutes.use(authGuard, requireRole("admin", "sales"));
categoryRoutes.get("/:id", validate(categoryByIdSchema), categoryController.getById);
categoryRoutes.post("/", requireRole("admin"), validate(createCategorySchema), categoryController.create);
categoryRoutes.patch(
  "/:id",
  requireRole("admin"),
  validate(updateCategorySchema),
  categoryController.update
);
categoryRoutes.delete(
  "/:id",
  requireRole("admin"),
  validate(categoryByIdSchema),
  categoryController.delete
);
