import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatNPR } from "@/lib/utils";
import Icon from "@/components/ui/Icon";

export default async function RecentOrderBanner() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const customer = await prisma.customer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!customer) return null;

  const order = await prisma.customerOrder.findFirst({
    where: {
      customerId: customer.id,
      status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: { select: { slug: true, images: true, isActive: true } },
        },
      },
    },
  });

  if (!order || order.items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-outline-variant/40 bg-surface-container-low/30 flex items-center justify-between">
          <h2 className="font-semibold text-forest-deep text-sm">
            Order Items ({order.items.length})
          </h2>
          <Link
            href={`/account/orders/${order.id}`}
            className="text-xs font-medium text-antique-gold hover:text-forest-deep inline-flex items-center gap-1"
          >
            View Order <Icon name="arrow_forward" size={14} />
          </Link>
        </div>
        <div className="divide-y divide-outline-variant/40">
          {order.items.map((item) => {
            const image = item.productImage || item.product?.images?.[0];
            const productLink =
              item.product?.slug && item.product?.isActive
                ? `/products/${item.product.slug}`
                : null;
            const snapName = item.productName || "Product";
            const snapSku = item.productSku || item.variantSku;
            return (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-14 h-14 bg-surface-container rounded-lg overflow-hidden shrink-0 border border-outline-variant/40">
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon
                        name="inventory_2"
                        size={22}
                        className="text-on-surface-variant/30"
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {productLink ? (
                    <Link
                      href={productLink}
                      className="text-sm font-semibold text-forest-deep hover:text-antique-gold truncate block"
                    >
                      {snapName}
                    </Link>
                  ) : (
                    <div className="text-sm font-semibold text-forest-deep truncate">
                      {snapName}
                    </div>
                  )}
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {snapSku ? `SKU ${snapSku} · ` : ""}Qty: {item.quantity} ×{" "}
                    {formatNPR(item.unitPrice)}
                  </p>
                </div>
                <div className="text-sm font-semibold text-forest-deep shrink-0">
                  {formatNPR(item.total || item.unitPrice * item.quantity)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
