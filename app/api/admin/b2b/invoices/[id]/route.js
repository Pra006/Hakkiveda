import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const admin = await requireAdmin("b2b.invoices");
    const { id } = await params;

    const invoice = await prisma.b2BInvoice.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, companyName: true } },
        order: true,
        items: true,
        payments: {
          orderBy: { paidAt: "desc" },
          include: {
            organization: { select: { id: true, companyName: true } },
          },
        },
      },
    });

    if (!invoice) {
      return errorResponse("Invoice not found", 404);
    }

    return jsonResponse(invoice);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("Failed to fetch B2B invoice:", err);
    return errorResponse("Failed to fetch invoice", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin("b2b.invoices");
    const { id } = await params;
    const body = await request.json();
    const { paymentStatus } = body;

    if (!paymentStatus) {
      return errorResponse("paymentStatus is required", 400);
    }

    const validStatuses = ["PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"];
    if (!validStatuses.includes(paymentStatus)) {
      return errorResponse(`Invalid payment status. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    const existing = await prisma.b2BInvoice.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Invoice not found", 404);
    }

    const invoice = await prisma.b2BInvoice.update({
      where: { id },
      data: { paymentStatus },
      include: {
        organization: { select: { id: true, companyName: true } },
        order: true,
        items: true,
        payments: {
          orderBy: { paidAt: "desc" },
          include: {
            organization: { select: { id: true, companyName: true } },
          },
        },
      },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "b2b.invoice.updatePaymentStatus",
      targetType: "B2BInvoice",
      targetId: id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        previousStatus: existing.paymentStatus,
        newStatus: paymentStatus,
      },
    });

    return jsonResponse(invoice);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("Failed to update B2B invoice:", err);
    return errorResponse("Failed to update invoice", 500);
  }
}
