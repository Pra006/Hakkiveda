import { requireAdmin, jsonResponse, errorResponse, parsePagination, paginatedResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    await requireAdmin(request, "b2b.rfqs");

    const { searchParams } = new URL(request.url);
    const { skip, take, page, pageSize } = parsePagination(searchParams);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where = {};

    if (search) {
      where.OR = [
        { rfqNumber: { contains: search, mode: "insensitive" } },
        { organization: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [rfqs, total] = await Promise.all([
      prisma.b2BRFQ.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          organization: { select: { id: true, companyName: true } },
          requestedBy: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
          _count: { select: { items: true } },
        },
      }),
      prisma.b2BRFQ.count({ where }),
    ]);

    return paginatedResponse(rfqs, total, page, pageSize);
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}
