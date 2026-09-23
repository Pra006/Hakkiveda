import { requireAdmin, jsonResponse, errorResponse, parsePagination, paginatedResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    await requireAdmin("customer-orders");
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const fulfillmentStatus = searchParams.get("fulfillmentStatus") || "";

    const where = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { trackingNumber: { contains: search, mode: "insensitive" } },
        { customer: { user: { firstName: { contains: search, mode: "insensitive" } } } },
        { customer: { user: { lastName: { contains: search, mode: "insensitive" } } } },
        { customer: { user: { email: { contains: search, mode: "insensitive" } } } },
      ];
    }
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (fulfillmentStatus) where.fulfillmentStatus = fulfillmentStatus;

    const [orders, total] = await Promise.all([
      prisma.customerOrder.findMany({
        where,
        include: {
          customer: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customerOrder.count({ where }),
    ]);

    const data = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: [o.customer?.user?.firstName, o.customer?.user?.lastName].filter(Boolean).join(" "),
      customerEmail: o.customer?.user?.email,
      customerId: o.customerId,
      status: o.status,
      paymentStatus: o.paymentStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      itemCount: o._count.items,
      subtotal: o.subtotal,
      discount: o.discount,
      tax: o.tax,
      shippingCost: o.shippingCost,
      total: o.total,
      currency: o.currency,
      couponCode: o.couponCode,
      trackingNumber: o.trackingNumber,
      courier: o.courier,
      notes: o.notes,
      createdAt: o.createdAt,
    }));

    return paginatedResponse(data, total, page, limit);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_CUSTOMER_ORDERS_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
