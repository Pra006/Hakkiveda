"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import Rating from "@/components/ui/Rating";
import Price from "@/components/ui/Price";
import Badge from "@/components/ui/Badge";
import { discountPercent } from "@/lib/utils";
import { getVendor } from "@/lib/data";
import { useCart } from "@/components/providers/CartProvider";

export default function ProductCard({ product, compact = false }) {
  const vendor = getVendor(product.vendor);
  const pct = discountPercent(product.compareAt, product.price);
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const { addItem, pending, signedIn, sessionStatus } = useCart();

  async function handleAdd(e) {
    e.preventDefault();
    if (sessionStatus === "loading") return;
    if (!signedIn) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/products/${product.slug}`)}`);
      return;
    }
    try {
      await addItem({ slug: product.slug, quantity: 1 });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      /* error surfaced on the cart page */
    }
  }

  return (
    <article className="group relative flex flex-col bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden hover:shadow-lg hover:border-antique-gold/40 transition-all">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/5] bg-surface-container overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {pct > 0 && <Badge tone="sale">−{pct}%</Badge>}
          {product.trending && <Badge tone="forest">Trending</Badge>}
        </div>
        <button
          aria-label="Add to wishlist"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-surface/95 backdrop-blur flex items-center justify-center text-forest-deep hover:text-terracotta shadow-sm"
          onClick={(e) => e.preventDefault()}
        >
          <Icon name="favorite" size={18} />
        </button>
      </Link>

      <div className="p-4 flex flex-col gap-2 flex-1">
        {vendor && (
          <Link
            href={`/stores/${vendor.slug}`}
            className="inline-flex items-center gap-1.5 text-xs text-antique-gold font-semibold tracking-wide hover:underline w-fit"
          >
            <Icon name="verified" size={13} />
            {vendor.name}
          </Link>
        )}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-headline text-base text-forest-deep leading-snug line-clamp-2 hover:text-forest-base">
            {product.name}
          </h3>
        </Link>
        {!compact && (
          <p className="text-xs text-on-surface-variant line-clamp-2">{product.shortDescription}</p>
        )}
        <Rating value={product.rating} count={product.reviewCount} />
        <div className="mt-1">
          <Price price={product.price} compareAt={product.compareAt} size="sm" />
        </div>
        <button
          onClick={handleAdd}
          disabled={pending}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-forest-base text-antique-gold text-sm font-semibold hover:bg-forest-deep disabled:opacity-60 transition-colors"
        >
          <Icon name={added ? "check" : "add_shopping_cart"} size={16} />
          {added ? "Added" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}
