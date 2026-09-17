import { InferSchemaType, Schema, model, models } from "mongoose";

const productVisibilitySchema = new Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    isVisible: {
      type: Boolean,
      required: true,
      default: true,
      index: true
    },
    updatedByUid: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    collection: "productVisibility",
    timestamps: true,
    versionKey: false
  }
);

export type ProductVisibilityDocument = InferSchemaType<typeof productVisibilitySchema> & {
  _id: { toString(): string };
};

export const ProductVisibilityModel =
  models.ProductVisibility || model("ProductVisibility", productVisibilitySchema);
