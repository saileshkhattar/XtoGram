import { Guest } from "../models/Guest.js";
import { signGuestToken } from "./token.service.js";
import { AppError } from "../utils/appError.js";
import { env } from "../config/env.js";

export async function startGuestSession(deviceId: string, ip?: string) {
  const guest = await Guest.findOneAndUpdate(
    { deviceId },
    {
      $set: { lastSeenAt: new Date() },
      $setOnInsert: { firstIp: ip ?? null },
    },
    { upsert: true, new: true },
  );

  if (!guest) throw new AppError("Could not start guest session", 500);

  return {
    accessToken: signGuestToken(guest._id),
    guest: {
      id: guest._id,
      remaining: Math.max(0, env.guestFreeGenerations - guest.generationsUsed),
    },
  };
}

function remainingOf(guest: { generationsUsed: number }): number {
  return Math.max(0, env.guestFreeGenerations - guest.generationsUsed);
}

export async function reserveGuestGeneration(guestId: string, tweetId: string) {
  const updated = await Guest.findOneAndUpdate(
    {
      _id: guestId,
      generationsUsed: { $lt: env.guestFreeGenerations },
      usedTweetIds: { $ne: tweetId },
    },
    { $inc: { generationsUsed: 1 }, $push: { usedTweetIds: tweetId } },
    { new: true },
  );
  if (updated) return { charged: true, remaining: remainingOf(updated) };

  const guest = await Guest.findById(guestId);
  if (!guest) throw new AppError("Guest session not found", 401);

  if (guest.usedTweetIds.includes(tweetId)) {
    return { charged: false, remaining: remainingOf(guest) };
  }
  throw new AppError(
    "Free limit reached. Sign in to continue.",
    403,
    "GUEST_LIMIT_REACHED",
  );
}

export async function refundGuestGeneration(guestId: string, tweetId: string) {
  await Guest.updateOne(
    { _id: guestId, usedTweetIds: tweetId },
    { $inc: { generationsUsed: -1 }, $pull: { usedTweetIds: tweetId } },
  );
}