import prisma from "@/lib/prisma";
import { jsonResponse, errorResponse } from "@/lib/b2b";
import { requireCustomer } from "@/lib/cart";

async function getOrCreateWishlist(customerId) {
  let wishlist = await prisma.customerWishlist.findUnique({
    where: { customerId },
  });
  if (!wishlist) {
    wishlist = await prisma.customerWishlist.create({
      data: { customerId },
    });
  }
  return wishlist;
}

export async function GET() {
  try {
    const customer = await requireCustomer();
    const wishlist = await getOrCreateWishlist(customer.id);

    const items = await prisma.customerWishlistItem.findMany({
      where: { wishlistId: wishlist.id },
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
            stock: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    return jsonResponse({ items });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[WISHLIST_GET_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request) {
  try {
    const customer = await requireCustomer();
    const { productId } = await request.json();

    if (!productId) return errorResponse("Product ID is required", 400);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return errorResponse("Product not found", 404);

    const wishlist = await getOrCreateWishlist(customer.id);

    const existing = await prisma.customerWishlistItem.findUnique({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    });

    if (existing) return jsonResponse({ item: existing, message: "Already in wishlist" });

    const item = await prisma.customerWishlistItem.create({
      data: { wishlistId: wishlist.id, productId },
    });

    return jsonResponse({ item }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[WISHLIST_ADD_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request) {
  try {
    const customer = await requireCustomer();
    const { productId } = await request.json();

    if (!productId) return errorResponse("Product ID is required", 400);

    const wishlist = await prisma.customerWishlist.findUnique({
      where: { customerId: customer.id },
    });

    if (!wishlist) return jsonResponse({ success: true });

    await prisma.customerWishlistItem.deleteMany({
      where: { wishlistId: wishlist.id, productId },
    });

    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[WISHLIST_REMOVE_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}
