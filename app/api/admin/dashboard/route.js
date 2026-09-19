import { requireAdmin, jsonResponse, errorResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

/**
 * Aggregate revenue into time buckets for charting.
 * Returns an array of { date, customerRevenue, b2bRevenue, total }.
 */
async function getRevenueTimeSeries(since, days) {
  // Choose bucket size based on range
  let truncTo;
  if (days <= 1) truncTo = "hour";
  else if (days <= 90) truncTo = "day";
  else if (days <= 365) truncTo = "week";
  else truncTo = "month";

  // Customer revenue by bucket
  const customerBuckets = await prisma.$queryRawUnsafe(`
    SELECT date_trunc('${truncTo}', "createdAt") AS bucket,
           COALESCE(SUM("total"), 0) AS revenue
    FROM "customer_orders"
    WHERE "createdAt" >= $1
      AND "status" NOT IN ('CANCELLED')
      AND "paymentStatus" NOT IN ('FAILED')
    GROUP BY bucket
    ORDER BY bucket
  `, since);

  // B2B revenue by bucket
  const b2bBuckets = await prisma.$queryRawUnsafe(`
    SELECT date_trunc('${truncTo}', "createdAt") AS bucket,
           COALESCE(SUM("total"), 0) AS revenue
    FROM "b2b_orders"
    WHERE "createdAt" >= $1
      AND "status" NOT IN ('CANCELLED')
    GROUP BY bucket
    ORDER BY bucket
  `, since);

  // Merge into a single timeline
  const map = new Map();
  for (const row of customerBuckets) {
    const key = new Date(row.bucket).toISOString();
    map.set(key, { date: key, customerRevenue: Number(row.revenue), b2bRevenue: 0 });
  }
  for (const row of b2bBuckets) {
    const key = new Date(row.bucket).toISOString();
    const existing = map.get(key) || { date: key, customerRevenue: 0, b2bRevenue: 0 };
    existing.b2bRevenue = Number(row.revenue);
    map.set(key, existing);
  }

  const series = Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, total: d.customerRevenue + d.b2bRevenue }));

  return series;
}

/**
 * GET /api/admin/dashboard?days=30
 *
 * Returns comprehensive dashboard data:
 * - KPIs with previous-period comparison
 * - Revenue time series for charting
 * - Order status breakdown
 * - Recent orders (combined)
 * - Top products by units sold
 * - Low-stock products
 * - Customer & B2B overview
 * - Attention items
 * - Review summary
 */
export async function GET(request) {
  try {
    await requireAdmin("dashboard");

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - days);

    // Previous period for comparison
    const prevSince = new Date(since);
    prevSince.setDate(prevSince.getDate() - days);

    // ─── KPI Queries (current + previous period) ─────────────────────────
    const [
      // Current period
      customerRevenueCurrent,
      b2bRevenueCurrent,
      customerOrdersCurrent,
      b2bOrdersCurrent,
      newCustomersCurrent,
      newB2BOrgsCurrent,

      // Previous period
      customerRevenuePrev,
      b2bRevenuePrev,
      customerOrdersPrev,
      b2bOrdersPrev,
      newCustomersPrev,
      newB2BOrgsPrev,

      // All-time totals
      totalCustomers,
      totalB2BOrgs,
      totalProducts,
      activeProducts,

      // Order status breakdown (customer)
      pendingCustomerOrders,
      confirmedCustomerOrders,
      processingCustomerOrders,
      shippedCustomerOrders,
      deliveredCustomerOrders,
      cancelledCustomerOrders,
      failedPayments,

      // B2B order status
      pendingB2BOrders,

      // Attention items
      pendingApplications,
      pendingRFQs,
      activeQuotations,
      pendingPOs,
      outstandingInvoices,
      pendingReviews,

      // Review stats
      approvedReviews,
      totalReviewsAllTime,
      avgRatingResult,

      // Products
      lowStockProducts,
      outOfStockProducts,
      outOfStockCount,
      lowStockCount,

      // Recent orders (customer)
      recentCustomerOrders,

      // Recent orders (b2b)
      recentB2BOrders,

      // Top products by units sold
      topProductItems,

      // Recent pending reviews
      recentPendingReviews,

      // Active b2b orgs
      activeOrgs,
    ] = await Promise.all([
      // Current period revenue
      prisma.customerOrder.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: since },
          status: { not: "CANCELLED" },
          paymentStatus: { not: "FAILED" },
        },
      }),
      prisma.b2BOrder.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: since },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.customerOrder.count({ where: { createdAt: { gte: since } } }),
      prisma.b2BOrder.count({ where: { createdAt: { gte: since } } }),
      prisma.customer.count({ where: { createdAt: { gte: since } } }),
      prisma.b2BOrganization.count({ where: { createdAt: { gte: since } } }),

      // Previous period revenue
      prisma.customerOrder.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: prevSince, lt: since },
          status: { not: "CANCELLED" },
          paymentStatus: { not: "FAILED" },
        },
      }),
      prisma.b2BOrder.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: prevSince, lt: since },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.customerOrder.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
      prisma.b2BOrder.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
      prisma.customer.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
      prisma.b2BOrganization.count({ where: { createdAt: { gte: prevSince, lt: since } } }),

      // All-time totals
      prisma.customer.count(),
      prisma.b2BOrganization.count(),
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),

      // Customer order status breakdown
      prisma.customerOrder.count({ where: { status: "PENDING" } }),
      prisma.customerOrder.count({ where: { status: "CONFIRMED" } }),
      prisma.customerOrder.count({ where: { status: "PROCESSING" } }),
      prisma.customerOrder.count({ where: { status: "SHIPPED" } }),
      prisma.customerOrder.count({ where: { status: "DELIVERED" } }),
      prisma.customerOrder.count({ where: { status: "CANCELLED" } }),
      prisma.customerPayment.count({ where: { status: "FAILED" } }),

      // B2B pending
      prisma.b2BOrder.count({ where: { status: "PENDING" } }),

      // Attention
      prisma.b2BApplication.count({ where: { status: "PENDING" } }),
      prisma.b2BRFQ.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.b2BQuotation.count({ where: { status: "SENT" } }),
      prisma.b2BPurchaseOrder.count({ where: { status: { in: ["SUBMITTED", "CONFIRMED"] } } }),
      prisma.b2BInvoice.count({ where: { paymentStatus: { in: ["PENDING", "OVERDUE"] } } }),
      prisma.productReview.count({ where: { status: "PENDING" } }),

      // Reviews
      prisma.productReview.count({ where: { status: "APPROVED" } }),
      prisma.productReview.count(),
      prisma.productReview.aggregate({
        _avg: { rating: true },
        where: { status: "APPROVED" },
      }),

      // Low stock (1-10 units)
      prisma.product.findMany({
        where: { isActive: true, stock: { gt: 0, lte: 10 } },
        select: { id: true, name: true, sku: true, stock: true, images: true },
        orderBy: { stock: "asc" },
        take: 5,
      }),
      // Out of stock
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: 0 } },
        select: { id: true, name: true, sku: true, stock: true, images: true },
        take: 5,
      }),
      prisma.product.count({ where: { isActive: true, stock: { lte: 0 } } }),
      prisma.product.count({ where: { isActive: true, stock: { gt: 0, lte: 10 } } }),

      // Recent customer orders
      prisma.customerOrder.findMany({
        include: {
          customer: {
            select: {
              user: { select: { firstName: true, lastName: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Recent B2B orders
      prisma.b2BOrder.findMany({
        include: {
          organization: { select: { companyName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Top products by units sold (from order items)
      prisma.customerOrderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),

      // Recent pending reviews
      prisma.productReview.findMany({
        where: { status: "PENDING" },
        include: {
          product: { select: { name: true, images: true } },
          customer: {
            select: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Active B2B orgs
      prisma.b2BOrganization.count({ where: { status: "ACTIVE" } }),
    ]);

    // ─── Revenue time series ─────────────────────────────────────────────
    const revenueChart = await getRevenueTimeSeries(since, days);

    // ─── Enrich top products with product details ────────────────────────
    const topProductIds = topProductItems.map((t) => t.productId);
    const topProductDetails = topProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, name: true, sku: true, images: true, stock: true },
        })
      : [];

    const productMap = new Map(topProductDetails.map((p) => [p.id, p]));
    const topProducts = topProductItems.map((t) => {
      const p = productMap.get(t.productId);
      return {
        id: t.productId,
        name: p?.name || "Unknown",
        sku: p?.sku || null,
        image: p?.images?.[0] || null,
        stock: p?.stock ?? 0,
        unitsSold: t._sum.quantity || 0,
        revenue: t._sum.total || 0,
      };
    });

    // ─── Merge recent orders (customer + b2b) ───────────────────────────
    const recentOrders = [
      ...recentCustomerOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        type: "Customer",
        customer: [o.customer?.user?.firstName, o.customer?.user?.lastName].filter(Boolean).join(" ") || o.customer?.user?.email || "—",
        amount: o.total,
        paymentStatus: o.paymentStatus,
        status: o.status,
        createdAt: o.createdAt,
      })),
      ...recentB2BOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        type: "B2B",
        customer: o.organization?.companyName || "—",
        amount: o.total,
        paymentStatus: "—",
        status: o.status,
        createdAt: o.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    // ─── Compute KPIs with previous-period deltas ────────────────────────
    const currentRevenue = (customerRevenueCurrent._sum.total || 0) + (b2bRevenueCurrent._sum.total || 0);
    const prevRevenue = (customerRevenuePrev._sum.total || 0) + (b2bRevenuePrev._sum.total || 0);

    function delta(current, previous) {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    }

    return jsonResponse({
      // KPI cards
      kpi: {
        totalRevenue: {
          value: currentRevenue,
          previous: prevRevenue,
          delta: delta(currentRevenue, prevRevenue),
        },
        customerOrders: {
          value: customerOrdersCurrent,
          previous: customerOrdersPrev,
          delta: delta(customerOrdersCurrent, customerOrdersPrev),
        },
        b2bOrders: {
          value: b2bOrdersCurrent,
          previous: b2bOrdersPrev,
          delta: delta(b2bOrdersCurrent, b2bOrdersPrev),
        },
        totalCustomers: {
          value: totalCustomers,
          new: newCustomersCurrent,
          previousNew: newCustomersPrev,
          delta: delta(newCustomersCurrent, newCustomersPrev),
        },
        b2bOrganizations: {
          value: totalB2BOrgs,
          active: activeOrgs,
          new: newB2BOrgsCurrent,
          previousNew: newB2BOrgsPrev,
          delta: delta(newB2BOrgsCurrent, newB2BOrgsPrev),
        },
        totalProducts: {
          value: totalProducts,
          active: activeProducts,
        },
      },

      // Revenue chart
      revenueChart,

      // Order status breakdown
      orderStatus: {
        total: pendingCustomerOrders + confirmedCustomerOrders + processingCustomerOrders + shippedCustomerOrders + deliveredCustomerOrders + cancelledCustomerOrders,
        pending: pendingCustomerOrders,
        confirmed: confirmedCustomerOrders,
        processing: processingCustomerOrders,
        shipped: shippedCustomerOrders,
        delivered: deliveredCustomerOrders,
        cancelled: cancelledCustomerOrders,
        failedPayments,
        b2bPending: pendingB2BOrders,
      },

      // Recent orders
      recentOrders,

      // Top products
      topProducts,

      // Stock alerts
      stockAlerts: {
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
        lowStockCount,
        outOfStockCount,
      },

      // Customer & B2B
      customers: {
        total: totalCustomers,
        new: newCustomersCurrent,
        previousNew: newCustomersPrev,
      },
      b2b: {
        totalOrgs: totalB2BOrgs,
        activeOrgs,
        pendingApplications,
        newOrgs: newB2BOrgsCurrent,
        b2bOrders: b2bOrdersCurrent,
      },

      // Requires attention
      attention: {
        pendingOrders: pendingCustomerOrders + pendingB2BOrders,
        failedPayments,
        pendingApplications,
        lowStockCount,
        outOfStockCount,
        pendingReviews,
        pendingRFQs,
        activeQuotations,
        pendingPOs,
        outstandingInvoices,
      },

      // Reviews summary
      reviews: {
        pending: pendingReviews,
        approved: approvedReviews,
        total: totalReviewsAllTime,
        avgRating: avgRatingResult._avg.rating
          ? Math.round(avgRatingResult._avg.rating * 10) / 10
          : 0,
        recentPending: recentPendingReviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          productName: r.product.name,
          productImage: r.product.images?.[0] || null,
          customerName: [r.customer?.user?.firstName, r.customer?.user?.lastName].filter(Boolean).join(" ") || "Anonymous",
          createdAt: r.createdAt,
        })),
      },

      // Meta
      period: { days, since: since.toISOString() },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ADMIN_DASHBOARD_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
