import { CreateCategoryDto, UpdateCategoryDto } from "./category.dto";
import { CategoryModel } from "./category.model";
import { CatalogCategory, CategoryEntity } from "./category.types";
import { ProductModel } from "../products/product.model";

const mapToEntity = (document: Record<string, unknown>): CategoryEntity => {
  const { _id, ...category } = document;
  return { databaseId: String(_id), ...(category as Omit<CategoryEntity, "databaseId">) };
};

export class CategoryRepository {
  async findAll(): Promise<CatalogCategory[]> {
    const [documents, productCounts] = await Promise.all([
      CategoryModel.find().sort({ sortOrder: 1 }).lean(),
      ProductModel.aggregate<{ _id: string; count: number }>([
        {
          $lookup: {
            from: "productVisibility",
            localField: "sku",
            foreignField: "sku",
            as: "visibility"
          }
        },
        {
          $set: {
            isVisible: { $ifNull: [{ $arrayElemAt: ["$visibility.isVisible", 0] }, true] }
          }
        },
        { $match: { isVisible: true } },
        { $project: { categoryIds: 1 } },
        { $unwind: "$categoryIds" },
        { $group: { _id: "$categoryIds", count: { $sum: 1 } } }
      ])
    ]);
    const countById = new Map(productCounts.map((item) => [item._id, item.count]));
    return documents.map((document) => ({
      id: document.id,
      name: document.name,
      slug: document.slug,
      url: document.url,
      image: document.image,
      productCount: countById.get(document.id) ?? 0
    }));
  }

  async findById(id: string): Promise<CategoryEntity | null> {
    const document = await CategoryModel.findOne({ id }).lean();
    return document ? mapToEntity(document as unknown as Record<string, unknown>) : null;
  }

  async create(payload: CreateCategoryDto): Promise<CategoryEntity> {
    const document = await CategoryModel.create(payload);
    return mapToEntity(document.toObject() as unknown as Record<string, unknown>);
  }

  async updateById(id: string, payload: UpdateCategoryDto): Promise<CategoryEntity | null> {
    const document = await CategoryModel.findOneAndUpdate({ id }, payload, {
      new: true,
      runValidators: true
    }).lean();
    return document ? mapToEntity(document as unknown as Record<string, unknown>) : null;
  }

  async countProducts(id: string): Promise<number> {
    return ProductModel.countDocuments({ categoryIds: id });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await CategoryModel.deleteOne({ id });
    return result.deletedCount === 1;
  }
}
