"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ProductCard from "@/components/storefront/ProductCard";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { discountPercent } from "@/lib/utils";

const PER_PAGE = 6;

const SORTS = {
  newest: { label: "Newest", fn: (a, b) => 0 },
  price_asc: { label: "Price: Low to High", fn: (a, b) => a.price - b.price },
  price_desc: { label: "Price: High to Low", fn: (a, b) => b.price - a.price },
  best_rated: { label: "Best Rated", fn: (a, b) => b.rating - a.rating },
  most_popular: { label: "Most Popular", fn: (a, b) => b.reviewCount - a.reviewCount },
  biggest_discount: {
    label: "Biggest Discount",
    fn: (a, b) =>
      discountPercent(b.compareAt, b.price) - discountPercent(a.compareAt, a.price),
  },
};

function FilterGroup({ title, children, defaultOpen = true }) {
  return (
    <details open={defaultOpen} className="border-b border-outline-variant/70 py-4 group">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <span className="font-semibold text-sm text-forest-deep uppercase tracking-widest">{title}</span>
        <Icon name="expand_more" size={20} className="group-open:rotate-180 transition" />
      </summary>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </details>
  );
}

function CheckRow({ label, count, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-on-surface-variant hover:text-forest-deep cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-outline text-forest-base focus:ring-antique-gold"
      />
      <span className="flex-1">{label}</span>
      {count != null && <span className="text-xs text-outline">({count})</span>}
    </label>
  );
}

export default function ShopBrowser({ products, categories }) {
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("grid");

  const toggle = (set, value) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    return next;
  };

  const reset = () => {
    setQuery("");
    setSelectedCategories(new Set());
    setPriceMin("");
    setPriceMax("");
    setMinRating(0);
    setInStock(false);
    setOnSale(false);
    setSort("newest");
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = priceMin === "" ? -Infinity : Number(priceMin);
    const max = priceMax === "" ? Infinity : Number(priceMax);

    let list = products.filter((p) => {
      if (selectedCategories.size && !selectedCategories.has(p.category)) return false;
      if (p.price < min || p.price > max) return false;
      if (p.rating < minRating) return false;
      if (inStock && (p.stock ?? 0) <= 0) return false;
      if (onSale && !(p.compareAt && p.compareAt > p.price)) return false;
      if (q) {
        const hay = (
          p.name +
          " " +
          p.shortDescription +
          " " +
          p.brand +
          " " +
          (p.tags?.join(" ") || "")
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (SORTS[sort]) list = [...list].sort(SORTS[sort].fn);
    return list;
  }, [
    products,
    query,
    selectedCategories,
    priceMin,
    priceMax,
    minRating,
    inStock,
    onSale,
    sort,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // Active filter chips
  const chips = [];
  selectedCategories.forEach((slug) => {
    const c = categories.find((x) => x.slug === slug);
    if (c)
      chips.push({
        key: `cat-${slug}`,
        label: c.name,
        remove: () => setSelectedCategories((s) => toggle(s, slug)),
      });
  });
  if (priceMin !== "" || priceMax !== "")
    chips.push({
      key: "price",
      label: `NPR ${priceMin || 0} — ${priceMax || "∞"}`,
      remove: () => {
        setPriceMin("");
        setPriceMax("");
      },
    });
  if (minRating > 0)
    chips.push({
      key: "rating",
      label: `${minRating}★ & up`,
      remove: () => setMinRating(0),
    });
  if (inStock) chips.push({ key: "stock", label: "In stock", remove: () => setInStock(false) });
  if (onSale) chips.push({ key: "sale", label: "On sale", remove: () => setOnSale(false) });
  if (query) chips.push({ key: "q", label: `"${query}"`, remove: () => setQuery("") });

  // reset page whenever a filter changes
  const onFilterChange = (fn) => (arg) => {
    fn(arg);
    setPage(1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
      {/* FILTERS */}
      <aside className="lg:sticky lg:top-24 self-start bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 h-fit">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-headline text-lg text-forest-deep">Filters</h2>
          <button onClick={reset} className="text-xs text-antique-gold font-semibold hover:underline">
            Reset
          </button>
        </div>

        <div className="mt-2 mb-2">
          <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded px-3 py-2">
            <Icon name="search" size={16} className="text-forest-base" />
            <input
              value={query}
              onChange={(e) => onFilterChange(setQuery)(e.target.value)}
              placeholder="Search products…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-on-surface-variant"
            />
          </div>
        </div>

        <FilterGroup title="Category">
          {categories.map((c) => (
            <CheckRow
              key={c.slug}
              label={c.name}
              count={products.filter((p) => p.category === c.slug).length}
              checked={selectedCategories.has(c.slug)}
              onChange={() => onFilterChange(setSelectedCategories)(toggle(selectedCategories, c.slug))}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Price (NPR)">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={priceMin}
              onChange={(e) => onFilterChange(setPriceMin)(e.target.value)}
              placeholder="Min"
              className="w-full text-sm border border-outline-variant rounded px-2 py-1.5"
            />
            <span className="text-on-surface-variant">—</span>
            <input
              type="number"
              value={priceMax}
              onChange={(e) => onFilterChange(setPriceMax)(e.target.value)}
              placeholder="Max"
              className="w-full text-sm border border-outline-variant rounded px-2 py-1.5"
            />
          </div>
        </FilterGroup>

        <FilterGroup title="Rating" defaultOpen={false}>
          {[5, 4, 3, 2].map((r) => (
            <label
              key={r}
              className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-forest-deep cursor-pointer"
            >
              <input
                type="radio"
                name="rating"
                checked={minRating === r}
                onChange={() => onFilterChange(setMinRating)(r)}
                className="text-forest-base"
              />
              <span className="flex-1">{r} stars &amp; up</span>
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-forest-deep cursor-pointer">
            <input
              type="radio"
              name="rating"
              checked={minRating === 0}
              onChange={() => onFilterChange(setMinRating)(0)}
              className="text-forest-base"
            />
            <span>Any rating</span>
          </label>
        </FilterGroup>

        <FilterGroup title="Availability" defaultOpen={false}>
          <CheckRow
            label="In stock only"
            checked={inStock}
            onChange={() => onFilterChange(setInStock)(!inStock)}
          />
          <CheckRow
            label="On sale"
            checked={onSale}
            onChange={() => onFilterChange(setOnSale)(!onSale)}
          />
        </FilterGroup>
      </aside>

      {/* MAIN */}
      <div>
        {/* Sort + View bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <p className="text-sm text-on-surface-variant">
            Showing <span className="font-semibold text-forest-deep">{pageItems.length}</span> of{" "}
            <span className="font-semibold text-forest-deep">{filtered.length}</span> products
            {filtered.length !== products.length && (
              <span className="text-outline"> · {products.length} total</span>
            )}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-on-surface-variant hidden sm:inline">Sort by</span>
              <select
                value={sort}
                onChange={(e) => onFilterChange(setSort)(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-sm"
              >
                {Object.entries(SORTS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden sm:flex items-center gap-1 border border-outline-variant rounded overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={`p-2 ${view === "grid" ? "bg-forest-base text-antique-gold" : "text-forest-deep"}`}
                aria-label="Grid view"
              >
                <Icon name="grid_view" size={16} />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-2 ${view === "list" ? "bg-forest-base text-antique-gold" : "text-forest-deep"}`}
                aria-label="List view"
              >
                <Icon name="view_list" size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Active chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {chips.map((c) => (
              <span
                key={c.key}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-outline-variant text-xs text-forest-deep bg-surface-container-lowest"
              >
                {c.label}
                <button aria-label={`Remove ${c.label}`} onClick={c.remove} className="hover:text-terracotta">
                  <Icon name="close" size={12} />
                </button>
              </span>
            ))}
            <button
              onClick={reset}
              className="text-xs text-antique-gold font-semibold hover:underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Grid / list / empty */}
        {pageItems.length === 0 ? (
          <EmptyState
            icon="search_off"
            title="No products match your filters"
            description="Try adjusting your filters, clearing the search, or resetting all filters."
            action={<Button onClick={reset}>Reset Filters</Button>}
          />
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {pageItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <ul className="space-y-4">
            {pageItems.map((p) => {
              const vendor = vendors.find((v) => v.slug === p.vendor);
              return (
                <li
                  key={p.id}
                  className="flex gap-4 bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 hover:border-antique-gold/40 hover:shadow-sm transition"
                >
                  <Link href={`/products/${p.slug}`} className="shrink-0">
                    <img
                      src={p.images[0]}
                      alt=""
                      className="w-32 h-32 sm:w-40 sm:h-40 rounded-lg object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    {vendor && (
                      <Link
                        href={`/stores/${vendor.slug}`}
                        className="inline-flex items-center gap-1 text-[11px] text-antique-gold font-semibold uppercase tracking-widest hover:underline"
                      >
                        <Icon name="verified" size={12} /> {vendor.name}
                      </Link>
                    )}
                    <Link href={`/products/${p.slug}`}>
                      <h3 className="font-headline text-lg text-forest-deep leading-tight hover:text-forest-base line-clamp-2">
                        {p.name}
                      </h3>
                    </Link>
                    <p className="mt-1 text-sm text-on-surface-variant line-clamp-2">
                      {p.shortDescription}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-headline text-lg text-forest-deep font-bold">
                          NPR {p.price.toLocaleString("en-IN")}
                        </span>
                        {p.compareAt && p.compareAt > p.price && (
                          <span className="text-sm text-on-surface-variant line-through">
                            NPR {p.compareAt.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      <Button as={Link} href={`/products/${p.slug}`} size="sm">
                        View <Icon name="arrow_forward" size={14} />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded border border-outline-variant text-sm text-on-surface-variant disabled:opacity-40"
              aria-label="Previous page"
            >
              <Icon name="chevron_left" size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`min-w-9 h-9 rounded text-sm font-semibold ${
                  n === currentPage
                    ? "bg-forest-base text-ivory-canvas"
                    : "border border-outline-variant text-forest-deep hover:bg-forest-base/5"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded border border-outline-variant text-sm text-on-surface-variant disabled:opacity-40"
              aria-label="Next page"
            >
              <Icon name="chevron_right" size={16} />
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
