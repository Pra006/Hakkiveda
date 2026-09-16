import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatNPR } from "@/lib/utils";
import Icon from "@/components/ui/Icon";
import CancelOrderButton from "@/components/account/CancelOrderButton";

export const metadata = { title: "Order Details" };

const statusStyles = {
  PENDING: "bg-antique-gold/15 text-antique-gold border-antique-gold/30",
  CONFIRMED: "bg-forest-base/10 text-forest-base border-forest-base/30",
  PROCESSING: "bg-herbal-jade/15 text-herbal-jade border-herbal-jade/30",
  SHIPPED: "bg-herbal-jade/15 text-herbal-jade border-herbal-jade/30",
  DELIVERED: "bg-forest-base/10 text-forest-base border-forest-base/30",
  CANCELLED: "bg-terracotta/15 text-terracotta border-terracotta/30",
  RETURNED: "bg-terracotta/15 text-terracotta border-terracotta/30",
  REFUNDED: "bg-terracotta/15 text-terracotta border-terracotta/30",
};

const paymentStatusStyles = {
  PENDING: "text-antique-gold",
  COMPLETED: "text-forest-base",
  FAILED: "text-terracotta",
  REFUNDED: "text-terracotta",
};

const CANCELLABLE = ["PENDING", "CONFIRMED"];

export default async function OrderDetailPage({ params }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/account/orders");

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!customer) notFound();

  const order = await prisma.customerOrder.findFirst({
    where: { id, customerId: customer.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, slug: true, images: true, isActive: true } },
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  const canCancel = CANCELLABLE.includes(order.status);
  const latestPayment = order.payments[0] || null;

  return (
    <div>
      {/* Back + Title */}
      <div className="mb-6">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-forest-deep mb-3"
        >
          <Icon name="arrow_back" size={16} /> Back to orders
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-headline text-2xl sm:text-3xl text-forest-deep">{order.orderNumber}</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${statusStyles[order.status] || "bg-surface-container text-on-surface-variant"}`}>
              {order.status}
            </span>
            {canCancel && <CancelOrderButton orderId={order.id} />}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Items — spans 2 cols */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order Items */}
          <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-outline-variant/40 bg-surface-container-low/30">
              <h2 className="font-semibold text-forest-deep text-sm">
                Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-outline-variant/40">
              {order.items.map((item) => {
                const image = item.productImage || item.product?.images?.[0];
                const productLink = item.product?.slug && item.product?.isActive
                  ? `/products/${item.product.slug}` : null;
                return (
                  <div key={item.id} className="flex gap-4 px-5 py-4">
                    {image ? (
                      <img src={image} alt="" className="w-16 h-16 rounded-lg object-cover border border-outline-variant/40 shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                        <Icon name="inventory_2" size={24} className="text-on-surface-variant/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {productLink ? (
                            <Link href={productLink} className="text-sm font-semibold text-forest-deep hover:text-antique-gold truncate block">
                              {item.productName || item.product?.name || "Product"}
                            </Link>
                          ) : (
                            <div className="text-sm font-semibold text-forest-deep truncate">
                              {item.productName || "Product"}
                            </div>
                          )}
                          {(item.variantName || item.variantSku) && (
                            <div className="text-xs text-on-surface-variant mt-0.5">
                              {item.variantName}{item.variantSku ? ` · ${item.variantSku}` : ""}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-forest-deep shrink-0">
                          {formatNPR(item.total || item.unitPrice * item.quantity)}
                        </div>
                      </div>
                      <div className="text-xs text-on-surface-variant mt-1">
                        {formatNPR(item.unitPrice)} × {item.quantity}
                        {item.discount > 0 && (
                          <span className="text-terracotta ml-2">-{formatNPR(item.discount)} discount</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Timeline */}
          {order.events.length > 0 && (
            <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-outline-variant/40 bg-surface-container-low/30">
                <h2 className="font-semibold text-forest-deep text-sm">Order Timeline</h2>
              </div>
              <div className="px-5 py-4">
                <div className="space-y-4">
                  {order.events.map((event, i) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${i === order.events.length - 1 ? "bg-forest-base" : "bg-outline-variant"}`} />
                        {i < order.events.length - 1 && <div className="w-px flex-1 bg-outline-variant/50 my-1" />}
                      </div>
                      <div className="pb-2">
                        <div className="text-sm text-forest-deep">{event.message}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">
                          {new Date(event.createdAt).toLocaleString("en-US", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                          {event.actor !== "SYSTEM" && ` · ${event.actor.toLowerCase()}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Order Summary */}
          <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-outline-variant/40 bg-surface-container-low/30">
              <h2 className="font-semibold text-forest-deep text-sm">Order Summary</h2>
            </div>
            <div className="px-5 py-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="text-forest-deep">{formatNPR(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Discount</span>
                  <span className="text-terracotta">-{formatNPR(order.discount)}</span>
                </div>
              )}
              {order.couponCode && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Coupon</span>
                  <span className="text-forest-base font-mono text-xs">{order.couponCode}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Shipping</span>
                <span className="text-forest-deep">{order.shippingCost === 0 ? "Free" : formatNPR(order.shippingCost)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Tax</span>
                  <span className="text-forest-deep">{formatNPR(order.tax)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2.5 border-t border-outline-variant/40">
                <span className="font-semibold text-forest-deep">Total</span>
                <span className="font-headline text-xl text-forest-deep">{formatNPR(order.total)}</span>
              </div>
            </div>
          </section>

          {/* Payment */}
          {latestPayment && (
            <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-outline-variant/40 bg-surface-container-low/30">
                <h2 className="font-semibold text-forest-deep text-sm">Payment</h2>
              </div>
              <div className="px-5 py-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Method</span>
                  <span className="font-medium text-forest-deep">{latestPayment.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Status</span>
                  <span className={`font-semibold ${paymentStatusStyles[latestPayment.status] || "text-on-surface-variant"}`}>
                    {latestPayment.status}
                  </span>
                </div>
                {latestPayment.provider && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Provider</span>
                    <span className="text-forest-deep">{latestPayment.provider}</span>
                  </div>
                )}
                {latestPayment.transactionUuid && (
                  <div className="flex justify-between gap-2">
                    <span className="text-on-surface-variant shrink-0">Transaction</span>
                    <span className="text-forest-deep font-mono text-xs truncate">{latestPayment.transactionUuid}</span>
                  </div>
                )}
                {latestPayment.providerRefId && (
                  <div className="flex justify-between gap-2">
                    <span className="text-on-surface-variant shrink-0">Reference</span>
                    <span className="text-forest-deep font-mono text-xs truncate">{latestPayment.providerRefId}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Shipping Address */}
          {(order.shippingFullName || order.shippingStreet) && (
            <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-outline-variant/40 bg-surface-container-low/30">
                <h2 className="font-semibold text-forest-deep text-sm">Shipping Address</h2>
              </div>
              <div className="px-5 py-4 text-sm text-on-surface-variant leading-relaxed">
                <div className="font-semibold text-forest-deep">{order.shippingFullName}</div>
                {order.shippingStreet && <div>{order.shippingStreet}</div>}
                <div>
                  {[order.shippingCity, order.shippingState].filter(Boolean).join(", ")}
                </div>
                {order.shippingPostalCode && <div>{order.shippingPostalCode}</div>}
                {order.shippingCountry && <div>{order.shippingCountry}</div>}
                {order.shippingPhone && <div className="mt-1">{order.shippingPhone}</div>}
              </div>
            </section>
          )}

          {/* Tracking */}
          {order.trackingNumber && (
            <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-outline-variant/40 bg-surface-container-low/30">
                <h2 className="font-semibold text-forest-deep text-sm">Tracking</h2>
              </div>
              <div className="px-5 py-4 text-sm space-y-1.5">
                {order.courier && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Courier</span>
                    <span className="text-forest-deep">{order.courier}</span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-on-surface-variant">Tracking #</span>
                  <span className="text-forest-deep font-mono text-xs">{order.trackingNumber}</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
