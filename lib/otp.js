import crypto from "crypto";
import bcrypt from "bcryptjs";

export const OTP_EXPIRY_MINUTES = 5;
export const MAX_ATTEMPTS = 5;
export const VERIFY_TOKEN_GRACE_MINUTES = 15;

export function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

export async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

export async function compareOtp(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

export function generateVerifyToken() {
  return crypto.randomUUID();
}
