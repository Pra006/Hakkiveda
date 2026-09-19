import prisma from "@/lib/prisma";
import { requireCustomer } from "@/lib/cart";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function err(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET /api/reviews?productId=xxx — approved reviews for a product
 *
 * Returns { reviews, summary } where summary has avgRating, count, and
 * distribution (how many 1-star, 2-star, etc.).
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) return err("productId is required");

    // Fetch product's admin rating override settings
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        isAdminRatingEnabled: true,
        adminRating: true,
        adminReviewCount: true,
      },
    });

    const reviews = await prisma.productReview.findMany({
      where: { productId, status: "APPROVED" },
      include: {
        customer: {
          select: {
            user: {
              select: { firstName: true, lastName: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build summary from approved reviews only
    const count = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const computedAvgRating = count > 0 ? Math.round((totalRating / count) * 10) / 10 : 0;
    const distribution = [0, 0, 0, 0, 0]; // index 0 = 1-star, index 4 = 5-star
    reviews.forEach((r) => {
      distribution[r.rating - 1]++;
    });

    // Determine displayed rating: admin override takes precedence
    const isAdminOverride = product?.isAdminRatingEnabled === true;
    const displayedRating = isAdminOverride && product.adminRating != null
      ? product.adminRating
      : computedAvgRating;
    const displayedCount = isAdminOverride && product.adminReviewCount != null
      ? product.adminReviewCount
      : count;

    return json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        createdAt: r.createdAt,
        customer: {
          firstName: r.customer.user.firstName,
          lastName: r.customer.user.lastName,
          image: r.customer.user.image,
        },
      })),
      summary: {
        avgRating: displayedRating,
        count: displayedCount,
        distribution, // [1-star count, 2-star count, …, 5-star count]
        source: isAdminOverride ? "admin" : "auto",
      },
    });
  } catch (e) {
    console.error("[REVIEWS_GET_ERROR]", e);
    return err("Internal server error", 500);
  }
}

/**
 * POST /api/reviews — submit a review (requires login)
 * Body: { productId, rating, title?, body? }
 */
export async function POST(request) {
  try {
    const customer = await requireCustomer();
    const data = await request.json();
    const { productId, rating, title, body } = data;

    if (!productId) return err("productId is required");
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return err("rating must be an integer between 1 and 5");
    }

    // Verify the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true },
    });
    if (!product || !product.isActive) return err("Product not found", 404);

    // Check for existing review (unique constraint also prevents duplicates)
    const existing = await prisma.productReview.findUnique({
      where: { productId_customerId: { productId, customerId: customer.id } },
    });
    if (existing) {
      return err("You have already reviewed this product. You can update your existing review.", 409);
    }

    const review = await prisma.productReview.create({
      data: {
        productId,
        customerId: customer.id,
        rating,
        title: title?.trim() || null,
        body: body?.trim() || null,
        status: "PENDING",
      },
    });

    return json(
      { message: "Review submitted! It will appear after approval.", review: { id: review.id } },
      201
    );
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("[REVIEWS_POST_ERROR]", e);
    return err("Internal server error", 500);
  }
}
