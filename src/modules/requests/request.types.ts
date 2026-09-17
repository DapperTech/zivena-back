import { Metadata } from "../../shared/types/common";

export type RequestProductItem = {
  productId?: string;
  sku?: string;
  quantity: number;
};

export type RequestEntity = {
  id: string;
  products: RequestProductItem[];
  name: string;
  phone: string;
  email?: string;
  postalCode?: string;
  status: "pending" | "inReview" | "resolved" | "rejected";
  metadata: Metadata;
  createdAt: Date;
  updatedAt: Date;
};
