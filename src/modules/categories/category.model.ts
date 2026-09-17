import { Model, Schema, model, models } from "mongoose";
import { CategoryEntity } from "./category.types";

type CategoryRecord = Omit<CategoryEntity, "databaseId">;

const categorySchema = new Schema<CategoryRecord>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    url: { type: String, required: true },
    image: { type: String, required: true },
    sortOrder: { type: Number, required: true },
    source: {
      portal: { type: String, required: true },
      url: { type: String, required: true },
      extractedAt: { type: String, required: true }
    }
  },
  { collection: "categories", id: false, versionKey: false }
);

export const CategoryModel = (models.Category as Model<CategoryRecord> | undefined) ??
  model<CategoryRecord>("Category", categorySchema);
