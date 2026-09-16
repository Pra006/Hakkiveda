import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatNPR } from "@/lib/utils";
import Icon from "@/components/ui/Icon";

export const metadata = { title: "Overview" };

const statusStyles = {
  PENDING: "bg-antique-gold/15 text-antique-gold",
  CONFIRMED: "bg-forest-base/10 text-forest-base",
  PROCESSING: "bg-herbal-jade/15 text-herbal-jade",
  SHIPPED: "bg-herbal-jade/15 text-herbal-jade",
  DELIVERED: "bg-forest-base/10 text-forest-base",
  CANCELLED: "bg-terracotta/15 text-terracotta",
  RETURNED: "bg-terracotta/15 text-terracotta",
  REFUNDED: "bg-terracotta/15 text-terracotta",
};

export default async function AccountDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/account");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, name: true, email: true, image: true },
  });

  if (!user) redirect("/auth/login");

  const customer = await prisma.customer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || "there";

  let orderCount = 0;
  let wishlistCount = 0;
  let addressCount = 0;
  let recentOrders = [];

  if (customer) {
    const [oCount, wCount, aCount, orders] = await Promise.all([
      prisma.customerOrder.count({ where: { customerId: customer.id } }),
      prisma.customerWishlistItem.count({
        where: { wishlist: { customerId: customer.id } },
      }),
      prisma.customerAddress.count({ where: { customerId: customer.id } }),
      prisma.customerOrder.findMany({
        where: { customerId: customer.id },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          items: { select: { id: true }, take: 5 },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);
    orderCount = oCount;
    wishlistCount = wCount;
    addressCount = aCount;
    recentOrders = orders;
  }

  const stats = [
    { label: "Orders", value: orderCount, icon: "receipt_long", href: "/account/orders" },
    { label: "Wishlist", value: wishlistCount, icon: "favorite", href: "/account/wishlist" },
    { label: "Addresses", value: addressCount, icon: "location_on", href: "/account/addresses" },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="flex items-center gap-4 mb-8">
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="w-14 h-14 rounded-full object-cover border-2 border-antique-gold/30"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-forest-base text-antique-gold flex items-center justify-center font-headline text-2xl">
            {displayName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl text-forest-deep">
            Welcome back, {displayName.split(" ")[0]}
          </h1>
          <p className="text-sm text-on-surface-variant">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 sm:p-5 hover:border-forest-base/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-forest-base/8 flex items-center justify-center">
                <Icon name={s.icon} size={18} className="text-forest-base" />
              </div>
            </div>
            <div className="font-headline text-2xl sm:text-3xl text-forest-deep">{s.value}</div>
            <div className="text-xs text-on-surface-variant mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {[
          { label: "Browse Products", icon: "shopping_bag", href: "/shop", desc: "Discover new products" },
          { label: "Account Settings", icon: "settings", href: "/account/settings", desc: "Update your profile" },
        ].map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex items-center gap-4 bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 hover:border-forest-base/30 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-antique-gold/10 flex items-center justify-center shrink-0">
              <Icon name={a.icon} size={20} className="text-antique-gold" />
            </div>
            <div>
              <div className="text-sm font-semibold text-forest-deep">{a.label}</div>
              <div className="text-xs text-on-surface-variant">{a.desc}</div>
            </div>
            <Icon name="chevron_right" size={18} className="text-on-surface-variant/50 ml-auto" />
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-lg text-forest-deep">Recent Orders</h2>
          {orderCount > 0 && (
            <Link href="/account/orders" className="text-xs font-semibold text-forest-base hover:text-antique-gold transition-colors">
              View all
            </Link>
          )}
        </div>
        {recentOrders.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-center px-6 py-12">
            <Icon name="receipt_long" size={36} className="text-outline-variant mx-auto mb-3" />
            <p className="text-sm text-on-surface-variant">No orders yet. Start shopping!</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-forest-base hover:text-antique-gold"
            >
              <Icon name="shopping_bag" size={16} /> Browse products
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between gap-4 bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 sm:px-5 py-3.5 hover:border-forest-base/30 hover:shadow-sm transition-all"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-forest-deep">{order.orderNumber}</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {" · "}
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyles[order.status] || "bg-surface-container text-on-surface-variant"}`}>
                    {order.status}
                  </span>
                  <span className="font-semibold text-sm text-forest-deep hidden sm:inline">{formatNPR(order.total)}</span>
                  <Icon name="chevron_right" size={16} className="text-on-surface-variant/40" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
