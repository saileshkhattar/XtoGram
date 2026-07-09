import { resend } from "../config/resend.js";
import { env } from "../config/env.js";

type EmailPayload = {
  to: string;
  linkToken: string;
};

type VerificationEmailPayload = EmailPayload & {
  otp: string;
};

export async function sendVerificationEmail({
  to,
  otp,
  linkToken,
}: VerificationEmailPayload): Promise<void> {
  const link = `${env.appScheme}://verify-email?token=${linkToken}`;
  await resend.emails.send({
    from: env.emailFrom,
    to,
    subject: "Verify your email — Xtogram",
    html: `
      <div style="font-family: sans-serif; background:#000; color:#fff; padding:32px;">
        <h2 style="color:#fff;">Verify your email</h2>
        <p style="color:#9A9A9E;">Enter this code in the app:</p>
        <p style="font-size:32px; letter-spacing:8px; font-weight:700;">${otp}</p>
        <p style="color:#9A9A9E;">Or tap the button below:</p>
        <a href="${link}" style="display:inline-block; background:#8B5CF6; color:#fff; padding:12px 24px; border-radius:10px; text-decoration:none;">Verify Email</a>
        <p style="color:#6E6D6B; font-size:12px;">This code expires in 10 minutes.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  to,
  linkToken,
}: EmailPayload): Promise<void> {
  const link = `${env.appScheme}://reset-password?token=${linkToken}`;
  await resend.emails.send({
    from: env.emailFrom,
    to,
    subject: "Reset your password — Xtogram",
    html: `
      <div style="font-family: sans-serif; background:#000; color:#fff; padding:32px;">
        <h2 style="color:#fff;">Reset your password</h2>
        <p style="color:#9A9A9E;">Tap the button below to choose a new password:</p>
        <a href="${link}" style="display:inline-block; background:#8B5CF6; color:#fff; padding:12px 24px; border-radius:10px; text-decoration:none;">Reset Password</a>
        <p style="color:#6E6D6B; font-size:12px;">This link expires in 15 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}
