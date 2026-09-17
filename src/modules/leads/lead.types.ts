import { Metadata } from "../../shared/types/common";

export type LeadStage = "new" | "contacted" | "proposal" | "won" | "lost";
export type LeadSource = "websiteQuote" | "manual" | "referral";
export type LeadPriority = "low" | "medium" | "high";

export type LeadProductItem = {
  productId?: string;
  sku: string;
  name: string;
  quantity: number;
  technique?: string;
  imageUrl?: string;
};

export type LeadAssignee = {
  userId?: string;
  uid: string;
  name: string;
  email?: string;
};

export type LeadEntity = {
  id: string;
  title: string;
  contactName: string;
  company?: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  stage: LeadStage;
  priority: LeadPriority;
  estimatedValue: number;
  currency: string;
  deadline?: Date;
  message?: string;
  notes?: string;
  products: LeadProductItem[];
  assignedTo?: LeadAssignee;
  metadata: Metadata;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
