import { BaseController } from "../../shared/controllers/BaseController";
import { OrderService } from "./order.service";

export class OrderController extends BaseController {
  constructor(private readonly orderService: OrderService) {
    super();
  }

  list = this.execute(async (_req, res) => {
    const orders = await this.orderService.listOrders();
    this.ok(res, orders);
  });

  getById = this.execute(async (req, res) => {
    const order = await this.orderService.getOrderById(String(req.params.id));
    this.ok(res, order);
  });

  create = this.execute(async (req, res) => {
    const order = await this.orderService.createOrder(req.body);
    this.ok(res, order, 201);
  });

  update = this.execute(async (req, res) => {
    const order = await this.orderService.updateOrder(String(req.params.id), req.body);
    this.ok(res, order);
  });
}
