import { CreateSubCategoryDto, UpdateSubCategoryDto } from "./subCategory.dto";
import { ProductModel } from "../products/product.model";
import { SubCategoryModel } from "./subCategory.model";
import { SubCategoryEntity } from "./subCategory.types";

const mapToEntity = (document: Record<string, unknown>): SubCategoryEntity => {
  const { _id, ...subcategory } = document;
  return {
    databaseId: String(_id),
    ...(subcategory as Omit<SubCategoryEntity, "databaseId">)
  };
};

export class SubCategoryRepository {
  async findAll(): Promise<SubCategoryEntity[]> {
    const documents = await SubCategoryModel.find().sort({ categoryId: 1, sortOrder: 1 }).lean();
    return documents.map((document) => mapToEntity(document as unknown as Record<string, unknown>));
  }

  async findById(id: string): Promise<SubCategoryEntity | null> {
    const document = await SubCategoryModel.findOne({ id }).lean();
    return document ? mapToEntity(document as unknown as Record<string, unknown>) : null;
  }

  async create(payload: CreateSubCategoryDto): Promise<SubCategoryEntity> {
    const document = await SubCategoryModel.create(payload);
    return mapToEntity(document.toObject() as unknown as Record<string, unknown>);
  }

  async updateById(id: string, payload: UpdateSubCategoryDto): Promise<SubCategoryEntity | null> {
    const document = await SubCategoryModel.findOneAndUpdate({ id }, payload, {
      new: true,
      runValidators: true
    }).lean();
    return document ? mapToEntity(document as unknown as Record<string, unknown>) : null;
  }

  async countProducts(id: string): Promise<number> {
    return ProductModel.countDocuments({ subcategoryIds: id });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await SubCategoryModel.deleteOne({ id });
    return result.deletedCount === 1;
  }
}
