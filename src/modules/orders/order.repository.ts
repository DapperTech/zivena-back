import { IRepository } from "../../shared/repositories/IRepository";
import { CreateOrderDto, UpdateOrderDto } from "./order.dto";
import { OrderModel } from "./order.model";
import { OrderEntity } from "./order.types";

const mapStringId = (value?: { toString(): string } | null): string | undefined => {
  return value ? value.toString() : undefined;
};

const mapToEntity = (doc: {
  _id: { toString(): string };
  quotationId?: { toString(): string } | null;
  clientId: { toString(): string };
  products: OrderEntity["products"];
  shippingAddress?: OrderEntity["shippingAddress"];
  status: OrderEntity["status"];
  paymentStatus: OrderEntity["paymentStatus"];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  orderedAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}): OrderEntity => ({
  id: doc._id.toString(),
  quotationId: mapStringId(doc.quotationId),
  clientId: doc.clientId.toString(),
  products: doc.products,
  shippingAddress: doc.shippingAddress,
  status: doc.status,
  paymentStatus: doc.paymentStatus,
  subtotal: doc.subtotal,
  tax: doc.tax,
  total: doc.total,
  currency: doc.currency,
  orderedAt: doc.orderedAt,
  metadata: doc.metadata,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

export class OrderRepository implements IRepository<OrderEntity, CreateOrderDto, UpdateOrderDto> {
  async findAll(): Promise<OrderEntity[]> {
    const docs = await OrderModel.find().sort({ createdAt: -1 });
    return docs.map((doc) => mapToEntity(doc));
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const doc = await OrderModel.findById(id);
    return doc ? mapToEntity(doc) : null;
  }

  async create(payload: CreateOrderDto): Promise<OrderEntity> {
    const doc = await OrderModel.create(payload);
    return mapToEntity(doc);
  }

  async updateById(id: string, payload: UpdateOrderDto): Promise<OrderEntity | null> {
    const doc = await OrderModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true
    });

    return doc ? mapToEntity(doc) : null;
  }
}
