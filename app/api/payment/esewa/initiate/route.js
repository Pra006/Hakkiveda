import prisma from "@/lib/prisma";
import { requireCustomer } from "@/lib/cart";
import { jsonResponse, errorResponse } from "@/lib/b2b";
import { initiateEsewaPayment } from "@/lib/payments/esewa/service";

/**
 * POST /api/payment/esewa/initiate
 * Body: { orderId }
 *
 * Returns the eSewa form URL + fields the browser must POST to eSewa.
 * All amounts and signatures come from the server-side order record.
 */
export async function POST(request) {
  try {
    const customer = await requireCustomer();
    const body = await request.json().catch(() => ({}));
    const orderId = String(body.orderId || "").trim();
    if (!orderId) return errorResponse("orderId is required", 400);

    const order = await prisma.customerOrder.findFirst({
      where: { id: orderId, customerId: customer.id },
    });
    if (!order) return errorResponse("Order not found", 404);

    const { formUrl, fields } = await initiateEsewaPayment({ order });
    return jsonResponse({ formUrl, fields });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ESEWA_INITIATE_ERROR]", err);
    return errorResponse(err?.message || "Could not initiate eSewa payment", 400);
  }
}
