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

const clientSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
      index: true
    },
    addresses: {
      type: [addressSchema],
      default: []
    },
    phone: {
      type: String,
      default: null,
      trim: true
    },
    fiscalData: {
      businessName: { type: String, default: null },
      taxId: { type: String, default: null },
      taxRegime: { type: String, default: null }
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type ClientDocument = InferSchemaType<typeof clientSchema> & { _id: { toString(): string } };
export const ClientModel = models.Client || model("Client", clientSchema);
