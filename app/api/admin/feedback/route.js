import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parsePagination,
} from "@/lib/admin";
import prisma from "@/lib/prisma";

const CATEGORIES = ["PRODUCT", "DELIVERY", "WEBSITE", "CUSTOMER_SERVICE", "OTHER"];
const STATUSES = ["NEW", "READ"];

/**
 * GET /api/admin/feedback — list customer feedback with stats and pagination.
 */
export async function GET(request) {
  try {
    await requireAdmin("feedback");
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search")?.trim() || "";

    const where = {};
    if (STATUSES.includes(status)) where.status = status;
    if (CATEGORIES.includes(category)) where.category = category;
    if (search) {
      where.OR = [
        { message: { contains: search, mode: "insensitive" } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [items, total, newCount, allCount, agg] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.feedback.count({ where }),
      prisma.feedback.count({ where: { status: "NEW" } }),
      prisma.feedback.count(),
      prisma.feedback.aggregate({ _avg: { rating: true } }),
    ]);

    return jsonResponse({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
      stats: {
        total: allCount,
        newCount,
        averageRating: agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : 0,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_FEEDBACK_LIST_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
