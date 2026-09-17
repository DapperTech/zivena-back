import { InferSchemaType, Schema, model, models } from "mongoose";

const addressSchema = new Schema(
  {
    street: { type: String, default: null },
    externalNumber: { type: String, default: null },
    internalNumber: { type: String, default: null },
    neighborhood: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: null },
    postalCode: { type: String, default: null },
    references: { type: String, default: null }
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null
    },
    sku: { type: String, default: null },
    name: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    quotationId: {
      type: Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
      index: true
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true
    },
    products: {
      type: [orderItemSchema],
      required: true,
      default: []
    },
    shippingAddress: {
      type: addressSchema,
      default: null
    },
    status: {
      type: String,
      enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "MXN",
      uppercase: true
    },
    orderedAt: {
      type: Date,
      default: null
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

orderSchema.index({ clientId: 1, createdAt: -1 });

export type OrderDocument = InferSchemaType<typeof orderSchema> & { _id: { toString(): string } };
export const OrderModel = models.Order || model("Order", orderSchema);
