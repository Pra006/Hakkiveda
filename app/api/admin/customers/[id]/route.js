import { requireAdmin, jsonResponse, errorResponse, createAuditLog } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    await requireAdmin("customers");
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true, image: true,
            isActive: true, emailVerified: true, phoneVerified: true, lastLoginAt: true,
            createdAt: true, updatedAt: true,
            b2bApplication: { select: { id: true, status: true, companyName: true } },
            orgMemberships: { select: { id: true, role: true, organization: { select: { id: true, companyName: true } } } },
          },
        },
        addresses: { orderBy: { createdAt: "desc" } },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 25,
          include: {
            items: {
              include: { product: { select: { id: true, name: true, slug: true, isActive: true } } },
            },
            payments: { orderBy: { createdAt: "desc" } },
            _count: { select: { items: true } },
          },
        },
        payments: { orderBy: { createdAt: "desc" }, take: 10 },
        wishlist: {
          include: {
            items: {
              orderBy: { addedAt: "desc" },
              include: {
                product: {
                  select: {
                    id: true, name: true, slug: true, sku: true,
                    images: true, retailPrice: true, compareAt: true,
                    stock: true, isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!customer) return errorResponse("Customer not found", 404);

    const [orderStats, totalSpent, totalOrders] = await Promise.all([
      prisma.customerOrder.groupBy({
        by: ["status"],
        where: { customerId: id },
        _count: true,
      }),
      prisma.customerOrder.aggregate({
        where: { customerId: id, status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
        _sum: { total: true },
      }),
      prisma.customerOrder.count({ where: { customerId: id } }),
    ]);

    // Activity trail: order timeline events across this customer's orders.
    const activity = await prisma.customerOrderEvent.findMany({
      where: { order: { customerId: id } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        message: true,
        status: true,
        actor: true,
        createdAt: true,
        order: { select: { id: true, orderNumber: true } },
      },
    });

    const byStatus = Object.fromEntries(orderStats.map((s) => [s.status, s._count]));
    const sumOf = (...statuses) => statuses.reduce((n, s) => n + (byStatus[s] || 0), 0);

    const isB2B = !!customer.user.b2bApplication || customer.user.orgMemberships.length > 0;

    return jsonResponse({
      ...customer,
      customerType: isB2B ? "B2B" : "CUSTOMER",
      // Derived account state: suspended is customer-level, blocked is account-level.
      accountStatus: !customer.user.isActive ? "BLOCKED" : customer.isActive ? "ACTIVE" : "SUSPENDED",
      wishlistItems: customer.wishlist?.items ?? [],
      activity,
      stats: {
        ordersByStatus: byStatus,
        totalOrders,
        pendingOrders: sumOf("PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"),
        completedOrders: sumOf("DELIVERED"),
        cancelledOrders: sumOf("CANCELLED", "RETURNED", "REFUNDED"),
        totalSpent: totalSpent._sum.total || 0,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_CUSTOMER_DETAIL_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { admin } = await requireAdmin("customers");
    const { id } = await params;
    const body = await request.json();

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return errorResponse("Customer not found", 404);

    const updates = {};
    const userUpdates = {};

    // Status actions:
    //   ACTIVATE — customer active, account able to sign in
    //   SUSPEND  — customer record suspended, sign-in still possible
    //   BLOCK    — account disabled entirely, sign-in refused
    let auditAction = "UPDATE";
    let statusLabel = null;
    if (body.action) {
      const action = String(body.action).toUpperCase();
      if (!["ACTIVATE", "SUSPEND", "BLOCK"].includes(action)) {
        return errorResponse("Unknown status action", 400);
      }
      if (action === "ACTIVATE") {
        updates.isActive = true;
        userUpdates.isActive = true;
        auditAction = "ACTIVATE";
      } else if (action === "SUSPEND") {
        updates.isActive = false;
        auditAction = "SUSPEND";
      } else {
        updates.isActive = false;
        userUpdates.isActive = false;
        auditAction = "SUSPEND";
      }
      statusLabel = action;
    } else if (typeof body.isActive === "boolean") {
      updates.isActive = body.isActive;
      auditAction = body.isActive ? "ACTIVATE" : "SUSPEND";
    }

    if (body.firstName) userUpdates.firstName = body.firstName.trim();
    if (body.lastName !== undefined) userUpdates.lastName = body.lastName?.trim() || null;
    if (body.phone !== undefined) userUpdates.phone = body.phone?.trim() || null;

    if (Object.keys(updates).length === 0 && Object.keys(userUpdates).length === 0) {
      return errorResponse("No changes supplied", 400);
    }

    // A phone number is unique across users — reject a clash with a clear message.
    if (userUpdates.phone) {
      const clash = await prisma.user.findFirst({
        where: { phone: userUpdates.phone, NOT: { id: customer.userId } },
        select: { id: true },
      });
      if (clash) return errorResponse("That phone number is already in use", 409);
    }

    const result = await prisma.$transaction(async (tx) => {
      let updatedCustomer = customer;
      if (Object.keys(updates).length > 0) {
        updatedCustomer = await tx.customer.update({ where: { id }, data: updates });
      }
      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({ where: { id: customer.userId }, data: userUpdates });
      }
      return updatedCustomer;
    });

    await createAuditLog({
      adminId: admin.id,
      action: auditAction,
      entityType: "Customer",
      entityId: id,
      description: statusLabel
        ? `${statusLabel} customer ${customer.customerNumber}`
        : `Updated customer ${customer.customerNumber}`,
      // Field names only — never the values, which are personal data.
      metadata: { fields: [...Object.keys(updates), ...Object.keys(userUpdates)], statusLabel },
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        null,
    });

    return jsonResponse({ ...result, blocked: !(await prisma.user.findUnique({
      where: { id: customer.userId }, select: { isActive: true },
    }))?.isActive });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_CUSTOMER_UPDATE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
