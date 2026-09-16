import prisma from "@/lib/prisma";
import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import { verifyEsewaPayment } from "@/lib/payments/esewa/service";

/**
 * POST /api/admin/customer-orders/[id]/verify-payment
 * Body: { paymentId? }
 *
 * Reconciles the latest (or specified) eSewa payment attempt against eSewa's
 * status API. Never trusts a browser-supplied status.
 */
export async function POST(request, { params }) {
  try {
    const { admin } = await requireAdmin("customer-orders");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const order = await prisma.customerOrder.findUnique({ where: { id } });
    if (!order) return errorResponse("Order not found", 404);

    const where = body.paymentId
      ? { id: String(body.paymentId), orderId: id }
      : { orderId: id, method: "ESEWA" };

    const payment = await prisma.customerPayment.findFirst({
      where,
      orderBy: { createdAt: "desc" },
    });
    if (!payment) return errorResponse("No eSewa payment on this order", 404);
    if (payment.method !== "ESEWA") return errorResponse("Not an eSewa payment", 400);
    if (!payment.transactionUuid) {
      return errorResponse("Payment has no eSewa transaction UUID", 400);
    }

    const result = await verifyEsewaPayment({ payment, order });

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    await createAuditLog({
      adminId: admin.id,
      action: "PAYMENT_VERIFIED",
      entityType: "CustomerPayment",
      entityId: payment.id,
      description: `Verified eSewa payment for order ${order.orderNumber} — ${result.status}`,
      metadata: {
        orderId: order.id,
        transactionUuid: payment.transactionUuid,
        eSewaStatus: result.status,
      },
      ipAddress,
    });

    return jsonResponse({
      ok: true,
      status: result.status,
      payment: result.payment,
      order: result.order,
      error: result.error || null,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_ESEWA_VERIFY_ERROR]", err);
    return errorResponse(err?.message || "Could not verify payment", 500);
  }
}
