import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

const PRODUCT_SELECT = {
  id: true, name: true, slug: true, images: true,
  retailPrice: true, compareAt: true, isActive: true,
};

/**
 * PUT /api/admin/promotions/[id]/products
 *
 * Replace the full product list for a promotion.
 * Body: { products: [{ productId, displayOrder }] }
 * Exactly 3 products required.
 */
export async function PUT(request, { params }) {
  try {
    const { admin } = await requireAdmin("products");
    const { id } = await params;
    const body = await request.json();

    const promo = await prisma.salePromotion.findUnique({ where: { id } });
    if (!promo) return errorResponse("Promotion not found", 404);

    const items = body.products;
    if (!Array.isArray(items)) return errorResponse("products must be an array", 400);
    if (items.length !== 3) return errorResponse("Exactly 3 products are required", 400);

    // Validate no duplicate products
    const productIds = items.map((i) => i.productId);
    if (new Set(productIds).size !== productIds.length) {
      return errorResponse("Duplicate products are not allowed", 400);
    }

    // Validate no duplicate display orders
    const orders = items.map((i) => i.displayOrder ?? 0);
    if (new Set(orders).size !== orders.length) {
      return errorResponse("Each product must have a unique display order", 400);
    }

    // Verify all products exist and are active
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, isActive: true },
    });

    if (dbProducts.length !== productIds.length) {
      return errorResponse("One or more selected products do not exist", 400);
    }

    const inactive = dbProducts.filter((p) => !p.isActive);
    if (inactive.length) {
      return errorResponse(`Inactive products cannot be added: ${inactive.map((p) => p.name).join(", ")}`, 400);
    }

    // Replace all in a transaction
    await prisma.$transaction([
      prisma.salePromotionProduct.deleteMany({ where: { promotionId: id } }),
      ...items.map((item) =>
        prisma.salePromotionProduct.create({
          data: {
            promotionId: id,
            productId: item.productId,
            displayOrder: item.displayOrder ?? 0,
          },
        })
      ),
    ]);

    const updated = await prisma.salePromotion.findUnique({
      where: { id },
      include: {
        products: {
          include: { product: { select: PRODUCT_SELECT } },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE",
      entityType: "SalePromotion",
      entityId: id,
      description: `Updated products for promotion "${promo.title}"`,
      metadata: { productIds },
    });

    return jsonResponse(updated);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_PROMOTION_PRODUCTS_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
