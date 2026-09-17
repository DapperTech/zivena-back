import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import { ClientController } from "./client.controller";
import { clientByIdSchema, createClientSchema, updateClientSchema } from "./client.dto";
import { ClientRepository } from "./client.repository";
import { ClientService } from "./client.service";

const clientRepository = new ClientRepository();
const clientService = new ClientService(clientRepository);
const clientController = new ClientController(clientService);

export const clientRoutes = Router();

clientRoutes.use(authGuard, requireRole("admin", "sales"));

clientRoutes.get("/", clientController.list);
clientRoutes.get("/:id", validate(clientByIdSchema), clientController.getById);
clientRoutes.post("/", requireRole("admin"), validate(createClientSchema), clientController.create);
clientRoutes.patch("/:id", requireRole("admin"), validate(updateClientSchema), clientController.update);
