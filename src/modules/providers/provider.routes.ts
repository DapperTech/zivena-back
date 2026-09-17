import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import { ProviderController } from "./provider.controller";
import { createProviderSchema, providerByIdSchema, updateProviderSchema } from "./provider.dto";
import { ProviderRepository } from "./provider.repository";
import { ProviderService } from "./provider.service";

const providerRepository = new ProviderRepository();
const providerService = new ProviderService(providerRepository);
const providerController = new ProviderController(providerService);

export const providerRoutes = Router();

providerRoutes.use(authGuard, requireRole("admin", "sales"));

providerRoutes.get("/", providerController.list);
providerRoutes.get("/:id", validate(providerByIdSchema), providerController.getById);
providerRoutes.post("/", requireRole("admin"), validate(createProviderSchema), providerController.create);
providerRoutes.patch("/:id", requireRole("admin"), validate(updateProviderSchema), providerController.update);
