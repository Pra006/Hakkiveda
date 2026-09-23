import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { validateFeaturedUpdate } from "@/lib/products";

/**
 * PATCH /api/admin/products/[id]/featured
 * Toggle featured status and/or update featured order without touching
 * the rest of the product form.
 */
export async function PATCH(request, { params }) {
  try {
    const { admin } = await requireAdmin("products");
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return errorResponse("Product not found", 404);

    const { errors, data } = validateFeaturedUpdate(body);
    if (errors.length) return errorResponse(errors.join(". "), 400);

    if (Object.keys(data).length === 0) {
      return errorResponse("No changes supplied", 400);
    }

    // Only active products can be featured on the storefront
    if (data.isFeatured && !existing.isActive) {
      return errorResponse("Only active products can be marked as Featured", 400);
    }

    // When un-featuring, clear the order
    if (data.isFeatured === false) {
      data.featuredOrder = null;
    }

    // If setting a featuredOrder, check for duplicates (non-null only)
    if (data.featuredOrder != null) {
      const conflict = await prisma.product.findFirst({
        where: {
          featuredOrder: data.featuredOrder,
          isFeatured: true,
          id: { not: id },
        },
      });
      if (conflict) {
        return errorResponse(
          `Featured order ${data.featuredOrder} is already used by "${conflict.name}". Choose a different number.`,
          409
        );
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true } } },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE",
      entityType: "Product",
      entityId: id,
      description: `${data.isFeatured ? "Featured" : data.isFeatured === false ? "Unfeatured" : "Updated featured order for"} product ${product.name}`,
      metadata: { isFeatured: product.isFeatured, featuredOrder: product.featuredOrder },
    });

    return jsonResponse(product);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_PRODUCT_FEATURED_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
