import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    await requireAdmin("b2b.quotations");
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  try {
    const { id } = await params;

    const quotation = await prisma.b2BQuotation.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, companyName: true } },
        rfq: { select: { id: true, rfqNumber: true, status: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
        purchaseOrder: { select: { id: true, poNumber: true, status: true } },
      },
    });

    if (!quotation) {
      return errorResponse("Quotation not found", 404);
    }

    return jsonResponse(quotation);
  } catch (err) {
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    await requireAdmin("b2b.quotations");
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const existing = await prisma.b2BQuotation.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Quotation not found", 404);
    }

    const quotation = await prisma.b2BQuotation.update({
      where: { id },
      data: { status },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "B2BQuotation",
      entityId: id,
      details: { previousStatus: existing.status, newStatus: status },
    });

    return jsonResponse(quotation);
  } catch (err) {
    return errorResponse("Internal server error", 500);
  }
}
