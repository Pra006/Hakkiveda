import { requireAdmin, jsonResponse, errorResponse, parsePagination, paginatedResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    await requireAdmin("b2b.orders");

    const { searchParams } = new URL(request.url);
    const { skip, take, page } = parsePagination(searchParams);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { organization: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.b2BOrder.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          organization: { select: { companyName: true } },
          placedBy: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          _count: { select: { items: true } },
        },
      }),
      prisma.b2BOrder.count({ where }),
    ]);

    return paginatedResponse(orders, total, page, take);
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}
