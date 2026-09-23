import Link from "next/link";
import { notFound } from "next/navigation";
import StorefrontShell from "@/components/layout/StorefrontShell";
import { Section } from "@/components/ui/Section";
import ProductCard from "@/components/storefront/ProductCard";
import Icon from "@/components/ui/Icon";
import { listStoreProductsByCategory } from "@/lib/catalog";
import prisma from "@/lib/prisma";

// Categories are admin-managed — always read from the DB.
export const dynamic = "force-dynamic";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = await prisma.category.findFirst({
    where: { slug, isActive: true },
    select: { name: true },
  });
  return { title: cat ? cat.name : "Category" };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;

  const cat = await prisma.category.findFirst({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true, description: true, image: true, _count: { select: { products: true } } },
  });

  if (!cat) return notFound();

  const products = await listStoreProductsByCategory(slug);

  return (
    <StorefrontShell>
      <section className="relative h-56 sm:h-64 overflow-hidden bg-forest-deep">
        <img
          src={cat.image || PLACEHOLDER_IMAGE}
          alt=""
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/40 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 pb-8">
            <nav className="text-xs text-earth-sand/80 flex items-center gap-1.5">
              <Link href="/" className="hover:text-antique-gold">Home</Link>
              <Icon name="chevron_right" size={14} />
              <Link href="/categories" className="hover:text-antique-gold">Collections</Link>
              <Icon name="chevron_right" size={14} />
              <span className="text-antique-gold font-semibold">{cat.name}</span>
            </nav>
            <h1 className="font-headline text-3xl sm:text-5xl text-ivory-canvas mt-2">{cat.name}</h1>
            {cat.description && (
              <p className="text-earth-sand/80 mt-1 max-w-lg">{cat.description}</p>
            )}
            <p className="text-earth-sand/60 mt-1 text-sm">{products.length} products</p>
          </div>
        </div>
      </section>
      <Section className="py-10">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="text-center text-on-surface-variant py-12">
            No products in this collection yet. Check back soon!
          </p>
        )}
      </Section>
    </StorefrontShell>
  );
}
