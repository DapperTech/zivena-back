import { ProductVisibilityModel } from "./productVisibility.model";
import { ProductVisibilityEntity } from "./productVisibility.types";

const mapEntity = (document: {
  _id: { toString(): string };
  sku: string;
  isVisible: boolean;
  updatedByUid?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProductVisibilityEntity => ({
  id: document._id.toString(),
  sku: document.sku,
  isVisible: document.isVisible,
  updatedByUid: document.updatedByUid ?? undefined,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt
});

export class ProductVisibilityRepository {
  async findAll(): Promise<ProductVisibilityEntity[]> {
    const documents = await ProductVisibilityModel.find().sort({ updatedAt: -1 });
    return documents.map((document) => mapEntity(document));
  }

  async findHiddenSkus(): Promise<Set<string>> {
    const skus = await ProductVisibilityModel.distinct("sku", { isVisible: false });
    return new Set(skus.map((sku) => String(sku).toUpperCase()));
  }

  async setVisibility(
    sku: string,
    isVisible: boolean,
    updatedByUid?: string
  ): Promise<ProductVisibilityEntity> {
    const normalizedSku = sku.trim().toUpperCase();
    const document = await ProductVisibilityModel.findOneAndUpdate(
      { sku: normalizedSku },
      { $set: { isVisible, updatedByUid } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return mapEntity(document);
  }

  async deleteBySku(sku: string): Promise<void> {
    await ProductVisibilityModel.deleteOne({ sku: sku.trim().toUpperCase() });
  }
}
