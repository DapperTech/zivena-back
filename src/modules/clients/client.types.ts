import { Address, Metadata } from "../../shared/types/common";

export type ClientFiscalData = {
  businessName?: string;
  taxId?: string;
  taxRegime?: string;
};

export type ClientEntity = {
  id: string;
  name: string;
  email?: string;
  addresses: Address[];
  phone?: string;
  fiscalData: ClientFiscalData;
  metadata: Metadata;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
