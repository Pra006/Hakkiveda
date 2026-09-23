import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { validatePromotion } from "../route";

const PRODUCT_SELECT = {
  id: true, name: true, slug: true, images: true,
  retailPrice: true, compareAt: true, isActive: true,
};

function includeProducts() {
  return {
    products: {
      include: { product: { select: PRODUCT_SELECT } },
      orderBy: { displayOrder: "asc" },
    },
  };
}

/**
 * GET /api/admin/promotions/[id]
 */
export async function GET(request, { params }) {
  try {
    await requireAdmin("products");
    const { id } = await params;
    const promo = await prisma.salePromotion.findUnique({
      where: { id },
      include: includeProducts(),
    });
    if (!promo) return errorResponse("Promotion not found", 404);
    return jsonResponse(promo);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_PROMOTION_DETAIL_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * PATCH /api/admin/promotions/[id]
 */
export async function PATCH(request, { params }) {
  try {
    const { admin } = await requireAdmin("products");
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.salePromotion.findUnique({ where: { id } });
    if (!existing) return errorResponse("Promotion not found", 404);

    const { errors, data } = validatePromotion(body, { partial: true });
    if (errors.length) return errorResponse(errors.join(". "), 400);

    // Cross-field date check with existing values
    const nextStart = data.startDate ?? existing.startDate;
    const nextEnd = data.endDate ?? existing.endDate;
    if (nextStart && nextEnd && nextStart >= nextEnd) {
      return errorResponse("End date must be after start date", 400);
    }

    if (Object.keys(data).length === 0) {
      return errorResponse("No changes supplied", 400);
    }

    const promo = await prisma.salePromotion.update({
      where: { id },
      data,
      include: includeProducts(),
    });

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE",
      entityType: "SalePromotion",
      entityId: id,
      description: `Updated promotion "${promo.title}"`,
      metadata: { fields: Object.keys(data) },
    });

    return jsonResponse(promo);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_PROMOTION_UPDATE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * DELETE /api/admin/promotions/[id]
 */
export async function DELETE(request, { params }) {
  try {
    const { admin } = await requireAdmin("products");
    const { id } = await params;

    const existing = await prisma.salePromotion.findUnique({ where: { id } });
    if (!existing) return errorResponse("Promotion not found", 404);

    await prisma.salePromotion.delete({ where: { id } });

    await createAuditLog({
      adminId: admin.id,
      action: "DELETE",
      entityType: "SalePromotion",
      entityId: id,
      description: `Deleted promotion "${existing.title}"`,
    });

    return jsonResponse({ deleted: true, message: "Promotion deleted" });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_PROMOTION_DELETE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
