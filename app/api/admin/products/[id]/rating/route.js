import prisma from "@/lib/prisma";
import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";

/**
 * GET /api/admin/products/[id]/rating
 * Returns the product's current rating configuration + computed stats from approved reviews.
 */
export async function GET(request, { params }) {
  try {
    const admin = await requireAdmin("reviews");
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        adminRating: true,
        adminReviewCount: true,
        isAdminRatingEnabled: true,
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
    });

    if (!product) return errorResponse("Product not found", 404);

    // Compute stats from approved reviews
    const approvedCount = product.reviews.length;
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    const computedRating = approvedCount > 0
      ? Math.round((totalRating / approvedCount) * 10) / 10
      : 0;

    return jsonResponse({
      productId: product.id,
      productName: product.name,
      isAdminRatingEnabled: product.isAdminRatingEnabled,
      adminRating: product.adminRating,
      adminReviewCount: product.adminReviewCount,
      computed: {
        avgRating: computedRating,
        count: approvedCount,
      },
      // What's actually displayed on the storefront right now
      displayed: {
        rating: product.isAdminRatingEnabled && product.adminRating != null
          ? product.adminRating
          : computedRating,
        reviewCount: product.isAdminRatingEnabled && product.adminReviewCount != null
          ? product.adminReviewCount
          : approvedCount,
        source: product.isAdminRatingEnabled ? "admin" : "auto",
      },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("[ADMIN_PRODUCT_RATING_GET]", e);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * PATCH /api/admin/products/[id]/rating
 * Set or clear admin rating override.
 *
 * Body options:
 *   { isAdminRatingEnabled: true, adminRating: 4.5, adminReviewCount: 120 }
 *   { isAdminRatingEnabled: false }  — switch back to auto-calculated
 */
export async function PATCH(request, { params }) {
  try {
    const admin = await requireAdmin("reviews");
    const { id } = await params;
    const body = await request.json();

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, isAdminRatingEnabled: true, adminRating: true, adminReviewCount: true },
    });
    if (!product) return errorResponse("Product not found", 404);

    const { isAdminRatingEnabled, adminRating, adminReviewCount } = body;

    // Validate
    if (typeof isAdminRatingEnabled !== "boolean") {
      return errorResponse("isAdminRatingEnabled must be a boolean", 400);
    }

    const updateData = { isAdminRatingEnabled };

    if (isAdminRatingEnabled) {
      // When enabling, adminRating is required
      if (adminRating == null || typeof adminRating !== "number" || adminRating < 0 || adminRating > 5) {
        return errorResponse("adminRating must be a number between 0 and 5", 400);
      }
      updateData.adminRating = Math.round(adminRating * 10) / 10; // round to 1 decimal

      if (adminReviewCount != null) {
        if (!Number.isInteger(adminReviewCount) || adminReviewCount < 0) {
          return errorResponse("adminReviewCount must be a non-negative integer", 400);
        }
        updateData.adminReviewCount = adminReviewCount;
      }
      // If adminReviewCount is not provided when enabling, leave it null
      // (storefront will fall back to approved review count)
    } else {
      // When disabling, clear the override values
      updateData.adminRating = null;
      updateData.adminReviewCount = null;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        isAdminRatingEnabled: true,
        adminRating: true,
        adminReviewCount: true,
      },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE",
      entityType: "product_rating",
      entityId: id,
      description: isAdminRatingEnabled
        ? `Set admin rating override for "${product.name}": ${updateData.adminRating} stars${updateData.adminReviewCount != null ? `, ${updateData.adminReviewCount} reviews` : ""}`
        : `Disabled admin rating override for "${product.name}" (switched to auto-calculated)`,
      metadata: {
        previous: {
          isAdminRatingEnabled: product.isAdminRatingEnabled,
          adminRating: product.adminRating,
          adminReviewCount: product.adminReviewCount,
        },
        updated: {
          isAdminRatingEnabled: updated.isAdminRatingEnabled,
          adminRating: updated.adminRating,
          adminReviewCount: updated.adminReviewCount,
        },
      },
    });

    return jsonResponse({
      message: isAdminRatingEnabled
        ? "Admin rating override enabled"
        : "Switched to auto-calculated rating",
      product: updated,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("[ADMIN_PRODUCT_RATING_PATCH]", e);
    return errorResponse("Internal server error", 500);
  }
}
