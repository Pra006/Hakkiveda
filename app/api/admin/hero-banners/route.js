import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/hero-banners
 * List all hero banners ordered by displayOrder.
 */
export async function GET(request) {
  try {
    const { admin } = await requireAdmin("products");

    const banners = await prisma.heroBanner.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return jsonResponse(banners);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_HERO_BANNERS_LIST]", err);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/admin/hero-banners
 * Create a new hero banner.
 */
export async function POST(request) {
  try {
    const { admin } = await requireAdmin("products");

    const body = await request.json();
    const { title, subtitle, imageUrl, buttonText, buttonLink, badgeIcon, badgeLabel, isActive, startDate, endDate } = body;

    // Validation
    if (!title?.trim()) return errorResponse("Title is required");
    if (!imageUrl?.trim()) return errorResponse("Image URL is required");

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return errorResponse("End date must be after start date");
    }

    // Get next display order
    const maxOrder = await prisma.heroBanner.aggregate({ _max: { displayOrder: true } });
    const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    const banner = await prisma.heroBanner.create({
      data: {
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        imageUrl: imageUrl.trim(),
        buttonText: buttonText?.trim() || null,
        buttonLink: buttonLink?.trim() || null,
        badgeIcon: badgeIcon?.trim() || null,
        badgeLabel: badgeLabel?.trim() || null,
        displayOrder: nextOrder,
        isActive: isActive ?? true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "CREATE",
      entityType: "HeroBanner",
      entityId: banner.id,
      description: `Created hero banner: ${banner.title}`,
    });

    return jsonResponse(banner, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_HERO_BANNERS_CREATE]", err);
    return errorResponse("Internal server error", 500);
  }
}
