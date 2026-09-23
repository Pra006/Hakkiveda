import { requireAdmin, jsonResponse, errorResponse, parsePagination, paginatedResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    await requireAdmin("b2b.organizations");
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search")?.trim() || "";

    const where = {};
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { organization: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.b2BOrganizationMember.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          organization: { select: { id: true, companyName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.b2BOrganizationMember.count({ where }),
    ]);

    const data = members.map((m) => ({
      id: m.id,
      name: [m.user?.firstName, m.user?.lastName].filter(Boolean).join(" "),
      email: m.user?.email,
      organizationId: m.organization?.id,
      organizationName: m.organization?.companyName,
      role: m.role,
      status: m.status,
      createdAt: m.createdAt,
    }));

    return paginatedResponse(data, total, page, limit);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_B2B_MEMBERS_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
