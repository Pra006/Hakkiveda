import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    await requireAdmin("b2b.purchase-orders");
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  try {
    const { id } = await params;

    const purchaseOrder = await prisma.b2BPurchaseOrder.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, companyName: true } },
        quotation: { select: { id: true, quoteNumber: true, status: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
        order: { select: { id: true, orderNumber: true, status: true } },
      },
    });

    if (!purchaseOrder) {
      return errorResponse("Purchase order not found", 404);
    }

    return jsonResponse(purchaseOrder);
  } catch (err) {
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    await requireAdmin("b2b.purchase-orders");
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const existing = await prisma.b2BPurchaseOrder.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Purchase order not found", 404);
    }

    const purchaseOrder = await prisma.b2BPurchaseOrder.update({
      where: { id },
      data: { status },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "B2BPurchaseOrder",
      entityId: id,
      details: { previousStatus: existing.status, newStatus: status },
    });

    return jsonResponse(purchaseOrder);
  } catch (err) {
    return errorResponse("Internal server error", 500);
  }
}
