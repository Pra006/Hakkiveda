/**
 * eSewa ePay V2 — Order/payment orchestration.
 *
 * All money math, signing and status decisions live here. API routes stay thin.
 */

import crypto from "crypto";
import prisma from "@/lib/prisma";
import { syncProductStock } from "@/lib/variants";
import {
  getEsewaConfig,
  esewaSuccessUrl,
  esewaFailureUrl,
} from "./config";
import { generateEsewaSignature } from "./signature";
import { fetchEsewaStatus, mapEsewaStatus } from "./client";

const SIGNED_FIELDS = "total_amount,transaction_uuid,product_code";

/** eSewa allows alphanumerics and `-`. We use crypto UUIDs. */
function makeTransactionUuid() {
  // A cuid-safe short UUID: `esw-<random32>` — hyphen-friendly and unique.
  const rand = crypto.randomBytes(12).toString("hex");
  return `esw-${Date.now().toString(36)}-${rand}`;
}

/** eSewa's amounts arrive as strings/numbers with two decimals. */
function toAmountString(n) {
  return Number(n || 0).toFixed(2);
}

/**
 * Prepare the eSewa form parameters for an order.
 * Uses the ORDER's server-side total; never trusts a client-supplied amount.
 *
 * Reuses an existing PENDING eSewa payment attempt when one is present so we
 * don't spam duplicate transaction UUIDs during a single checkout session.
 */
export async function initiateEsewaPayment({ order }) {
  const cfg = getEsewaConfig();

  if (order.paymentStatus === "COMPLETED") {
    throw new Error("Order is already paid");
  }
  if (["CANCELLED", "REFUNDED", "RETURNED", "DELIVERED"].includes(order.status)) {
    throw new Error("Order is no longer payable");
  }

  // Reuse the newest PENDING eSewa attempt when one exists.
  let payment = await prisma.customerPayment.findFirst({
    where: {
      orderId: order.id,
      method: "ESEWA",
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!payment) {
    payment = await prisma.customerPayment.create({
      data: {
        customerId: order.customerId,
        orderId: order.id,
        amount: order.total,
        currency: order.currency || "NPR",
        method: "ESEWA",
        status: "PENDING",
        provider: "ESEWA",
        transactionUuid: makeTransactionUuid(),
        initiatedAt: new Date(),
      },
    });
  } else if (!payment.transactionUuid || Number(payment.amount) !== Number(order.total)) {
    // Amount changed since the attempt was created, or the UUID is missing —
    // rotate to keep the eSewa request internally consistent.
    payment = await prisma.customerPayment.update({
      where: { id: payment.id },
      data: {
        amount: order.total,
        transactionUuid: makeTransactionUuid(),
        initiatedAt: new Date(),
      },
    });
  }

  const totalAmount = toAmountString(order.total);
  const amount = toAmountString(order.subtotal);
  const taxAmount = toAmountString(order.tax);
  const deliveryCharge = toAmountString(order.shippingCost);
  const serviceCharge = toAmountString(0);
  const transactionUuid = payment.transactionUuid;

  const signature = generateEsewaSignature({
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
    product_code: cfg.productCode,
  });

  return {
    payment,
    formUrl: cfg.paymentUrl,
    fields: {
      amount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: cfg.productCode,
      product_service_charge: serviceCharge,
      product_delivery_charge: deliveryCharge,
      success_url: esewaSuccessUrl(),
      failure_url: esewaFailureUrl(),
      signed_field_names: SIGNED_FIELDS,
      signature,
    },
  };
}

/**
 * Idempotently mark the payment/order paid.
 * Returns `{ payment, order, alreadyProcessed }`.
 */
export async function markPaymentPaid({ payment, order, refId, raw }) {
  if (payment.status === "COMPLETED") {
    return { payment, order, alreadyProcessed: true };
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Re-read under transaction — another callback may have won the race.
    const fresh = await tx.customerPayment.findUnique({ where: { id: payment.id } });
    if (fresh.status === "COMPLETED") return { payment: fresh, order, alreadyProcessed: true };

    const nowIso = new Date();
    const p = await tx.customerPayment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        providerRefId: refId || fresh.providerRefId,
        completedAt: nowIso,
        paidAt: nowIso,
        rawResponse: raw ? raw : fresh.rawResponse,
      },
    });

    const o = await tx.customerOrder.update({
      where: { id: order.id },
      data: {
        paymentStatus: "COMPLETED",
        // Only lift the order out of PENDING — never override a further status
        // an admin has already applied (PROCESSING, SHIPPED, …).
        status: order.status === "PENDING" ? "CONFIRMED" : order.status,
      },
    });

    await tx.customerOrderEvent.create({
      data: {
        orderId: order.id,
        status: o.status,
        message: `eSewa payment confirmed${refId ? ` (ref ${refId})` : ""}`,
        actor: "SYSTEM",
        metadata: { transactionUuid: p.transactionUuid, refId: refId || null },
      },
    });

    // Empty the customer's cart of any items that were left for retry.
    const cart = await tx.customerCart.findUnique({ where: { customerId: order.customerId } });
    if (cart) {
      await tx.customerCartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return { payment: p, order: o, alreadyProcessed: false };
  });

  return updated;
}

/**
 * Idempotently mark a payment failed/cancelled and restock inventory.
 * The order is moved to CANCELLED when it was still PENDING; other order
 * states (already fulfilled elsewhere, admin-adjusted) are left untouched.
 */
export async function markPaymentFailed({ payment, order, reason, raw, restock = true }) {
  if (payment.status === "FAILED" || payment.status === "CANCELLED") {
    return { payment, order, alreadyProcessed: true };
  }

  const RESTOCK_STATUSES = ["CANCELLED", "RETURNED", "REFUNDED"];
  const alreadyRestocked = RESTOCK_STATUSES.includes(order.status);

  const updated = await prisma.$transaction(async (tx) => {
    const fresh = await tx.customerPayment.findUnique({ where: { id: payment.id } });
    if (fresh.status === "COMPLETED") {
      // Payment was already confirmed in a parallel callback — never regress.
      return { payment: fresh, order, alreadyProcessed: true };
    }

    const p = await tx.customerPayment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        rawResponse: raw ? raw : fresh.rawResponse,
        notes: reason ? String(reason).slice(0, 240) : fresh.notes,
      },
    });

    let o = order;
    if (order.status === "PENDING") {
      o = await tx.customerOrder.update({
        where: { id: order.id },
        data: { status: "CANCELLED", paymentStatus: "FAILED" },
      });

      if (restock && !alreadyRestocked) {
        const items = await tx.customerOrderItem.findMany({
          where: { orderId: order.id },
          select: { productId: true, variantId: true, quantity: true },
        });
        const touchedProducts = new Set();
        for (const item of items) {
          if (item.variantId) {
            const r = await tx.productVariant.updateMany({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            if (r.count > 0) {
              touchedProducts.add(item.productId);
              continue;
            }
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        for (const productId of touchedProducts) {
          await syncProductStock(tx, productId);
        }
      }
    } else {
      o = await tx.customerOrder.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED" },
      });
    }

    await tx.customerOrderEvent.create({
      data: {
        orderId: order.id,
        status: o.status,
        message: `eSewa payment failed${reason ? ` — ${reason}` : ""}`,
        actor: "SYSTEM",
        metadata: { transactionUuid: p.transactionUuid },
      },
    });

    return { payment: p, order: o, alreadyProcessed: false };
  });

  return updated;
}

/** Small async delay helper. */
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Single attempt to reconcile our payment with eSewa's status API.
 * Returns a result object — does NOT mark payment as failed on NOT_FOUND.
 */
async function attemptEsewaVerification({ payment, order, raw }) {
  const cfg = getEsewaConfig();
  const formattedAmount = order.total;

  console.info("[ESEWA_VERIFY_ATTEMPT]", {
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentId: payment.id,
    transactionUuid: payment.transactionUuid,
    productCode: cfg.productCode,
    totalAmount: formattedAmount,
    env: cfg.env,
    statusUrl: cfg.statusUrl,
    timestamp: new Date().toISOString(),
  });

  const status = await fetchEsewaStatus({
    transactionUuid: payment.transactionUuid,
    totalAmount: formattedAmount,
  });

  console.info("[ESEWA_VERIFY_RESULT]", {
    orderId: order.id,
    transactionUuid: payment.transactionUuid,
    ok: status.ok,
    esewaStatus: status.status || null,
    refId: status.refId || null,
    error: status.error || null,
    timestamp: new Date().toISOString(),
  });

  if (!status.ok) {
    return { payment, order, error: status.error || "Status check failed", status: "AMBIGUOUS" };
  }

  // Guard: amount reported by eSewa must match the order total.
  const eSewaAmount = Number(status.raw?.total_amount ?? NaN);
  if (Number.isFinite(eSewaAmount) && Number(order.total).toFixed(2) !== eSewaAmount.toFixed(2)) {
    return { payment, order, error: "Amount mismatch", status: "AMBIGUOUS", raw: status.raw };
  }

  const mapped = mapEsewaStatus(status.status);
  const mergedRaw = raw ? { redirect: raw, status: status.raw } : status.raw;

  if (mapped === "COMPLETED") {
    const result = await markPaymentPaid({
      payment,
      order,
      refId: status.refId,
      raw: mergedRaw,
    });
    return { ...result, status: "COMPLETED" };
  }
  if (mapped === "FAILED") {
    const result = await markPaymentFailed({
      payment,
      order,
      reason: `eSewa reported ${status.status}`,
      raw: mergedRaw,
    });
    return { ...result, status: "FAILED" };
  }
  if (mapped === "NOT_FOUND") {
    // NOT_FOUND may be a timing issue — do NOT mark as failed yet.
    return { payment, order, status: "NOT_FOUND", raw: status.raw };
  }
  if (mapped === "REFUNDED") {
    const p = await prisma.customerPayment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED", rawResponse: mergedRaw },
    });
    const o = await prisma.customerOrder.update({
      where: { id: order.id },
      data: { paymentStatus: "REFUNDED" },
    });
    return { payment: p, order: o, status: "REFUNDED" };
  }

  // Ambiguous / PENDING — leave things alone; caller will decide.
  return { payment, order, status: status.status || "UNKNOWN", raw: status.raw };
}

/**
 * Authoritative check: reconcile our payment with eSewa's status API.
 * Called from the success callback and from the admin "Verify Payment" action.
 *
 * When the first attempt returns NOT_FOUND (which can happen due to eSewa
 * propagation delay), retries up to `maxRetries` times with a short delay
 * before giving up. The payment is only marked FAILED on a definitive FAILED
 * status from eSewa — never on NOT_FOUND alone.
 */
export async function verifyEsewaPayment({ payment, order, raw, maxRetries = 2, retryDelayMs = 3000 }) {
  if (payment.status === "COMPLETED") {
    return { payment, order, alreadyProcessed: true, status: "COMPLETED" };
  }

  let lastResult;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await delay(retryDelayMs);
    }
    lastResult = await attemptEsewaVerification({ payment, order, raw });

    // Terminal states — stop retrying.
    if (["COMPLETED", "FAILED", "REFUNDED"].includes(lastResult.status)) {
      return lastResult;
    }
    // NOT_FOUND or AMBIGUOUS — retry.
  }

  // Exhausted retries. For NOT_FOUND, return it as-is without marking FAILED.
  // The admin can re-verify later, or a scheduled job can retry.
  return lastResult;
}
