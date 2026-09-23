import { requireAdmin, jsonResponse, errorResponse, parsePagination, paginatedResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    await requireAdmin("audit-logs");
    const { searchParams } = new URL(request.url);
    const { skip, take, page } = parsePagination(searchParams);
    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "";
    const adminId = searchParams.get("adminId") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const where = {};
    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { entityType: { contains: search, mode: "insensitive" } },
      ];
    }
    if (action) where.action = action;
    if (adminId) where.adminId = adminId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        include: {
          admin: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return paginatedResponse(logs, total, page, take);
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}
