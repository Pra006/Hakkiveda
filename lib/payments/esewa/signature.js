/**
 * eSewa ePay V2 — HMAC-SHA256 signature helpers.
 *
 * The signature is Base64(HMAC-SHA256(secretKey, signedMessage)) where
 * signedMessage joins each signed field as `name=value` with commas, in the
 * exact order named by `signed_field_names`.
 *
 * SERVER-SIDE ONLY. Never invoke from the browser.
 */

import crypto from "crypto";
import { getEsewaConfig } from "./config";

/**
 * Build the message that eSewa signs.
 * Values are used as-is (no URL encoding, no quoting), matching eSewa's spec.
 */
function buildMessage(fields, signedFieldNames) {
  return signedFieldNames
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => `${name}=${fields[name] ?? ""}`)
    .join(",");
}

/**
 * Generate the ePay V2 request signature.
 * By default, eSewa signs `total_amount,transaction_uuid,product_code`.
 */
export function generateEsewaSignature({
  total_amount,
  transaction_uuid,
  product_code,
  signedFieldNames = "total_amount,transaction_uuid,product_code",
  secretKey,
}) {
  const key = secretKey || getEsewaConfig().secretKey;
  const message = buildMessage(
    { total_amount, transaction_uuid, product_code },
    signedFieldNames
  );
  return crypto.createHmac("sha256", key).update(message).digest("base64");
}

/**
 * Verify the signature attached to eSewa's callback response.
 * eSewa lists the fields it signed under `signed_field_names` in the response.
 */
export function verifyEsewaResponseSignature(response, secretKey) {
  if (!response || typeof response !== "object") return false;
  const { signed_field_names, signature } = response;
  if (!signed_field_names || !signature) return false;

  const key = secretKey || getEsewaConfig().secretKey;
  const message = buildMessage(response, signed_field_names);
  const expected = crypto.createHmac("sha256", key).update(message).digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Decode the base64-encoded JSON returned in the `data` query parameter of
 * eSewa's success redirect. Returns null on malformed input.
 */
export function decodeEsewaResponse(base64) {
  if (!base64 || typeof base64 !== "string") return null;
  try {
    const json = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}
