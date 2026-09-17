import { NotFoundAppError } from "../../shared/errors/AppError";
import { CreateOrderDto, UpdateOrderDto } from "./order.dto";
import { OrderRepository } from "./order.repository";
import { OrderEntity } from "./order.types";

export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async listOrders(): Promise<OrderEntity[]> {
    return this.orderRepository.findAll();
  }

  async getOrderById(id: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundAppError("Order not found");
    }

    return order;
  }

  async createOrder(payload: CreateOrderDto): Promise<OrderEntity> {
    return this.orderRepository.create(payload);
  }

  async updateOrder(id: string, payload: UpdateOrderDto): Promise<OrderEntity> {
    const order = await this.orderRepository.updateById(id, payload);
    if (!order) {
      throw new NotFoundAppError("Order not found");
    }

    return order;
  }
}
