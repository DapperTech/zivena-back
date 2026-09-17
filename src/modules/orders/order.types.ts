import { Address, Metadata } from "../../shared/types/common";

export type OrderItem = {
  productId?: string;
  sku?: string;
  name?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  metadata?: Metadata;
};

export type OrderEntity = {
  id: string;
  quotationId?: string;
  clientId: string;
  products: OrderItem[];
  shippingAddress?: Address;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  orderedAt?: Date;
  metadata: Metadata;
  createdAt: Date;
  updatedAt: Date;
};
