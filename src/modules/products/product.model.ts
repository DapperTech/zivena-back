import { Model, Schema, model, models } from "mongoose";
import { ProductEntity } from "./product.types";

type ProductRecord = Omit<ProductEntity, "databaseId">;

const imageSchema = new Schema(
  {
    originalUrl: { type: String, required: true },
    mediaUrl: String,
    thumbnailUrl: String,
    url: String,
    title: String,
    alt: String,
    magentoProductId: String,
    source: String
  },
  { _id: false }
);

const availabilitySchema = new Schema(
  {
    status: { type: String, required: true },
    availableQuantity: Number,
    text: { type: String, required: true }
  },
  { _id: false }
);

const variantOptionSchema = new Schema(
  {
    attributeId: { type: String, required: true },
    attributeCode: { type: String, required: true },
    attribute: { type: String, required: true },
    optionId: { type: String, required: true },
    value: { type: String, required: true }
  },
  { _id: false }
);

const variantSchema = new Schema(
  {
    magentoProductId: { type: String, required: true },
    options: { type: [variantOptionSchema], default: [] },
    images: { type: [imageSchema], default: [] }
  },
  { _id: false }
);

const attributeSchema = new Schema(
  {
    name: { type: String, required: true },
    value: { type: String, required: true }
  },
  { _id: false }
);

const specificationSchema = new Schema(
  {
    section: { type: String, required: true },
    attributes: { type: [attributeSchema], default: [] }
  },
  { _id: false }
);

const sourceSchema = new Schema(
  {
    portal: { type: String, required: true },
    url: { type: String, required: true },
    extractedAt: { type: String, required: true }
  },
  { _id: false }
);

const referenceSourceSchema = new Schema(
  {
    type: { type: String, enum: ["category", "subcategory"], required: true },
    categoryId: { type: String, required: true },
    subcategoryId: String,
    url: { type: String, required: true }
  },
  { _id: false }
);

const productSchema = new Schema<ProductRecord>(
  {
    id: { type: String, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    magentoProductId: { type: String, required: true },
    productType: { type: String, required: true },
    categoryIds: { type: [String], default: [] },
    subcategoryIds: { type: [String], default: [] },
    description: { type: String, required: true },
    featured: { type: Boolean, required: true },
    availability: { type: availabilitySchema, required: true },
    images: { type: [imageSchema], default: [] },
    variants: { type: [variantSchema], default: [] },
    specifications: { type: [specificationSchema], default: [] },
    additionalAttributes: { type: [attributeSchema], default: [] },
    meta: {
      title: String,
      description: String,
      ogTitle: String
    },
    sources: { type: [referenceSourceSchema], default: [] },
    source: { type: sourceSchema, required: true }
  },
  {
    collection: "products",
    id: false,
    versionKey: false
  }
);

export const ProductModel = (models.Product as Model<ProductRecord> | undefined) ??
  model<ProductRecord>("Product", productSchema);
