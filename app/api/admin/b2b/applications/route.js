import { requireAdmin, jsonResponse, errorResponse, parsePagination, paginatedResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    await requireAdmin("b2b.applications");
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";

    const where = {};
    if (search) {
      where.OR = [
        { applicationNumber: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { contactPersonName: { contains: search, mode: "insensitive" } },
        { businessEmail: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;

    const [apps, total] = await Promise.all([
      prisma.b2BApplication.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.b2BApplication.count({ where }),
    ]);

    return paginatedResponse(apps, total, page, limit);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_B2B_APPS_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
