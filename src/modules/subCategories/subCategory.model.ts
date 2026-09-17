import { Model, Schema, model, models } from "mongoose";
import { SubCategoryEntity } from "./subCategory.types";

type SubCategoryRecord = Omit<SubCategoryEntity, "databaseId">;

const subCategorySchema = new Schema<SubCategoryRecord>(
  {
    id: { type: String, required: true },
    categoryId: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    url: { type: String, required: true },
    sortOrder: { type: Number, required: true },
    source: {
      portal: { type: String, required: true },
      url: { type: String, required: true },
      extractedAt: { type: String, required: true }
    }
  },
  { collection: "subcategories", id: false, versionKey: false }
);

export const SubCategoryModel = (models.SubCategory as Model<SubCategoryRecord> | undefined) ??
  model<SubCategoryRecord>("SubCategory", subCategorySchema);
