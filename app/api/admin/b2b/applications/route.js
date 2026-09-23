import { requireAdmin, jsonResponse, errorResponse, parsePagination } from "@/lib/admin";
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
        { storeName: { contains: search, mode: "insensitive" } },
        { contactPersonName: { contains: search, mode: "insensitive" } },
        { businessEmail: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;

    const [apps, total, pending, underReview, approved, rejected] = await Promise.all([
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
      prisma.b2BApplication.count({ where: { status: "PENDING" } }),
      prisma.b2BApplication.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.b2BApplication.count({ where: { status: "APPROVED" } }),
      prisma.b2BApplication.count({ where: { status: "REJECTED" } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return jsonResponse({
      data: apps,
      pagination: { page, limit, total, totalPages },
      counts: { pending, underReview, approved, rejected },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_B2B_APPS_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
