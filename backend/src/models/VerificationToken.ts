import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const verificationTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["email_verify", "password_reset"],
      required: true,
    },
    otpHash: { type: String, default: null },
    linkTokenHash: { type: String, default: null },
    attempts: { type: Number, default: 0 },
    used: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type VerificationPurpose = "email_verify" | "password_reset";
export type VerificationTokenAttrs = InferSchemaType<
  typeof verificationTokenSchema
>;
export type VerificationTokenDocument = HydratedDocument<VerificationTokenAttrs>;

export const VerificationToken = mongoose.model<VerificationTokenAttrs>(
  "VerificationToken",
  verificationTokenSchema,
);
