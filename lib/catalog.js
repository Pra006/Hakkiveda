/**
 * Hakkiveda — Storefront catalog (server-side).
 *
 * Products are read from the database so anything the admin creates or edits
 * shows up in the store. Presentation-only extras the Product model doesn't
 * carry (vendor, ratings, editorial copy, size variants) are merged in from the
 * demo catalog in lib/data.js when a matching slug exists, so the existing
 * storefront components keep working unchanged.
 */

import prisma from "@/lib/prisma";
import { products as demoProducts } from "@/lib/data";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80";

const demoBySlug = new Map(demoProducts.map((p) => [p.slug, p]));

/**
 * Map a Prisma Product onto the shape the storefront components expect.
 */
function toStoreProduct(product, reviewStats) {
  const demo = demoBySlug.get(product.slug);
  const images = product.images?.length ? product.images : [demo?.images?.[0] || PLACEHOLDER_IMAGE];

  // Real purchasable options. A product without any is sold on its own price
  // and stock, which the storefront represents as a single implicit option.
  const activeVariants = (product.variants || []).filter((v) => v.isActive);
  const hasVariants = activeVariants.length > 0;
  const variants = hasVariants
    ? activeVariants.map((v) => ({
        id: v.id,
        size: v.name,
        price: v.price,
        compareAt: v.compareAt,
        stock: v.stock,
        sku: v.sku,
        images: v.images,
        b2bMinOrderQty: v.b2bMinOrderQty ?? null,
      }))
    : [{ id: null, size: "Standard", price: product.retailPrice, compareAt: product.compareAt, stock: product.stock }];

  // Listing price is the cheapest available option.
  const displayPrice = hasVariants
    ? Math.min(...activeVariants.map((v) => v.price))
    : product.retailPrice;
  const displayCompareAt = hasVariants
    ? activeVariants.find((v) => v.price === displayPrice)?.compareAt ?? null
    : product.compareAt;
  const totalStock = hasVariants
    ? activeVariants.reduce((s, v) => s + v.stock, 0)
    : product.stock;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    description: product.description || demo?.description || "",
    shortDescription:
      demo?.shortDescription ||
      (product.description ? `${product.description.slice(0, 140)}${product.description.length > 140 ? "…" : ""}` : ""),
    price: displayPrice,
    compareAt: displayCompareAt,
    stock: totalStock,
    hasVariants,
    moq: product.moq,
    b2bMinOrderQty: product.b2bMinOrderQty ?? null,
    isB2B: product.isB2B ?? false,
    brand: product.brand || demo?.brand || "",
    category: product.category?.slug || demo?.category || "",
    categoryName: product.category?.name || "",
    images,
    variants,

    // Presentation-only fields with safe defaults for admin-created products.
    vendor: demo?.vendor || "",
    // Admin override takes precedence when enabled
    rating: product.isAdminRatingEnabled && product.adminRating != null
      ? product.adminRating
      : (reviewStats?.avgRating ?? 0),
    reviewCount: product.isAdminRatingEnabled && product.adminReviewCount != null
      ? product.adminReviewCount
      : (reviewStats?.count ?? 0),
    isAdminRatingEnabled: product.isAdminRatingEnabled ?? false,
    tags: demo?.tags || [],
    featured: product.isFeatured ?? demo?.featured ?? false,
    trending: demo?.trending ?? false,
  };
}

/**
 * Compute average rating and count from an array of approved review ratings.
 */
function computeReviewStats(reviews) {
  if (!reviews || reviews.length === 0) return { avgRating: 0, count: 0 };
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return {
    avgRating: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

const activeWhere = { isActive: true };

/**
 * All products visible in the store.
 */
export async function listStoreProducts() {
  const products = await prisma.product.findMany({
    where: activeWhere,
    include: {
      category: { select: { slug: true, name: true } },
      variants: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      reviews: { where: { status: "APPROVED" }, select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => toStoreProduct(p, computeReviewStats(p.reviews)));
}

/**
 * One product by slug, or null when missing/inactive.
 */
export async function getStoreProduct(slug) {
  const product = await prisma.product.findFirst({
    where: { slug, ...activeWhere },
    include: {
      category: { select: { slug: true, name: true } },
      variants: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      reviews: { where: { status: "APPROVED" }, select: { rating: true } },
    },
  });
  return product ? toStoreProduct(product, computeReviewStats(product.reviews)) : null;
}

/**
 * Active products in a category slug.
 */
export async function listStoreProductsByCategory(categorySlug) {
  const products = await prisma.product.findMany({
    where: { ...activeWhere, category: { slug: categorySlug } },
    include: {
      category: { select: { slug: true, name: true } },
      variants: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      reviews: { where: { status: "APPROVED" }, select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => toStoreProduct(p, computeReviewStats(p.reviews)));
}

/**
 * Active categories shaped for the storefront.
 * Returns all active categories (both parents and children) with product counts,
 * ordered by sortOrder then name.
 */
export async function listStoreCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      parent: { select: { slug: true, name: true } },
      _count: { select: { products: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    image: c.image || PLACEHOLDER_IMAGE,
    productCount: c._count.products,
    parentSlug: c.parent?.slug || null,
    parentName: c.parent?.name || null,
  }));
}

/**
 * Featured products for the homepage — fetched from the database.
 * Only active + featured products, ordered by featuredOrder (nulls last), then name.
 */
export async function listFeaturedProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      category: { select: { slug: true, name: true } },
      variants: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      reviews: { where: { status: "APPROVED" }, select: { rating: true } },
    },
    orderBy: [
      { featuredOrder: { sort: "asc", nulls: "last" } },
      { name: "asc" },
    ],
  });
  return products.map((p) => toStoreProduct(p, computeReviewStats(p.reviews)));
}

/**
 * New-arrival products for the homepage — toggled by the admin in the product form.
 * Only active + isNewArrival products, newest first, capped at 6.
 */
export async function listNewArrivalProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true, isNewArrival: true },
    include: {
      category: { select: { slug: true, name: true } },
      variants: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      reviews: { where: { status: "APPROVED" }, select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  return products.map((p) => toStoreProduct(p, computeReviewStats(p.reviews)));
}

/**
 * Active sale promotion for the homepage — fetched from the database.
 * Returns the current in-window promotion with its products shaped for the storefront,
 * or null when nothing qualifies.
 */
export async function getActivePromotion() {
  const now = new Date();

  const promo = await prisma.salePromotion.findFirst({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gt: now },
    },
    include: {
      products: {
        include: {
          product: {
            include: {
              category: { select: { slug: true, name: true } },
              variants: {
                where: { isActive: true },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              },
              reviews: {
                where: { status: "APPROVED" },
                select: { rating: true },
              },
            },
          },
        },
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy: { startDate: "desc" },
  });

  if (!promo) return null;

  const activeProducts = promo.products
    .filter((pp) => pp.product.isActive)
    .map((pp) => toStoreProduct(pp.product, computeReviewStats(pp.product.reviews)));

  if (activeProducts.length === 0) return null;

  return {
    id: promo.id,
    title: promo.title,
    subtitle: promo.subtitle,
    bannerImage: promo.bannerImage,
    endDate: promo.endDate.toISOString(),
    startDate: promo.startDate.toISOString(),
    products: activeProducts,
  };
}
