import { requireAdmin, jsonResponse, errorResponse, parsePagination, paginatedResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    await requireAdmin("b2b.purchase-orders");
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const { page, limit, skip } = parsePagination(searchParams);

    const where = {};

    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: "insensitive" } },
        { organization: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.b2BPurchaseOrder.findMany({
        where,
        include: {
          organization: { select: { companyName: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.b2BPurchaseOrder.count({ where }),
    ]);

    return paginatedResponse(orders, total, page, limit);
  } catch (err) {
    return errorResponse("Internal server error", 500);
  }
}
