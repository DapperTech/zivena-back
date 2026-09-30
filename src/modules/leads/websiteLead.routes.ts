import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { LeadController } from "./lead.controller";
import { LeadRepository } from "./lead.repository";
import { LeadService } from "./lead.service";
import { submitWebsiteLeadSchema } from "./websiteLead.dto";
import { websiteLeadLimiter } from "./websiteLeadLimiter";
import { QuotationRepository } from "../quotations/quotation.repository";
import { QuotationService } from "../quotations/quotation.service";

export const createWebsiteLeadRoutes = (service: LeadService): Router => {
  const router = Router();
  const controller = new LeadController(service);
  router.post("/", websiteLeadLimiter, validate(submitWebsiteLeadSchema), controller.submitWebsite);
  return router;
};

export const websiteLeadRoutes = createWebsiteLeadRoutes(new LeadService(
  new LeadRepository(),
  new QuotationService(new QuotationRepository())
));
