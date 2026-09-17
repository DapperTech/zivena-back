import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import {
  listProductVisibilitySchema,
  setProductVisibilitySchema
} from "./productVisibility.dto";
import { ProductVisibilityController } from "./productVisibility.controller";
import { ProductVisibilityRepository } from "./productVisibility.repository";
import { ProductVisibilityService } from "./productVisibility.service";

const repository = new ProductVisibilityRepository();
const service = new ProductVisibilityService(repository);
const controller = new ProductVisibilityController(service);

export const productVisibilityRoutes = Router();

productVisibilityRoutes.use(authGuard);
productVisibilityRoutes.get(
  "/",
  requireRole("admin", "sales"),
  validate(listProductVisibilitySchema),
  controller.list
);
productVisibilityRoutes.put(
  "/:sku",
  requireRole("admin"),
  validate(setProductVisibilitySchema),
  controller.set
);
