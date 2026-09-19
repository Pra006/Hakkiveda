import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parsePagination,
  paginatedResponse,
} from "@/lib/admin";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/reviews — list all product reviews with filters
 */
export async function GET(request) {
  try {
    await requireAdmin("reviews");
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const status = searchParams.get("status") || "";
    const search = searchParams.get("search")?.trim() || "";
    const productId = searchParams.get("productId") || "";
    const sort = ["createdAt", "rating"].includes(searchParams.get("sort"))
      ? searchParams.get("sort")
      : "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const where = {};

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.status = status;
    }

    if (productId) {
      where.productId = productId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
        { product: { name: { contains: search, mode: "insensitive" } } },
        { customer: { user: { firstName: { contains: search, mode: "insensitive" } } } },
        { customer: { user: { lastName: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, slug: true, images: true } },
          customer: {
            select: {
              id: true,
              customerNumber: true,
              user: { select: { firstName: true, lastName: true, email: true, image: true } },
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      prisma.productReview.count({ where }),
    ]);

    return paginatedResponse(reviews, total, page, limit);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_REVIEWS_LIST_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
