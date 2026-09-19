import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  createAuditLog,
} from "@/lib/admin";
import prisma from "@/lib/prisma";

/**
 * PATCH /api/admin/reviews/[id] — approve or reject a review
 */
export async function PATCH(request, { params }) {
  try {
    const { admin } = await requireAdmin("reviews");
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return errorResponse("Status must be APPROVED or REJECTED", 400);
    }

    const review = await prisma.productReview.findUnique({ where: { id } });
    if (!review) return errorResponse("Review not found", 404);

    const updated = await prisma.productReview.update({
      where: { id },
      data: {
        status,
        moderatedAt: new Date(),
        moderatedById: admin.id,
      },
      include: {
        product: { select: { id: true, name: true } },
        customer: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    await createAuditLog({
      adminId: admin.id,
      action: status === "APPROVED" ? "APPROVE" : "REJECT",
      entityType: "ProductReview",
      entityId: id,
      description: `${status === "APPROVED" ? "Approved" : "Rejected"} review by ${
        [updated.customer.user.firstName, updated.customer.user.lastName].filter(Boolean).join(" ")
      } on ${updated.product.name}`,
    });

    return jsonResponse(updated);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_REVIEW_UPDATE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * DELETE /api/admin/reviews/[id] — permanently delete a review
 */
export async function DELETE(request, { params }) {
  try {
    const { admin } = await requireAdmin("reviews");
    const { id } = await params;

    const review = await prisma.productReview.findUnique({
      where: { id },
      include: {
        product: { select: { name: true } },
        customer: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!review) return errorResponse("Review not found", 404);

    await prisma.productReview.delete({ where: { id } });

    await createAuditLog({
      adminId: admin.id,
      action: "DELETE",
      entityType: "ProductReview",
      entityId: id,
      description: `Deleted review by ${
        [review.customer.user.firstName, review.customer.user.lastName].filter(Boolean).join(" ")
      } on ${review.product.name}`,
      metadata: { rating: review.rating, status: review.status },
    });

    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_REVIEW_DELETE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
