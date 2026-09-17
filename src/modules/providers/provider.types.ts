import { Contact, Metadata } from "../../shared/types/common";

export type ProviderFiscalData = {
  businessName?: string;
  taxId?: string;
  taxRegime?: string;
  address?: string;
};

export type ProviderEntity = {
  id: string;
  name: string;
  fiscalData: ProviderFiscalData;
  logo?: string;
  contact: Contact;
  metadata: Metadata;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
