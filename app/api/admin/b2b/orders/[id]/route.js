import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const admin = await requireAdmin("b2b.orders");
    const { id } = await params;

    const order = await prisma.b2BOrder.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, companyName: true } },
        placedBy: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        items: {
          include: {
            product: { select: { name: true, slug: true } },
          },
        },
        invoice: true,
        billingAddress: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    return jsonResponse(order);
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin("b2b.orders");
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return errorResponse("Status is required", 400);
    }

    const existing = await prisma.b2BOrder.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Order not found", 404);
    }

    const order = await prisma.b2BOrder.update({
      where: { id },
      data: { status },
      include: {
        organization: { select: { companyName: true } },
      },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "b2b.order.status_updated",
      entityType: "B2BOrder",
      entityId: id,
      details: {
        orderNumber: order.orderNumber,
        previousStatus: existing.status,
        newStatus: status,
      },
    });

    return jsonResponse(order);
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}
