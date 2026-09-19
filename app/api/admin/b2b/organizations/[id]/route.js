import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    await requireAdmin("b2b.organizations");
    const { id } = await params;

    const org = await prisma.b2BOrganization.findUnique({
      where: { id },
      include: {
        b2bApplication: { select: { id: true, applicationNumber: true, status: true } },
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { orders: true, rfqs: true, quotations: true, purchaseOrders: true, invoices: true, payments: true } },
      },
    });

    if (!org) return errorResponse("Organization not found", 404);

    const [orderTotal, invoiceTotal] = await Promise.all([
      prisma.b2BOrder.aggregate({ where: { organizationId: id }, _sum: { total: true } }),
      prisma.b2BInvoice.aggregate({ where: { organizationId: id, paymentStatus: { in: ["PENDING", "OVERDUE"] } }, _sum: { total: true } }),
    ]);

    return jsonResponse({
      ...org,
      stats: {
        totalOrderValue: orderTotal._sum.total || 0,
        outstandingInvoices: invoiceTotal._sum.total || 0,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_B2B_ORG_DETAIL_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { admin } = await requireAdmin("b2b.organizations");
    const { id } = await params;
    const body = await request.json();

    const org = await prisma.b2BOrganization.findUnique({ where: { id } });
    if (!org) return errorResponse("Organization not found", 404);

    const updates = {};
    if (body.status && ["ACTIVE", "SUSPENDED", "CLOSED"].includes(body.status)) updates.status = body.status;
    if (body.defaultPaymentTerm) updates.defaultPaymentTerm = body.defaultPaymentTerm;
    if (body.creditLimit !== undefined) updates.creditLimit = body.creditLimit;

    const updated = await prisma.b2BOrganization.update({ where: { id }, data: updates });

    await createAuditLog({
      adminId: admin.id,
      action: body.status === "SUSPENDED" ? "SUSPEND" : body.status === "ACTIVE" ? "ACTIVATE" : "UPDATE",
      entityType: "B2BOrganization",
      entityId: id,
      description: `Updated organization ${org.organizationNumber}`,
      metadata: updates,
    });

    return jsonResponse(updated);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_B2B_ORG_UPDATE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
