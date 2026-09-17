import { InferSchemaType, Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    profileImage: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: ["admin", "sales"],
      default: "sales"
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

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: { toString(): string } };
export const UserModel = models.User || model("User", userSchema);
