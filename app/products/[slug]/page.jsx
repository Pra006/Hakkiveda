import Link from "next/link";
import { notFound } from "next/navigation";
import StorefrontShell from "@/components/layout/StorefrontShell";
import { Section, SectionHeader } from "@/components/ui/Section";
import Rating from "@/components/ui/Rating";
import Price from "@/components/ui/Price";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import ProductCard from "@/components/storefront/ProductCard";
import ProductGallery from "@/components/product/ProductGallery";
import VariantAndCart from "@/components/product/VariantAndCart";
import ReviewList from "@/components/product/ReviewList";
import { getVendor } from "@/lib/data";
import { getStoreProduct, listStoreProducts, listStoreProductsByCategory } from "@/lib/catalog";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getStoreProduct(slug);
  return { title: p ? p.name : "Product" };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getStoreProduct(slug);
  if (!product) return notFound();
  const vendor = getVendor(product.vendor);
  const [categoryProducts, allProducts] = await Promise.all([
    product.category ? listStoreProductsByCategory(product.category) : Promise.resolve([]),
    listStoreProducts(),
  ]);
  const related = categoryProducts.filter((p) => p.id !== product.id);
  const froths = allProducts.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <StorefrontShell>
      <Section className="py-6">
        <nav className="text-xs text-on-surface-variant flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-forest-deep">Home</Link>
          <Icon name="chevron_right" size={14} />
          <Link href="/shop" className="hover:text-forest-deep">Shop</Link>
          <Icon name="chevron_right" size={14} />
          <Link href={`/categories/${product.category}`} className="hover:text-forest-deep capitalize">
            {product.category.replace(/-/g, " ")}
          </Link>
          <Icon name="chevron_right" size={14} />
          <span className="text-forest-deep font-semibold line-clamp-1">{product.name}</span>
        </nav>
      </Section>

      <Section className="pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <ProductGallery images={product.images} alt={product.name} />

          <div className="flex flex-col">
            {vendor && (
              <Link
                href={`/stores/${vendor.slug}`}
                className="inline-flex items-center gap-2 text-xs text-antique-gold font-semibold uppercase tracking-widest hover:underline w-fit"
              >
                <Icon name="verified" size={14} />
                {vendor.name} · {vendor.location}
              </Link>
            )}
            <h1 className="font-headline text-3xl sm:text-4xl text-forest-deep mt-3 leading-tight">
              {product.name}
            </h1>
            <p className="mt-2 text-on-surface-variant">{product.shortDescription}</p>

            <div className="mt-4 flex items-center gap-4">
              <Rating value={product.rating} count={product.reviewCount} />
            </div>

            <div className="mt-6">
              <Price price={product.price} compareAt={product.compareAt} size="lg" />
              <p className="text-xs text-on-surface-variant mt-1">Inclusive of all taxes</p>
            </div>

            <VariantAndCart product={product} />

            {/* Trust rows */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                ["local_shipping", "Free delivery above NPR 2,999"],
                ["undo", "7-day easy returns"],
                ["encrypted", "Secure checkout"],
                ["verified", "B2B Business-verified authentic"],
              ].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-2 text-forest-deep">
                  <Icon name={icon} size={18} className="text-antique-gold" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Vendor mini-card */}
            {vendor && (
              <div className="mt-8 flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/60">
                <img src={vendor.logo} alt="" className="w-14 h-14 rounded-full object-cover border border-antique-gold/40" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-forest-deep">{vendor.name}</span>
                    <Icon name="verified" size={14} className="text-antique-gold" />
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-1">{vendor.story}</p>
                </div>
                <Link
                  href={`/stores/${vendor.slug}`}
                  className="text-xs font-semibold text-forest-deep hover:text-antique-gold"
                >
                  Visit store →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Description / Specs / Reviews tabs (as stacked sections for simplicity) */}
        <div className="mt-16 grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="font-headline text-2xl text-forest-deep">Description</h2>
              <p className="mt-3 text-on-surface-variant leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            <div>
              <h2 className="font-headline text-2xl text-forest-deep">Specifications</h2>
              <dl className="mt-3 grid sm:grid-cols-2 gap-x-8">
                {[
                  ["Brand", product.brand],
                  ["Category", product.category.replace(/-/g, " ")],
                  ["B2B Business", vendor?.name],
                  ["Country of Origin", "Nepal"],
                  ["Storage", "Cool, dry place away from sunlight"],
                  ["Shelf Life", "24 months from date of manufacture"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-outline-variant/50 text-sm">
                    <dt className="text-on-surface-variant">{k}</dt>
                    <dd className="font-semibold text-forest-deep capitalize text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <ReviewList productId={product.id} />
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl border border-outline-variant/60 p-5 bg-surface-container-lowest">
              <h3 className="font-headline text-lg text-forest-deep">Frequently bought together</h3>
              <div className="mt-4 space-y-3">
                {froths.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="flex items-center gap-3 hover:bg-surface-container rounded-lg p-2"
                  >
                    <img src={p.images[0]} className="w-14 h-14 rounded object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-forest-deep line-clamp-1">{p.name}</div>
                      <Price price={p.price} compareAt={p.compareAt} size="sm" />
                    </div>
                  </Link>
                ))}
                <Button variant="secondary" className="w-full">Add all to cart</Button>
              </div>
            </div>
          </aside>
        </div>
      </Section>

      <Section className="pb-16">
        <SectionHeader eyebrow="Related" title="You may also like." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {(related.length ? related : allProducts).slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>
    </StorefrontShell>
  );
}
