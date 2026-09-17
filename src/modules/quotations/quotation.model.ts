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

const quotationContactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, default: null, trim: true },
    email: { type: String, default: null, trim: true, lowercase: true },
    phone: { type: String, default: null, trim: true }
  },
  { _id: false }
);

const quotationAssigneeSchema = new Schema(
  {
    userId: { type: String, default: null },
    uid: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: null, trim: true, lowercase: true }
  },
  { _id: false }
);

const quotationItemSchema = new Schema(
  {
    productId: { type: String, default: null, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null, trim: true },
    technique: { type: String, default: null, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const quotationSchema = new Schema(
  {
    folio: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
      unique: true,
      sparse: true,
      index: true
    },
    source: {
      type: String,
      enum: ["manual", "website"],
      required: true,
      default: "manual",
      index: true
    },
    contact: {
      type: quotationContactSchema,
      required: true
    },
    products: {
      type: [quotationItemSchema],
      required: true,
      default: []
    },
    address: {
      type: addressSchema,
      default: null
    },
    status: {
      type: String,
      enum: ["draft", "generated", "sent", "approved", "rejected", "expired"],
      default: "draft",
      index: true
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    taxRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 16
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      required: true,
      default: "MXN",
      uppercase: true
    },
    expiresAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: null
    },
    terms: {
      type: String,
      default: null
    },
    assignedTo: {
      type: quotationAssigneeSchema,
      default: null
    },
    generatedAt: {
      type: Date,
      default: null
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    collection: "quotations",
    timestamps: true,
    versionKey: false
  }
);

quotationSchema.index({ status: 1, updatedAt: -1 });
quotationSchema.index({ "assignedTo.uid": 1, updatedAt: -1 });

export type QuotationDocument = InferSchemaType<typeof quotationSchema> & {
  _id: { toString(): string };
};

export const QuotationModel = models.Quotation || model("Quotation", quotationSchema);
