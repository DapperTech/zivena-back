import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import { OrderController } from "./order.controller";
import { createOrderSchema, orderByIdSchema, updateOrderSchema } from "./order.dto";
import { OrderRepository } from "./order.repository";
import { OrderService } from "./order.service";

const orderRepository = new OrderRepository();
const orderService = new OrderService(orderRepository);
const orderController = new OrderController(orderService);

export const orderRoutes = Router();

orderRoutes.use(authGuard, requireRole("admin", "sales"));

orderRoutes.get("/", orderController.list);
orderRoutes.get("/:id", validate(orderByIdSchema), orderController.getById);
orderRoutes.post("/", requireRole("admin"), validate(createOrderSchema), orderController.create);
orderRoutes.patch("/:id", requireRole("admin"), validate(updateOrderSchema), orderController.update);
