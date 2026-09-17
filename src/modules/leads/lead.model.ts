import { InferSchemaType, Schema, model, models } from "mongoose";

const leadProductSchema = new Schema(
  {
    productId: { type: String, default: null },
    sku: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    technique: { type: String, default: null, trim: true },
    imageUrl: { type: String, default: null, trim: true }
  },
  { _id: false }
);

const leadAssigneeSchema = new Schema(
  {
    userId: { type: String, default: null },
    uid: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: null, trim: true, lowercase: true }
  },
  { _id: false }
);

const leadSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    company: { type: String, default: null, trim: true },
    email: { type: String, default: null, trim: true, lowercase: true },
    phone: { type: String, default: null, trim: true },
    source: {
      type: String,
      enum: ["websiteQuote", "manual", "referral"],
      required: true,
      default: "manual",
      index: true
    },
    stage: {
      type: String,
      enum: ["new", "contacted", "proposal", "won", "lost"],
      required: true,
      default: "new",
      index: true
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
      default: "medium"
    },
    estimatedValue: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, required: true, default: "MXN", uppercase: true },
    deadline: { type: Date, default: null },
    message: { type: String, default: null },
    notes: { type: String, default: null },
    products: { type: [leadProductSchema], default: [] },
    assignedTo: { type: leadAssigneeSchema, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    lastActivityAt: { type: Date, required: true, default: Date.now, index: true }
  },
  {
    collection: "leads",
    timestamps: true,
    versionKey: false
  }
);

leadSchema.index({ stage: 1, lastActivityAt: -1 });
leadSchema.index({ "assignedTo.uid": 1, stage: 1 });

export type LeadDocument = InferSchemaType<typeof leadSchema> & {
  _id: { toString(): string };
};

export const LeadModel = models.Lead || model("Lead", leadSchema);
