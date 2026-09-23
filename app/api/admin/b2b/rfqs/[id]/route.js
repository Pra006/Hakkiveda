import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const admin = await requireAdmin(request, "b2b.rfqs");
    const { id } = await params;

    const rfq = await prisma.b2BRFQ.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, companyName: true } },
        requestedBy: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
        quotation: true,
      },
    });

    if (!rfq) {
      return errorResponse("RFQ not found", 404);
    }

    return jsonResponse(rfq);
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin(request, "b2b.rfqs");
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.b2BRFQ.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("RFQ not found", 404);
    }

    const data = {};
    if (body.status) data.status = body.status;
    if (body.internalNotes !== undefined) data.internalNotes = body.internalNotes;

    const rfq = await prisma.b2BRFQ.update({
      where: { id },
      data,
      include: {
        organization: { select: { id: true, companyName: true } },
        requestedBy: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        items: true,
        quotation: true,
      },
    });

    if (body.status && body.status !== existing.status) {
      await createAuditLog({
        adminId: admin.id,
        action: "B2B_RFQ_STATUS_UPDATE",
        targetType: "B2BRFQ",
        targetId: id,
        details: { from: existing.status, to: body.status },
      });
    }

    if (body.internalNotes !== undefined && body.internalNotes !== existing.internalNotes) {
      await createAuditLog({
        adminId: admin.id,
        action: "B2B_RFQ_NOTES_UPDATE",
        targetType: "B2BRFQ",
        targetId: id,
        details: { internalNotes: body.internalNotes },
      });
    }

    return jsonResponse(rfq);
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}
