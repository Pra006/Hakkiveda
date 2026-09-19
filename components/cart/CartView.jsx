"use client";

import Link from "next/link";
import { Section } from "@/components/ui/Section";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { formatNPR } from "@/lib/utils";
import { getProduct, getVendor } from "@/lib/data";
import { useCart } from "@/components/providers/CartProvider";
import { toast } from "react-toastify";

// The DB catalog has no vendor relation yet, so vendor details are looked up
// from the storefront catalog by product slug.
function vendorForItem(item) {
  const mock = getProduct(item.product.slug);
  return mock ? getVendor(mock.vendor) : null;
}

function CartLine({ item, onQuantity, onRemove, pending }) {
  return (
    <li className="p-4 flex gap-4">
      <Link href={`/products/${item.product.slug}`} className="shrink-0">
        <img src={item.image || item.product.images?.[0]} className="w-24 h-24 rounded-lg object-cover" alt="" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/products/${item.product.slug}`}>
          <h3 className="font-semibold text-forest-deep leading-snug line-clamp-2 hover:text-forest-base">
            {item.product.name}
          </h3>
        </Link>
        {item.variantName && (
          <div className="text-xs font-semibold text-forest-base mt-1">Option: {item.variantName}</div>
        )}
        <div className="text-xs text-on-surface-variant mt-1">
          {formatNPR(item.unitPrice)} each · {item.availableStock} in stock
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
          <div className="inline-flex items-center border border-outline-variant rounded overflow-hidden">
            <button
              className="w-8 h-8 hover:bg-forest-base/5 disabled:opacity-50"
              aria-label="Decrease quantity"
              disabled={pending || item.quantity <= 1}
              onClick={() => onQuantity(item.id, item.quantity - 1)}
            >
              <Icon name="remove" size={14} />
            </button>
            <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
            <button
              className="w-8 h-8 hover:bg-forest-base/5 disabled:opacity-50"
              aria-label="Increase quantity"
              disabled={pending || item.quantity >= item.availableStock}
              onClick={() => onQuantity(item.id, item.quantity + 1)}
            >
              <Icon name="add" size={14} />
            </button>
          </div>
          <button
            className="text-xs text-terracotta hover:text-terracotta/80 inline-flex items-center gap-1 disabled:opacity-50"
            disabled={pending}
            onClick={() => onRemove(item.id)}
          >
            <Icon name="delete" size={14} /> Remove
          </button>
          <div className="font-headline text-lg text-forest-deep">{formatNPR(item.lineTotal)}</div>
        </div>
      </div>
    </li>
  );
}

function VendorGroup({ vendor, items, onQuantity, onRemove, pending }) {
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-forest-base/5 border-b border-outline-variant/60">
        <div className="flex items-center gap-3">
          {vendor ? (
            <>
              <img src={vendor.logo} alt="" className="w-10 h-10 rounded-full object-cover border border-antique-gold/40" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-forest-deep">{vendor.name}</span>
                  <Icon name="verified" size={14} className="text-antique-gold" />
                </div>
                <div className="text-xs text-on-surface-variant">
                  {items.length} item{items.length > 1 ? "s" : ""} · {vendor.location}
                </div>
              </div>
            </>
          ) : (
            <div className="font-semibold text-forest-deep">
              {items.length} item{items.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
        <div className="text-xs text-forest-deep font-semibold">Subtotal: {formatNPR(subtotal)}</div>
      </div>

      <ul className="divide-y divide-outline-variant/60">
        {items.map((it) => (
          <CartLine key={it.id} item={it} onQuantity={onQuantity} onRemove={onRemove} pending={pending} />
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ title, body, action }) {
  return (
    <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/60 rounded-xl">
      <Icon name="shopping_bag" size={48} className="text-outline-variant mx-auto mb-4" />
      <h2 className="font-headline text-xl text-forest-deep">{title}</h2>
      <p className="text-sm text-on-surface-variant mt-1">{body}</p>
      <div className="mt-5">{action}</div>
    </div>
  );
}

export default function CartView() {
  const {
    items,
    count,
    subtotal,
    shipping,
    tax,
    total,
    loading,
    pending,
    error,
    signedIn,
    setQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const byVendor = new Map();
  items.forEach((item) => {
    const vendor = vendorForItem(item);
    const key = vendor?.slug || "other";
    if (!byVendor.has(key)) byVendor.set(key, { vendor, items: [] });
    byVendor.get(key).items.push(item);
  });

  return (
    <Section className="pb-16">
      <nav className="text-xs text-on-surface-variant flex items-center gap-1.5 py-6">
        <Link href="/" className="hover:text-forest-deep">Home</Link>
        <Icon name="chevron_right" size={14} />
        <span className="text-forest-deep font-semibold">Shopping Cart</span>
      </nav>

      <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="font-headline text-3xl sm:text-4xl text-forest-deep">Your Bag</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {loading
              ? "Loading your cart…"
              : `${count} item${count === 1 ? "" : "s"} from ${byVendor.size} business${
                  byVendor.size === 1 ? "" : "es"
                }`}
          </p>
        </div>
        <Link href="/shop" className="text-sm font-semibold text-forest-deep hover:text-antique-gold inline-flex items-center gap-1">
          <Icon name="arrow_back" size={16} /> Continue shopping
        </Link>
      </div>

      {error && (
        <p className="mb-5 text-sm text-terracotta font-semibold flex items-center gap-1.5">
          <Icon name="error" size={16} /> {error}
        </p>
      )}

      {loading ? (
        <div className="py-20 text-center text-sm text-on-surface-variant">Loading your cart…</div>
      ) : !signedIn ? (
        <EmptyState
          title="Sign in to see your bag"
          body="Your cart is saved to your account so it follows you across devices."
          action={
            <Button as={Link} href="/auth/login?callbackUrl=%2Fcart" size="lg">
              Sign in
              <Icon name="arrow_forward" size={18} className="text-antique-gold" />
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Your bag is empty"
          body="Browse the collections and add something you love."
          action={
            <Button as={Link} href="/shop" size="lg">
              <Icon name="storefront" size={18} className="text-antique-gold" />
              Browse products
            </Button>
          }
        />
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-5">
            {[...byVendor.entries()].map(([key, group]) => (
              <VendorGroup
                key={key}
                vendor={group.vendor}
                items={group.items}
                onQuantity={setQuantity}
                onRemove={removeItem}
                pending={pending}
              />
            ))}
            <button
              onClick={clearCart}
              disabled={pending}
              className="text-xs text-on-surface-variant hover:text-terracotta inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Icon name="delete_sweep" size={14} /> Empty bag
            </button>
          </div>

          <aside className="self-start lg:sticky lg:top-24 bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6">
            <h2 className="font-headline text-xl text-forest-deep">Order Summary</h2>

            <dl className="mt-6 space-y-2.5 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <dt>Subtotal</dt>
                <dd className="text-forest-deep">{formatNPR(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <dt>Shipping</dt>
                <dd className="text-forest-deep">{shipping === 0 ? "Free" : formatNPR(shipping)}</dd>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <dt>VAT (13%)</dt>
                <dd className="text-forest-deep">{formatNPR(tax)}</dd>
              </div>
              <div className="border-t border-outline-variant pt-3 mt-3 flex justify-between items-baseline">
                <dt className="font-semibold text-forest-deep">Grand Total</dt>
                <dd className="font-headline text-2xl text-forest-deep">{formatNPR(total)}</dd>
              </div>
            </dl>

            <Button as={Link} href="/checkout" size="lg" className="w-full mt-6">
              Proceed to Checkout
              <Icon name="arrow_forward" size={18} className="text-antique-gold" />
            </Button>

            <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-on-surface-variant">
              <div className="flex items-center gap-1.5"><Icon name="encrypted" size={14} className="text-antique-gold"/> Secure checkout</div>
              <div className="flex items-center gap-1.5"><Icon name="local_shipping" size={14} className="text-antique-gold"/> Nepal-wide delivery</div>
              <div className="flex items-center gap-1.5"><Icon name="undo" size={14} className="text-antique-gold"/> 7-day returns</div>
              <div className="flex items-center gap-1.5"><Icon name="verified" size={14} className="text-antique-gold"/> Verified businesses</div>
            </div>
          </aside>
        </div>
      )}
    </Section>
  );
}
