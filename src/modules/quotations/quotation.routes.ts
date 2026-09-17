import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import { QuotationController } from "./quotation.controller";
import {
  createQuotationSchema,
  generateQuotationSchema,
  listQuotationsSchema,
  quotationByIdSchema,
  updateQuotationSchema
} from "./quotation.dto";
import { QuotationRepository } from "./quotation.repository";
import { QuotationService } from "./quotation.service";

const repository = new QuotationRepository();
const service = new QuotationService(repository);
const controller = new QuotationController(service);

export const quotationRoutes = Router();

quotationRoutes.use(authGuard, requireRole("admin", "sales"));

quotationRoutes.get("/", validate(listQuotationsSchema), controller.list);
quotationRoutes.post("/", validate(createQuotationSchema), controller.create);
quotationRoutes.post(
  "/:id/generate",
  validate(generateQuotationSchema),
  controller.generate
);
quotationRoutes.get("/:id", validate(quotationByIdSchema), controller.getById);
quotationRoutes.patch("/:id", validate(updateQuotationSchema), controller.update);
quotationRoutes.delete("/:id", validate(quotationByIdSchema), controller.delete);
