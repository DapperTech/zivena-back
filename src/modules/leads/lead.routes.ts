import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import {
  createLeadSchema,
  createWebsiteLeadSchema,
  leadByIdSchema,
  listLeadsSchema,
  updateLeadSchema
} from "./lead.dto";
import { LeadController } from "./lead.controller";
import { LeadRepository } from "./lead.repository";
import { LeadService } from "./lead.service";
import { QuotationRepository } from "../quotations/quotation.repository";
import { QuotationService } from "../quotations/quotation.service";
import { rateLimit } from "express-rate-limit";

const repository = new LeadRepository();
const quotationService = new QuotationService(new QuotationRepository());
const service = new LeadService(repository, quotationService);
const controller = new LeadController(service);

export const leadRoutes = Router();

const websiteLeadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many quotation requests. Please try again later."
      }
    });
  }
});

leadRoutes.post(
  "/website",
  websiteLeadLimiter,
  validate(createWebsiteLeadSchema),
  controller.createWebsite
);

leadRoutes.use(authGuard, requireRole("admin", "sales"));
leadRoutes.get("/", validate(listLeadsSchema), controller.list);
leadRoutes.get("/:id", validate(leadByIdSchema), controller.getById);
leadRoutes.post("/", validate(createLeadSchema), controller.create);
leadRoutes.patch("/:id", validate(updateLeadSchema), controller.update);
leadRoutes.delete("/:id", requireRole("admin"), validate(leadByIdSchema), controller.delete);
