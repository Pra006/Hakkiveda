/**
 * eSewa ePay V2 — Server-side transaction status verification.
 *
 * The status API answers whether eSewa considers a given transaction complete,
 * regardless of what the browser saw on redirect. Always call this before
 * marking a payment as PAID.
 */

import { getEsewaConfig } from "./config";

/**
 * Query eSewa for the authoritative status of a single transaction.
 *
 * @param {object} args
 * @param {string} args.transactionUuid  merchant-side UUID we sent
 * @param {number} args.totalAmount      total_amount we sent
 * @param {string} [args.productCode]    defaults to config.productCode
 * @returns {Promise<{ ok: boolean, status?: string, refId?: string|null, raw?: any, error?: string }>}
 */
export async function fetchEsewaStatus({ transactionUuid, totalAmount, productCode }) {
  const cfg = getEsewaConfig();
  const params = new URLSearchParams({
    product_code: productCode || cfg.productCode,
    total_amount: String(totalAmount),
    transaction_uuid: transactionUuid,
  });
  const url = `${cfg.statusUrl}?${params.toString()}`;

  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const raw = await res.json();
    // eSewa returns { product_code, transaction_uuid, total_amount, status, ref_id }.
    return {
      ok: true,
      status: raw?.status || "UNKNOWN",
      refId: raw?.ref_id || null,
      raw,
    };
  } catch (err) {
    return { ok: false, error: err?.message || "Network error" };
  }
}

/**
 * Map an eSewa status string to our internal CustomerPaymentStatus.
 * Returns null for statuses that should be treated as ambiguous / not-final.
 */
export function mapEsewaStatus(status) {
  switch (String(status || "").toUpperCase()) {
    case "COMPLETE":
    case "COMPLETED":
      return "COMPLETED";
    case "PENDING":
    case "AMBIGUOUS":
      return null; // do not finalise
    case "FULL_REFUND":
    case "PARTIAL_REFUND":
      return "REFUNDED";
    case "FAILED":
    case "NOT_FOUND":
    case "CANCELED":
    case "CANCELLED":
      return "FAILED";
    default:
      return null;
  }
}
