import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/hero-banners/[id]
 */
export async function GET(request, { params }) {
  try {
    await requireAdmin("products");
    const { id } = await params;

    const banner = await prisma.heroBanner.findUnique({ where: { id } });
    if (!banner) return errorResponse("Banner not found", 404);

    return jsonResponse(banner);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_HERO_BANNER_GET]", err);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * PATCH /api/admin/hero-banners/[id]
 * Update a banner or toggle its status.
 */
export async function PATCH(request, { params }) {
  try {
    const { admin } = await requireAdmin("products");
    const { id } = await params;

    const existing = await prisma.heroBanner.findUnique({ where: { id } });
    if (!existing) return errorResponse("Banner not found", 404);

    const body = await request.json();
    const data = {};

    if (body.title !== undefined) {
      if (!body.title?.trim()) return errorResponse("Title cannot be empty");
      data.title = body.title.trim();
    }
    if (body.subtitle !== undefined) data.subtitle = body.subtitle?.trim() || null;
    if (body.imageUrl !== undefined) {
      if (!body.imageUrl?.trim()) return errorResponse("Image URL cannot be empty");
      data.imageUrl = body.imageUrl.trim();
    }
    if (body.buttonText !== undefined) data.buttonText = body.buttonText?.trim() || null;
    if (body.buttonLink !== undefined) data.buttonLink = body.buttonLink?.trim() || null;
    if (body.badgeIcon !== undefined) data.badgeIcon = body.badgeIcon?.trim() || null;
    if (body.badgeLabel !== undefined) data.badgeLabel = body.badgeLabel?.trim() || null;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.displayOrder !== undefined) data.displayOrder = Number(body.displayOrder);

    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;

    // Validate date range
    const start = data.startDate !== undefined ? data.startDate : existing.startDate;
    const end = data.endDate !== undefined ? data.endDate : existing.endDate;
    if (start && end && new Date(start) >= new Date(end)) {
      return errorResponse("End date must be after start date");
    }

    const banner = await prisma.heroBanner.update({ where: { id }, data });

    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE",
      entityType: "HeroBanner",
      entityId: banner.id,
      description: `Updated hero banner: ${banner.title}`,
      metadata: { fields: Object.keys(data) },
    });

    return jsonResponse(banner);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_HERO_BANNER_UPDATE]", err);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * DELETE /api/admin/hero-banners/[id]
 */
export async function DELETE(request, { params }) {
  try {
    const { admin } = await requireAdmin("products");
    const { id } = await params;

    const existing = await prisma.heroBanner.findUnique({ where: { id } });
    if (!existing) return errorResponse("Banner not found", 404);

    await prisma.heroBanner.delete({ where: { id } });

    await createAuditLog({
      adminId: admin.id,
      action: "DELETE",
      entityType: "HeroBanner",
      entityId: id,
      description: `Deleted hero banner: ${existing.title}`,
    });

    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_HERO_BANNER_DELETE]", err);
    return errorResponse("Internal server error", 500);
  }
}
