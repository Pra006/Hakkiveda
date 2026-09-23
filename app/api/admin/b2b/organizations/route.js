import { requireAdmin, jsonResponse, errorResponse, parsePagination, paginatedResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    await requireAdmin("b2b.organizations");
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";

    const where = {};
    if (search) {
      where.OR = [
        { organizationNumber: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { businessEmail: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;

    const [orgs, total] = await Promise.all([
      prisma.b2BOrganization.findMany({
        where,
        include: {
          _count: { select: { members: true, orders: true, rfqs: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.b2BOrganization.count({ where }),
    ]);

    return paginatedResponse(orgs, total, page, limit);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_B2B_ORGS_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
