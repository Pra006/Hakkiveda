import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  createAuditLog,
} from "@/lib/admin";
import prisma from "@/lib/prisma";

function displayName(user) {
  return (
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.name ||
    user?.email ||
    "Customer"
  );
}

/**
 * PATCH /api/admin/feedback/[id] — mark feedback as READ (or NEW).
 */
export async function PATCH(request, { params }) {
  try {
    const { admin } = await requireAdmin("feedback");
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const status = body?.status;

    if (!["NEW", "READ"].includes(status)) {
      return errorResponse("Status must be NEW or READ", 400);
    }

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true, name: true, email: true } } },
    });
    if (!feedback) return errorResponse("Feedback not found", 404);

    const updated = await prisma.feedback.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, name: true, firstName: true, lastName: true, email: true } },
      },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE",
      entityType: "Feedback",
      entityId: id,
      description: `Marked feedback from ${displayName(feedback.user)} as ${status}`,
      metadata: { from: feedback.status, to: status },
    });

    return jsonResponse(updated);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_FEEDBACK_UPDATE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * DELETE /api/admin/feedback/[id] — permanently delete a feedback entry.
 */
export async function DELETE(request, { params }) {
  try {
    const { admin } = await requireAdmin("feedback");
    const { id } = await params;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true, name: true, email: true } } },
    });
    if (!feedback) return errorResponse("Feedback not found", 404);

    await prisma.feedback.delete({ where: { id } });

    await createAuditLog({
      adminId: admin.id,
      action: "DELETE",
      entityType: "Feedback",
      entityId: id,
      description: `Deleted feedback from ${displayName(feedback.user)}`,
      metadata: { rating: feedback.rating, category: feedback.category },
    });

    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_FEEDBACK_DELETE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
