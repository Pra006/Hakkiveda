import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import B2BStatusBadge from "@/components/b2b/B2BStatusBadge";
import { formatNPR } from "@/lib/utils";

export const metadata = { title: "B2B Dashboard — Hakkiveda" };

export default async function B2BDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const membership = await prisma.b2BOrganizationMember.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: { organization: true },
  });

  if (!membership) redirect("/b2b/apply");

  const org = membership.organization;

  // Fetch dashboard data
  const [recentOrders, pendingRFQs, activeQuotes, pendingInvoices, stats] = await Promise.all([
    prisma.b2BOrder.findMany({
      where: { organizationId: org.id },
      include: { placedBy: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.b2BRFQ.count({
      where: { organizationId: org.id, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    }),
    prisma.b2BQuotation.count({
      where: { organizationId: org.id, status: "SENT" },
    }),
    prisma.b2BInvoice.findMany({
      where: { organizationId: org.id, paymentStatus: { in: ["PENDING", "OVERDUE"] } },
      select: { total: true, paymentStatus: true },
    }),
    Promise.all([
      prisma.b2BOrder.count({ where: { organizationId: org.id } }),
      prisma.b2BPurchaseOrder.count({ where: { organizationId: org.id } }),
      prisma.b2BOrder.aggregate({ where: { organizationId: org.id }, _sum: { total: true } }),
    ]),
  ]);

  const totalOrders = stats[0];
  const totalPOs = stats[1];
  const totalSpent = stats[2]._sum.total || 0;
  const outstandingAmount = pendingInvoices.reduce((s, i) => s + i.total, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-antique-gold">
            B2B Portal
          </div>
          <h1 className="font-headline text-3xl text-forest-deep mt-1">
            Welcome, {session.user.name?.split(" ")[0] || "Partner"}
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {org.companyName} · <span className="capitalize">{membership.role.replace(/_/g, " ").toLowerCase()}</span>
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Orders", value: totalOrders, icon: "local_shipping", accent: "forest" },
          { label: "Purchase Orders", value: totalPOs, icon: "receipt_long", accent: "jade" },
          { label: "Total Spent", value: formatNPR(totalSpent), icon: "payments", accent: "gold" },
          { label: "Outstanding", value: formatNPR(outstandingAmount), icon: "account_balance", accent: "terracotta" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon name={stat.icon} size={20} className={
                stat.accent === "gold" ? "text-antique-gold" :
                stat.accent === "terracotta" ? "text-terracotta" :
                stat.accent === "jade" ? "text-herbal-jade" : "text-forest-base"
              } />
              <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                {stat.label}
              </span>
            </div>
            <div className="font-headline text-2xl text-forest-deep">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Action cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/b2b/rfq"
          className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-lg bg-antique-gold/10 flex items-center justify-center">
            <Icon name="request_quote" size={22} className="text-antique-gold" />
          </div>
          <div>
            <div className="text-sm font-semibold text-forest-deep">Pending RFQs</div>
            <div className="text-xs text-on-surface-variant">{pendingRFQs} requests</div>
          </div>
        </Link>

        <Link
          href="/b2b/quotes"
          className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-lg bg-herbal-jade/10 flex items-center justify-center">
            <Icon name="description" size={22} className="text-herbal-jade" />
          </div>
          <div>
            <div className="text-sm font-semibold text-forest-deep">Active Quotes</div>
            <div className="text-xs text-on-surface-variant">{activeQuotes} quotations</div>
          </div>
        </Link>

        <Link
          href="/b2b/invoices"
          className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center">
            <Icon name="receipt" size={22} className="text-terracotta" />
          </div>
          <div>
            <div className="text-sm font-semibold text-forest-deep">Outstanding Invoices</div>
            <div className="text-xs text-on-surface-variant">{pendingInvoices.length} invoices</div>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40">
          <h2 className="font-headline text-xl text-forest-deep">Recent Orders</h2>
          <Link href="/b2b/orders" className="text-sm font-semibold text-forest-deep hover:text-antique-gold">
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Icon name="local_shipping" size={40} className="text-outline-variant mx-auto mb-3" />
            <p className="text-sm text-on-surface-variant">No orders yet</p>
            <Link
              href="/b2b/products"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-forest-deep hover:text-antique-gold"
            >
              <Icon name="inventory_2" size={16} />
              Browse B2B Products
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-on-surface-variant">
                  <th className="px-6 py-3 font-semibold">Order</th>
                  <th className="px-6 py-3 font-semibold">Placed By</th>
                  <th className="px-6 py-3 font-semibold">Total</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-container-low">
                    <td className="px-6 py-3 font-semibold text-forest-deep">{order.orderNumber}</td>
                    <td className="px-6 py-3 text-on-surface-variant">{order.placedBy?.user ? [order.placedBy.user.firstName, order.placedBy.user.lastName].filter(Boolean).join(" ") : "—"}</td>
                    <td className="px-6 py-3 font-semibold">{formatNPR(order.total)}</td>
                    <td className="px-6 py-3"><B2BStatusBadge status={order.status} /></td>
                    <td className="px-6 py-3 text-on-surface-variant">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
