import { ProductVisibilityRepository } from "./productVisibility.repository";
import { ProductVisibilityEntity } from "./productVisibility.types";

export class ProductVisibilityService {
  constructor(private readonly repository: ProductVisibilityRepository) {}

  list(): Promise<ProductVisibilityEntity[]> {
    return this.repository.findAll();
  }

  setVisibility(
    sku: string,
    isVisible: boolean,
    updatedByUid?: string
  ): Promise<ProductVisibilityEntity> {
    return this.repository.setVisibility(sku, isVisible, updatedByUid);
  }
}
