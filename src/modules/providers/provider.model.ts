import { InferSchemaType, Schema, model, models } from "mongoose";

const providerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    fiscalData: {
      businessName: { type: String, default: null },
      taxId: { type: String, default: null },
      taxRegime: { type: String, default: null },
      address: { type: String, default: null }
    },
    logo: {
      type: String,
      default: null
    },
    contact: {
      name: { type: String, default: null },
      email: { type: String, default: null },
      phone: { type: String, default: null },
      position: { type: String, default: null }
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

providerSchema.index({ "contact.email": 1 });

export type ProviderDocument = InferSchemaType<typeof providerSchema> & { _id: { toString(): string } };
export const ProviderModel = models.Provider || model("Provider", providerSchema);
