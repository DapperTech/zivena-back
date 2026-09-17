import { InferSchemaType, Schema, model, models } from "mongoose";

const requestProductItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null
    },
    sku: {
      type: String,
      default: null,
      trim: true,
      uppercase: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const requestSchema = new Schema(
  {
    products: {
      type: [requestProductItemSchema],
      required: true,
      default: []
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true
    },
    postalCode: {
      type: String,
      default: null,
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "inReview", "resolved", "rejected"],
      default: "pending",
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

requestSchema.index({ createdAt: -1 });

export type RequestDocument = InferSchemaType<typeof requestSchema> & { _id: { toString(): string } };
export const RequestModel = models.Request || model("Request", requestSchema);
