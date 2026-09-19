import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

/**
 * PUT /api/admin/hero-banners/reorder
 * Expects { orderedIds: ["id1", "id2", ...] }
 */
export async function PUT(request) {
  try {
    const { admin } = await requireAdmin("products");

    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return errorResponse("orderedIds must be a non-empty array");
    }

    // Update each banner's displayOrder in a transaction
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.heroBanner.update({
          where: { id },
          data: { displayOrder: index },
        })
      )
    );

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE",
      entityType: "HeroBanner",
      entityId: "bulk",
      description: `Reordered ${orderedIds.length} hero banners`,
    });

    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_HERO_BANNERS_REORDER]", err);
    return errorResponse("Internal server error", 500);
  }
}
