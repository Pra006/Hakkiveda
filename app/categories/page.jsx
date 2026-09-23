import Link from "next/link";
import StorefrontShell from "@/components/layout/StorefrontShell";
import { Section, SectionHeader } from "@/components/ui/Section";
import CategoryCard from "@/components/storefront/CategoryCard";
import Icon from "@/components/ui/Icon";
import { listStoreCategories } from "@/lib/catalog";

export const metadata = { title: "Collections" };

// Categories are admin-managed, so reflect the database on every request.
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listStoreCategories();

  return (
    <StorefrontShell>
      <Section className="py-6">
        <nav className="text-xs text-on-surface-variant flex items-center gap-1.5">
          <Link href="/" className="hover:text-forest-deep">Home</Link>
          <Icon name="chevron_right" size={14} />
          <span className="text-forest-deep font-semibold">Collections</span>
        </nav>
      </Section>
      <Section className="pb-16">
        <SectionHeader
          eyebrow="Shop by Collection"
          title="Curated categories of Nepal's living crafts."
        />
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((c) => <CategoryCard key={c.slug} category={c} />)}
          </div>
        ) : (
          <p className="text-center text-on-surface-variant py-12">
            No collections available yet. Check back soon!
          </p>
        )}
      </Section>
    </StorefrontShell>
  );
}
