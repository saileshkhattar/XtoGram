import bcrypt from "bcryptjs";
import crypto from "crypto";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// For tokens/OTPs — sha256 is fine here (not a password, just needs to be
// irreversible so a leaked DB doesn't hand out valid tokens directly).
export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}
