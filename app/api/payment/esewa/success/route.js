import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEsewaConfig } from "@/lib/payments/esewa/config";
import { decodeEsewaResponse, verifyEsewaResponseSignature } from "@/lib/payments/esewa/signature";
import { verifyEsewaPayment, markPaymentFailed } from "@/lib/payments/esewa/service";

/**
 * GET /api/payment/esewa/success?data=<base64-json>
 *
 * eSewa redirects the customer here after a successful payment. We must not
 * trust the redirect alone — we decode, verify the signature, then hit
 * eSewa's status API to confirm the transaction before marking the order paid.
 */
async function handle(request) {
  const cfg = getEsewaConfig();
  const appUrl = cfg.appUrl.replace(/\/$/, "");
  const url = new URL(request.url);
  const dataParam =
    url.searchParams.get("data") ||
    (request.method === "POST" ? (await request.formData().catch(() => null))?.get("data") : null);

  const redirect = (status, orderNumber) => {
    const target = new URL(`${appUrl}/payment/esewa/result`);
    target.searchParams.set("status", status);
    if (orderNumber) target.searchParams.set("order", orderNumber);
    return NextResponse.redirect(target, { status: 303 });
  };

  if (!dataParam) return redirect("invalid");

  const decoded = decodeEsewaResponse(String(dataParam));
  if (!decoded) return redirect("invalid");

  const {
    transaction_uuid,
    product_code,
    total_amount,
    status: eSewaStatus,
    transaction_code,
  } = decoded;

  if (!transaction_uuid) return redirect("invalid");
  if (product_code && product_code !== cfg.productCode) return redirect("invalid");

  // The signature check protects the merchant from a tampered redirect.
  if (!verifyEsewaResponseSignature(decoded)) {
    console.warn("[ESEWA_SUCCESS_BAD_SIGNATURE]", { transaction_uuid });
    return redirect("invalid");
  }

  const payment = await prisma.customerPayment.findUnique({
    where: { transactionUuid: transaction_uuid },
    include: { order: true },
  });
  if (!payment || !payment.order) {
    console.warn("[ESEWA_SUCCESS_UNKNOWN_TXN]", { transaction_uuid });
    return redirect("invalid");
  }

  // Amount reported by eSewa must match the order total we signed for.
  const declared = Number(String(total_amount).replace(/,/g, ""));
  if (!Number.isFinite(declared) || declared.toFixed(2) !== Number(payment.order.total).toFixed(2)) {
    await markPaymentFailed({
      payment,
      order: payment.order,
      reason: "Amount mismatch on redirect",
      raw: decoded,
    });
    return redirect("failed", payment.order.orderNumber);
  }

  // Authoritative check against eSewa's status API before we credit the order.
  const result = await verifyEsewaPayment({
    payment,
    order: payment.order,
    raw: decoded,
  });

  if (result.status === "COMPLETED") {
    return redirect("success", result.order.orderNumber);
  }
  if (result.status === "FAILED") {
    return redirect("failed", result.order.orderNumber);
  }

  // NOT_FOUND or ambiguous — payment is not marked failed; the customer sees
  // a "pending" page and the admin can re-verify once eSewa has propagated.
  console.info("[ESEWA_SUCCESS_PENDING]", {
    transaction_uuid,
    eSewaStatus,
    transaction_code,
    verifyResult: result.status,
  });
  return redirect("pending", payment.order.orderNumber);
}

export async function GET(request) {
  return handle(request);
}

export async function POST(request) {
  return handle(request);
}
