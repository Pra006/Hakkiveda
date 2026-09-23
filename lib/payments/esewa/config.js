/**
 * eSewa ePay V2 — Environment-aware configuration.
 *
 * Switching to production requires only environment variables, no code changes.
 * The secret key is used server-side only and MUST NOT be exposed to the client.
 *
 * Docs: https://developer.esewa.com.np/pages/Epay-V2
 */

const SANDBOX = {
  paymentUrl: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  statusUrl: "https://rc.esewa.com.np/api/epay/transaction/status/",
  productCode: "EPAYTEST",
};

const PRODUCTION = {
  paymentUrl: "https://epay.esewa.com.np/api/epay/main/v2/form",
  statusUrl: "https://esewa.com.np/api/epay/transaction/status/",
};

export function getEsewaConfig() {
  const env = (process.env.ESEWA_ENV || "sandbox").toLowerCase();
  const isProduction = env === "production" || env === "live";

  const base = isProduction ? PRODUCTION : SANDBOX;

  const cfg = {
    env: isProduction ? "production" : "sandbox",
    paymentUrl: process.env.ESEWA_PAYMENT_URL || base.paymentUrl,
    statusUrl: process.env.ESEWA_STATUS_URL || base.statusUrl,
    productCode: process.env.ESEWA_PRODUCT_CODE || base.productCode || "",
    secretKey: process.env.ESEWA_SECRET_KEY || "",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  };

  if (!cfg.productCode) throw new Error("ESEWA_PRODUCT_CODE is not configured");
  if (!cfg.secretKey) throw new Error("ESEWA_SECRET_KEY is not configured");
  if (!cfg.appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  return cfg;
}

/** URL eSewa should redirect to on successful payment. */
export function esewaSuccessUrl() {
  return `${getEsewaConfig().appUrl.replace(/\/$/, "")}/api/payment/esewa/success`;
}

/** URL eSewa should redirect to on failed/cancelled payment. */
export function esewaFailureUrl() {
  return `${getEsewaConfig().appUrl.replace(/\/$/, "")}/api/payment/esewa/failure`;
}
