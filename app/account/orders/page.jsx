import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatNPR } from "@/lib/utils";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";

export const metadata = { title: "My Orders" };

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

function formatStatus(status) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/account/orders");

  const customer = await prisma.customer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const orders = customer
    ? await prisma.customerOrder.findMany({
        where: { customerId: customer.id },
        include: {
          items: {
            include: {
              product: { select: { name: true, images: true, slug: true } },
            },
          },
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl text-forest-deep">My Orders</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {orders.length === 0 ? "No orders yet" : `${orders.length} order${orders.length !== 1 ? "s" : ""} placed`}
          </p>
        </div>
        <Button as={Link} href="/shop" variant="secondary" size="sm">
          <Icon name="shopping_bag" size={16} /> Continue Shopping
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-center px-6 py-16">
          <Icon name="receipt_long" size={48} className="text-outline-variant mx-auto mb-4" />
          <h2 className="font-headline text-xl text-forest-deep">No orders yet</h2>
          <p className="text-sm text-on-surface-variant mt-2 max-w-sm mx-auto">
            Start shopping and your orders will appear here.
          </p>
          <Button as={Link} href="/shop" className="mt-6">
            Browse the shop
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden hover:border-forest-base/30 hover:shadow-sm transition-all"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-b border-outline-variant/40 bg-surface-container-low/30">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-on-surface-variant">Order</div>
                    <div className="font-semibold text-forest-deep text-sm">{order.orderNumber}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyles[order.status] || "bg-surface-container text-on-surface-variant"}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="px-5 sm:px-6 py-4">
                <div className="space-y-3">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.productImage || item.product?.images?.[0] ? (
                        <img
                          src={item.productImage || item.product.images[0]}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-outline-variant/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                          <Icon name="inventory_2" size={16} className="text-on-surface-variant/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-on-surface truncate">
                          {item.productName || item.product?.name}
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          Qty: {item.quantity} × {formatNPR(item.unitPrice)}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-forest-deep shrink-0">
                        {formatNPR(item.total || item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="text-xs text-on-surface-variant">
                      +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-outline-variant/40">
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    {order.payments?.[0] && (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="payments" size={14} />
                        {order.payments[0].method}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline text-lg text-forest-deep">{formatNPR(order.total)}</span>
                    <Icon name="chevron_right" size={18} className="text-on-surface-variant/40" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
