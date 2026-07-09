import crypto from "crypto";

export function generateOtp(): string {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}
