import { listFeaturedProducts } from "@/lib/catalog";

/**
 * GET /api/featured-products — public endpoint for the homepage
 * Returns active + featured products ordered by featuredOrder.
 */
export async function GET() {
  try {
    const products = await listFeaturedProducts();
    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[FEATURED_PRODUCTS_ERROR]", err);
    return new Response(JSON.stringify({ error: "Failed to load featured products" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
