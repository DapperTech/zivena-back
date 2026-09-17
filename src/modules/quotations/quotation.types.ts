import { Address, Metadata } from "../../shared/types/common";

export type QuotationStatus =
  | "draft"
  | "generated"
  | "sent"
  | "approved"
  | "rejected"
  | "expired";

export type QuotationSource = "manual" | "website";

export type QuotationContact = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
};

export type QuotationAssignee = {
  userId?: string;
  uid: string;
  name: string;
  email?: string;
};

export type QuotationItem = {
  productId?: string;
  sku: string;
  name: string;
  imageUrl?: string;
  technique?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  metadata: Metadata;
};

export type QuotationEntity = {
  id: string;
  folio: string;
  clientId?: string;
  leadId?: string;
  source: QuotationSource;
  contact: QuotationContact;
  products: QuotationItem[];
  address?: Address;
  status: QuotationStatus;
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  currency: string;
  expiresAt?: Date;
  notes?: string;
  terms?: string;
  assignedTo?: QuotationAssignee;
  generatedAt?: Date;
  metadata: Metadata;
  createdAt: Date;
  updatedAt: Date;
};
