import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import { RequestController } from "./request.controller";
import { createRequestSchema, requestByIdSchema, updateRequestSchema } from "./request.dto";
import { RequestRepository } from "./request.repository";
import { RequestService } from "./request.service";

const requestRepository = new RequestRepository();
const requestService = new RequestService(requestRepository);
const requestController = new RequestController(requestService);

export const requestRoutes = Router();

requestRoutes.use(authGuard, requireRole("admin", "sales"));

requestRoutes.get("/", requestController.list);
requestRoutes.get("/:id", validate(requestByIdSchema), requestController.getById);
requestRoutes.post("/", requireRole("admin"), validate(createRequestSchema), requestController.create);
requestRoutes.patch("/:id", requireRole("admin"), validate(updateRequestSchema), requestController.update);
