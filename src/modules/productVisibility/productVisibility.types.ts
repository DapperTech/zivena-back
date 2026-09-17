export type ProductVisibilityEntity = {
  id: string;
  sku: string;
  isVisible: boolean;
  updatedByUid?: string;
  createdAt: Date;
  updatedAt: Date;
};
