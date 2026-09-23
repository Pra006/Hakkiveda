import { requireAdmin, jsonResponse, errorResponse, parsePagination, paginatedResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { admin } = await requireAdmin("customers");
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status"); // "active" | "inactive"
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where = {};

    if (search) {
      where.OR = [
        { customerNumber: { contains: search, mode: "insensitive" } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { phone: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const orderBy = sort === "name"
      ? { user: { firstName: order } }
      : sort === "email"
        ? { user: { email: order } }
        : { [sort]: order };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, email: true, phone: true, image: true,
              isActive: true, emailVerified: true, phoneVerified: true, lastLoginAt: true, createdAt: true,
              b2bApplication: { select: { id: true } },
              orgMemberships: { select: { id: true }, take: 1 },
            },
          },
          _count: { select: { orders: true, addresses: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    const data = customers.map((c) => {
      const isB2B = !!c.user.b2bApplication || c.user.orgMemberships.length > 0;
      return {
        id: c.id,
        customerNumber: c.customerNumber,
        userId: c.userId,
        firstName: c.user.firstName,
        lastName: c.user.lastName,
        email: c.user.email,
        phone: c.user.phone,
        image: c.user.image,
        isActive: c.isActive,
        emailVerified: c.user.emailVerified,
        phoneVerified: c.user.phoneVerified,
        lastLoginAt: c.user.lastLoginAt,
        customerType: isB2B ? "B2B" : "CUSTOMER",
        totalOrders: c._count.orders,
        totalAddresses: c._count.addresses,
        createdAt: c.createdAt,
        userCreatedAt: c.user.createdAt,
      };
    });

    return paginatedResponse(data, total, page, limit);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_CUSTOMERS_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
