import { OAuth2Client } from "google-auth-library";
import { type Types } from "mongoose";
import { User, type UserDocument } from "../models/User.js";
import {
  VerificationToken,
  type VerificationPurpose,
} from "../models/VerificationToken.js";
import {
  hashPassword,
  comparePassword,
  sha256,
  randomToken,
} from "../utils/hash.js";
import { generateOtp } from "../utils/otp.js";
import { issueTokenPair, revokeAllUserTokens } from "./token.service.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "./email.service.js";
import { AppError } from "../utils/appError.js";
import { env } from "../config/env.js";
import { type TokenMeta } from "./token.service.js";

const googleClient = new OAuth2Client(env.googleClientId);

type PublicUser = {
  id: Types.ObjectId;
  email: string;
  name: string;
  emailVerified: boolean;
};

type SignupInput = {
  email: string;
  password: string;
  name?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type GoogleLoginInput = {
  idToken: string;
};

type EmailInput = {
  email: string;
};

type VerifyEmailOtpInput = EmailInput & {
  otp: string;
};

type VerifyEmailLinkInput = {
  token: string;
};

type ResetPasswordInput = VerifyEmailLinkInput & {
  newPassword: string;
};

function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
  };
}

async function createVerificationToken(
  userId: Types.ObjectId,
  purpose: VerificationPurpose,
  ttlMinutes: number,
): Promise<{ otp: string; linkTokenRaw: string }> {
  const otp = generateOtp();
  const linkTokenRaw = randomToken(24);

  await VerificationToken.deleteMany({ userId, purpose }); // clear any old pending ones first

  await VerificationToken.create({
    userId,
    purpose,
    otpHash: sha256(otp),
    linkTokenHash: sha256(linkTokenRaw),
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
  });

  return { otp, linkTokenRaw };
}

export async function signupUser(
  { email, password, name }: SignupInput,
  meta: TokenMeta,
): Promise<{ accessToken: string; refreshToken: string; user: PublicUser }> {
  const existing = await User.findOne({ email });
  if (existing)
    throw new AppError("An account with this email already exists", 409);

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email,
    passwordHash,
    name,
    provider: "password",
  });

  const { otp, linkTokenRaw } = await createVerificationToken(
    user._id,
    "email_verify",
    10,
  );

  console.log("otp", otp)
  await sendVerificationEmail({ to: email, otp, linkToken: linkTokenRaw });

  const tokens = await issueTokenPair(user._id, meta);
  return { ...tokens, user: toPublicUser(user) };
}

export async function loginUser(
  { email, password }: LoginInput,
  meta: TokenMeta,
): Promise<{ accessToken: string; refreshToken: string; user: PublicUser }> {
  const user = await User.findOne({ email });
  if (!user || user.provider !== "password" || !user.passwordHash) {
    throw new AppError("Invalid email or password", 401);
  }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new AppError("Invalid email or password", 401);

  const tokens = await issueTokenPair(user._id, meta);
  return { ...tokens, user: toPublicUser(user) };
}

export async function loginWithGoogle(
  { idToken }: GoogleLoginInput,
  meta: TokenMeta,
): Promise<{ accessToken: string; refreshToken: string; user: PublicUser }> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new AppError("Invalid Google token", 401);
  }

  let user = await User.findOne({ email: payload.email });
  if (!user) {
    user = await User.create({
      email: payload.email,
      name: payload.name || "",
      provider: "google",
      emailVerified: true, // Google already verified this email
    });
  }

  const tokens = await issueTokenPair(user._id, meta);
  return { ...tokens, user: toPublicUser(user) };
}

export async function verifyEmailWithOtp({
  email,
  otp,
}: VerifyEmailOtpInput): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("Invalid request", 400);

  const record = await VerificationToken.findOne({
    userId: user._id,
    purpose: "email_verify",
    used: false,
  });
  if (!record || record.expiresAt < new Date()) {
    throw new AppError("Code expired, please request a new one", 400);
  }
  if (record.attempts >= 5) {
    throw new AppError("Too many attempts, please request a new code", 429);
  }
  if (sha256(otp) !== record.otpHash) {
    record.attempts += 1;
    await record.save();
    throw new AppError("Incorrect code", 400);
  }

  user.emailVerified = true;
  await user.save();
  record.used = true;
  await record.save();
}

export async function verifyEmailWithLink({
  token,
}: VerifyEmailLinkInput): Promise<void> {
  const tokenHash = sha256(token);
  const record = await VerificationToken.findOne({
    linkTokenHash: tokenHash,
    purpose: "email_verify",
    used: false,
  });
  if (!record || record.expiresAt < new Date()) {
    throw new AppError("Link expired or invalid", 400);
  }

  const user = await User.findById(record.userId);
  if (!user) throw new AppError("Invalid request", 400);

  user.emailVerified = true;
  await user.save();
  record.used = true;
  await record.save();
}

export async function resendVerification({ email }: EmailInput): Promise<void> {
  const user = await User.findOne({ email });
  if (!user || user.emailVerified) return; // stay silent either way

  const { otp, linkTokenRaw } = await createVerificationToken(
    user._id,
    "email_verify",
    10,
  );
  await sendVerificationEmail({ to: email, otp, linkToken: linkTokenRaw });
}

export async function requestPasswordReset({ email }: EmailInput): Promise<void> {
  const user = await User.findOne({ email });
  // Always behave the same whether or not the user exists — prevents
  // email enumeration attacks.
  if (!user || user.provider !== "password") return;

  const { linkTokenRaw } = await createVerificationToken(
    user._id,
    "password_reset",
    15,
  );
  await sendPasswordResetEmail({ to: email, linkToken: linkTokenRaw });
}

export async function resetPassword({
  token,
  newPassword,
}: ResetPasswordInput): Promise<void> {
  const tokenHash = sha256(token);
  const record = await VerificationToken.findOne({
    linkTokenHash: tokenHash,
    purpose: "password_reset",
    used: false,
  });
  if (!record || record.expiresAt < new Date()) {
    throw new AppError("Reset link expired or invalid", 400);
  }

  const user = await User.findById(record.userId);
  if (!user) throw new AppError("Invalid request", 400);

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  record.used = true;
  await record.save();

  // Compromise-safe: kill every existing session on password reset.
  await revokeAllUserTokens(user._id);
}
