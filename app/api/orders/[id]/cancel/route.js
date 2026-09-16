import prisma from "@/lib/prisma";
import { jsonResponse, errorResponse } from "@/lib/b2b";
import { requireCustomer } from "@/lib/cart";

export async function POST(request, { params }) {
  try {
    const customer = await requireCustomer();
    const { id } = await params;

    const order = await prisma.customerOrder.findFirst({
      where: { id, customerId: customer.id },
      include: { items: true },
    });

    if (!order) return errorResponse("Order not found", 404);

    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      return errorResponse("This order can no longer be cancelled", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.customerOrder.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });

      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await tx.customerOrderEvent.create({
        data: {
          orderId: order.id,
          status: "CANCELLED",
          message: "Order cancelled by customer",
          actor: "CUSTOMER",
          actorId: customer.id,
        },
      });
    });

    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ORDER_CANCEL_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
