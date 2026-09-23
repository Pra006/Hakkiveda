import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parsePagination,
  paginatedResponse,
  createAuditLog,
} from "@/lib/admin";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/promotions — list all promotions
 */
export async function GET(request) {
  try {
    await requireAdmin("products");
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const where = {};
    const status = searchParams.get("status");
    if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;

    const [promotions, total] = await Promise.all([
      prisma.salePromotion.findMany({
        where,
        include: {
          products: {
            include: {
              product: {
                select: { id: true, name: true, slug: true, images: true, retailPrice: true, compareAt: true, isActive: true },
              },
            },
            orderBy: { displayOrder: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.salePromotion.count({ where }),
    ]);

    return paginatedResponse(promotions, total, page, limit);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_PROMOTIONS_LIST_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/admin/promotions — create a promotion
 */
export async function POST(request) {
  try {
    const { admin } = await requireAdmin("products");
    const body = await request.json();

    const { errors, data } = validatePromotion(body);
    if (errors.length) return errorResponse(errors.join(". "), 400);

    const promotion = await prisma.salePromotion.create({
      data,
      include: {
        products: {
          include: { product: { select: { id: true, name: true, slug: true, images: true, retailPrice: true, compareAt: true, isActive: true } } },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    await createAuditLog({
      adminId: admin.id,
      action: "CREATE",
      entityType: "SalePromotion",
      entityId: promotion.id,
      description: `Created sale promotion "${promotion.title}"`,
    });

    return jsonResponse(promotion, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_PROMOTION_CREATE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

function validatePromotion(body, { partial = false } = {}) {
  const errors = [];
  const data = {};
  const has = (f) => body[f] !== undefined;

  if (!partial || has("title")) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) errors.push("Title is required");
    else if (title.length > 200) errors.push("Title must be 200 characters or fewer");
    else data.title = title;
  }

  if (has("subtitle")) {
    data.subtitle = typeof body.subtitle === "string" && body.subtitle.trim() ? body.subtitle.trim() : null;
  }

  if (has("bannerImage")) {
    data.bannerImage = typeof body.bannerImage === "string" && body.bannerImage.trim() ? body.bannerImage.trim() : null;
  }

  if (has("isActive")) data.isActive = Boolean(body.isActive);

  if (!partial || has("startDate")) {
    if (!body.startDate) errors.push("Start date is required");
    else {
      const d = new Date(body.startDate);
      if (isNaN(d.getTime())) errors.push("Invalid start date");
      else data.startDate = d;
    }
  }

  if (!partial || has("endDate")) {
    if (!body.endDate) errors.push("End date is required");
    else {
      const d = new Date(body.endDate);
      if (isNaN(d.getTime())) errors.push("Invalid end date");
      else data.endDate = d;
    }
  }

  const start = data.startDate || (body.startDate ? new Date(body.startDate) : null);
  const end = data.endDate || (body.endDate ? new Date(body.endDate) : null);
  if (start && end && start >= end) {
    errors.push("End date must be after start date");
  }

  return { errors, data };
}

export { validatePromotion };
