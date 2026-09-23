import prisma from "@/lib/prisma";

/**
 * GET /api/promotions/active — public endpoint
 *
 * Returns the currently active, in-window sale promotion with its 3 products,
 * or null when nothing qualifies.
 */
export async function GET() {
  try {
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
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                retailPrice: true,
                compareAt: true,
                isActive: true,
                brand: true,
                description: true,
                stock: true,
                category: { select: { slug: true, name: true } },
                variants: {
                  where: { isActive: true },
                  orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                  select: { id: true, name: true, price: true, compareAt: true, stock: true },
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

    if (!promo) {
      return new Response(JSON.stringify(null), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Filter to only active products and shape for storefront
    const activeProducts = promo.products
      .filter((pp) => pp.product.isActive)
      .map((pp) => {
        const p = pp.product;
        const activeVariants = p.variants || [];
        const hasVariants = activeVariants.length > 0;
        const displayPrice = hasVariants
          ? Math.min(...activeVariants.map((v) => v.price))
          : p.retailPrice;
        const displayCompareAt = hasVariants
          ? activeVariants.find((v) => v.price === displayPrice)?.compareAt ?? null
          : p.compareAt;
        const totalStock = hasVariants
          ? activeVariants.reduce((s, v) => s + v.stock, 0)
          : p.stock;
        const reviews = p.reviews || [];
        const avgRating = reviews.length
          ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
          : 0;

        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          brand: p.brand || "",
          description: p.description || "",
          shortDescription: p.description ? p.description.slice(0, 140) + (p.description.length > 140 ? "…" : "") : "",
          price: displayPrice,
          compareAt: displayCompareAt,
          stock: totalStock,
          images: p.images?.length ? p.images : [],
          category: p.category?.slug || "",
          categoryName: p.category?.name || "",
          rating: avgRating,
          reviewCount: reviews.length,
          hasVariants,
          variants: activeVariants.map((v) => ({
            id: v.id,
            size: v.name,
            price: v.price,
            compareAt: v.compareAt,
            stock: v.stock,
          })),
          vendor: "",
          tags: [],
          featured: false,
          trending: false,
        };
      });

    if (activeProducts.length === 0) {
      return new Response(JSON.stringify(null), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        id: promo.id,
        title: promo.title,
        subtitle: promo.subtitle,
        bannerImage: promo.bannerImage,
        endDate: promo.endDate.toISOString(),
        startDate: promo.startDate.toISOString(),
        products: activeProducts,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[ACTIVE_PROMOTION_ERROR]", err);
    return new Response(JSON.stringify({ error: "Failed to load promotion" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
