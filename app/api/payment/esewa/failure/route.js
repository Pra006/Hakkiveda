import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getEsewaConfig } from "@/lib/payments/esewa/config";
import { decodeEsewaResponse } from "@/lib/payments/esewa/signature";
import { markPaymentFailed } from "@/lib/payments/esewa/service";

/**
 * GET|POST /api/payment/esewa/failure
 *
 * Handles cancellations / failures from eSewa. ePay V2 may not always attach
 * a `data` payload here; we look up the payment by transaction_uuid where we
 * can, and fall back to redirecting the customer without state changes.
 */
async function handle(request) {
  const cfg = getEsewaConfig();
  const appUrl = cfg.appUrl.replace(/\/$/, "");
  const url = new URL(request.url);

  let dataParam = url.searchParams.get("data");
  let transactionUuid = url.searchParams.get("transaction_uuid");

  if (!dataParam && request.method === "POST") {
    const form = await request.formData().catch(() => null);
    dataParam = form?.get("data") || dataParam;
    transactionUuid = form?.get("transaction_uuid") || transactionUuid;
  }

  let decoded = null;
  if (dataParam) {
    decoded = decodeEsewaResponse(String(dataParam));
    transactionUuid = decoded?.transaction_uuid || transactionUuid;
  }

  let orderNumber = null;
  if (transactionUuid) {
    const payment = await prisma.customerPayment.findUnique({
      where: { transactionUuid: String(transactionUuid) },
      include: { order: true },
    });
    if (payment?.order) {
      orderNumber = payment.order.orderNumber;
      await markPaymentFailed({
        payment,
        order: payment.order,
        reason: "Cancelled or failed at eSewa",
        raw: decoded,
      });
    }
  }

  const target = new URL(`${appUrl}/payment/esewa/result`);
  target.searchParams.set("status", "failed");
  if (orderNumber) target.searchParams.set("order", orderNumber);
  return NextResponse.redirect(target, { status: 303 });
}

export async function GET(request) {
  return handle(request);
}

export async function POST(request) {
  return handle(request);
}
