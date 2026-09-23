"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { formatNPR } from "@/lib/utils";
import { useCart } from "@/components/providers/CartProvider";
import { toast } from "react-toastify";

export default function VariantAndCart({ product }) {
  const { data: session } = useSession();
  const isB2B = !!session?.user?.isB2B;

  // Default to the first option that can actually be bought.
  const [variantId, setVariantId] = useState(
    () => (product.variants?.find((v) => v.stock > 0) || product.variants?.[0])?.id ?? null
  );
  const variant = product.variants?.find((v) => v.id === variantId);
  const outOfStock = !variant || variant.stock <= 0;

  // B2B min order qty: variant-level overrides product-level
  const b2bMin = isB2B
    ? (variant?.b2bMinOrderQty ?? product.b2bMinOrderQty ?? product.moq ?? 1)
    : 1;
  const minQty = isB2B ? b2bMin : 1;

  const [qty, setQty] = useState(minQty);
  const [added, setAdded] = useState(false);

  // Reset qty to B2B minimum when session loads and user is B2B
  useEffect(() => {
    setQty((q) => Math.max(minQty, q));
  }, [minQty]);

  const router = useRouter();
  const { addItem, pending, signedIn, sessionStatus, error } = useCart();

  function requireLogin() {
    router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/products/${product.slug}`)}`);
  }

  async function handleAdd() {
    if (sessionStatus === "loading") return;
    if (!signedIn) return requireLogin();
    try {
      await addItem({ slug: product.slug, variantId, quantity: qty });
      setAdded(true);
      toast.success("Added to cart!");
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      toast.error(err.message || "Could not add to cart");
    }
  }

  async function handleBuyNow() {
    if (sessionStatus === "loading") return;
    if (!signedIn) return requireLogin();
    try {
      await addItem({ slug: product.slug, variantId, quantity: qty });
      router.push("/checkout");
    } catch (err) {
      toast.error(err.message || "Could not add to cart");
    }
  }

  // Derive the displayed SKU: prefer the selected variant's SKU, fall back to product SKU.
  const displaySku = variant?.sku || product.sku || null;

  return (
    <div className="mt-6">
      {displaySku && (
        <p className="mb-4 text-xs text-on-surface-variant">
          SKU: <span className="font-semibold text-forest-deep">{displaySku}</span>
        </p>
      )}
      {product.hasVariants && (
        <div className="mb-5">
          <div className="flex items-baseline justify-between gap-3">
            <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Option</label>
            {variant && (
              <span className="font-headline text-xl text-forest-deep">{formatNPR(variant.price)}</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setVariantId(v.id);
                  const newMin = isB2B ? (v.b2bMinOrderQty ?? product.b2bMinOrderQty ?? product.moq ?? 1) : 1;
                  setQty((q) => Math.max(newMin, q));
                }}
                disabled={v.stock <= 0}
                className={`px-4 py-2 rounded border text-sm font-semibold disabled:opacity-40 disabled:line-through ${
                  variantId === v.id
                    ? "border-forest-base bg-forest-base text-ivory-canvas"
                    : "border-outline-variant text-forest-deep hover:border-forest-base"
                }`}
              >
                {v.size} · {formatNPR(v.price)}
              </button>
            ))}
          </div>
        </div>
      )}

      {isB2B && minQty > 1 && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <Icon name="business" size={16} />
          <span>B2B Minimum Order: <strong>{minQty} units</strong></span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="inline-flex items-center border border-outline-variant rounded overflow-hidden">
          <button
            onClick={() => setQty((q) => Math.max(minQty, q - 1))}
            className="w-10 h-10 text-forest-deep hover:bg-forest-base/5"
            aria-label="Decrease"
            disabled={qty <= minQty}
          >
            <Icon name="remove" size={16} />
          </button>
          <span className="w-12 text-center font-semibold text-forest-deep">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(variant?.stock || 99, q + 1))}
            className="w-10 h-10 text-forest-deep hover:bg-forest-base/5"
            aria-label="Increase"
          >
            <Icon name="add" size={16} />
          </button>
        </div>
        <span className="text-xs text-on-surface-variant">
          {variant?.stock > 0 ? (
            <span className="text-herbal-jade font-semibold">In stock — {variant.stock} left</span>
          ) : (
            <span className="text-terracotta font-semibold">Out of stock</span>
          )}
        </span>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <Button size="lg" className="flex-1" disabled={outOfStock || pending} onClick={handleAdd}>
          <Icon name={added ? "check_circle" : "add_shopping_cart"} size={18} className="text-antique-gold" />
          {added ? "Added to Cart" : pending ? "Adding…" : "Add to Cart"}
        </Button>
        <Button size="lg" variant="gold" className="flex-1" disabled={outOfStock || pending} onClick={handleBuyNow}>
          Buy Now
        </Button>
        <button
          aria-label="Add to wishlist"
          className="w-12 h-12 rounded border border-outline-variant flex items-center justify-center text-forest-deep hover:text-terracotta hover:border-terracotta"
        >
          <Icon name="favorite" size={20} />
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-terracotta font-semibold">{error}</p>}
    </div>
  );
}
