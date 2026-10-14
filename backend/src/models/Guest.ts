import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const guestSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true },
    generationsUsed: { type: Number, default: 0 },
    usedTweetIds: { type: [String], default: [] },
    firstIp: { type: String, default: null },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export type GuestAttrs = InferSchemaType<typeof guestSchema>;
export type GuestDocument = HydratedDocument<GuestAttrs>;

export const Guest = mongoose.model<GuestAttrs>("Guest", guestSchema);