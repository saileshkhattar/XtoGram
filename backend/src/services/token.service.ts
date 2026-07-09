import jwt from "jsonwebtoken";
import { type Types } from "mongoose";
import { env } from "../config/env.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { sha256, randomToken } from "../utils/hash.js";

export type TokenMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

type UserId = Types.ObjectId | string;

export function signAccessToken(userId: UserId): string {
  return jwt.sign({ sub: userId.toString() }, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtl,
  });
}

export async function issueRefreshToken(
  userId: UserId,
  meta: TokenMeta = {},
): Promise<string> {
  const raw = randomToken(32);
  const tokenHash = sha256(raw);
  const expiresAt = new Date(
    Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  );

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
    createdByIp: meta.ip || null,
    userAgent: meta.userAgent || null,
  });

  return raw; // raw value goes to the client; only the hash is stored
}

export async function issueTokenPair(
  userId: UserId,
  meta: TokenMeta = {},
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = signAccessToken(userId);
  const refreshToken = await issueRefreshToken(userId, meta);
  return { accessToken, refreshToken };
}

// Rotates a refresh token: validates the old one, revokes it, issues a
// new pair. Detects reuse of an already-revoked token as a compromise
// signal and nukes every session for that user if it happens.
export async function rotateRefreshToken(
  rawToken: string,
  meta: TokenMeta = {},
): Promise<{ accessToken: string; refreshToken: string; userId: Types.ObjectId }> {
  const tokenHash = sha256(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash });

  if (!existing) {
    throw new Error("Invalid refresh token");
  }

  if (existing.revoked) {
    await RefreshToken.updateMany(
      { userId: existing.userId, revoked: false },
      { revoked: true },
    );
    throw new Error("Refresh token reuse detected — all sessions revoked");
  }

  if (existing.expiresAt < new Date()) {
    throw new Error("Refresh token expired");
  }

  const accessToken = signAccessToken(existing.userId);
  const newRawRefresh = randomToken(32);
  const newHash = sha256(newRawRefresh);
  const newExpiresAt = new Date(
    Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  );

  await RefreshToken.create({
    userId: existing.userId,
    tokenHash: newHash,
    expiresAt: newExpiresAt,
    createdByIp: meta.ip || null,
    userAgent: meta.userAgent || null,
  });

  existing.revoked = true;
  existing.replacedByTokenHash = newHash;
  await existing.save();

  return { accessToken, refreshToken: newRawRefresh, userId: existing.userId };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = sha256(rawToken);
  await RefreshToken.updateOne({ tokenHash }, { revoked: true });
}

export async function revokeAllUserTokens(userId: UserId): Promise<void> {
  await RefreshToken.updateMany({ userId, revoked: false }, { revoked: true });
}
