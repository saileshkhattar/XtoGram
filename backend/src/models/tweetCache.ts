import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

const tweetCacheSchema = new mongoose.Schema(
  {
    tweetId: { type: String, required: true, unique: true, index: true },
    rawData: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

tweetCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type TweetCacheAttrs = InferSchemaType<typeof tweetCacheSchema>;
export type TweetCacheDocument = HydratedDocument<TweetCacheAttrs>;

export const TweetCache = mongoose.model<TweetCacheAttrs>(
  "TweetCache",
  tweetCacheSchema,
);