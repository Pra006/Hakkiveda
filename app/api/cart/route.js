import prisma from "@/lib/prisma";
import { jsonResponse, errorResponse } from "@/lib/b2b";
import { requireCustomer, getOrCreateCart, getCartPayload, b2bMinQty } from "@/lib/cart";
import { resolveVariant, availableStock } from "@/lib/variants";

const MAX_QTY = 99;

/**
 * GET /api/cart — the signed-in customer's cart
 */
export async function GET() {
  try {
    const customer = await requireCustomer();
    const cart = await getOrCreateCart(customer.id);
    return jsonResponse(await getCartPayload(cart.id));
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/cart — add a product to the cart
 * Body: { productId } or { slug }, optional quantity (default 1)
 */
export async function POST(req) {
  try {
    const customer = await requireCustomer();
    const body = await req.json();
    const quantity = Math.max(1, parseInt(body.quantity ?? 1, 10) || 1);

    const product = await prisma.product.findFirst({
      where: body.productId
        ? { id: body.productId, isActive: true }
        : { slug: body.slug, isActive: true },
      include: { variants: { select: { id: true, b2bMinOrderQty: true } } },
    });
    if (!product) return errorResponse("Product not found", 404);

    const { variant, error, status } = await resolveVariant(product, body.variantId);
    if (error) return errorResponse(error, status);

    const stock = availableStock(product, variant);
    if (stock <= 0) {
      return errorResponse(
        variant ? `${variant.name} is out of stock` : "Product is out of stock",
        409
      );
    }

    const cart = await getOrCreateCart(customer.id);
    // NULL variantId rows are not deduplicated by the unique index, so match here.
    const existing = await prisma.customerCartItem.findFirst({
      where: { cartId: cart.id, productId: product.id, variantId: variant?.id ?? null },
    });

    const nextQty = Math.min((existing?.quantity ?? 0) + quantity, stock, MAX_QTY);

    // B2B minimum order quantity enforcement — checked against the final cart qty
    if (customer._isB2B) {
      const variantWithB2b = product.variants?.find((v) => v.id === variant?.id);
      const minQty = b2bMinQty(product, variantWithB2b);
      if (nextQty < minQty) {
        return errorResponse(
          `B2B customers must purchase at least ${minQty} units of this product.`,
          400
        );
      }
    }

    if (existing) {
      await prisma.customerCartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQty },
      });
    } else {
      await prisma.customerCartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          variantId: variant?.id ?? null,
          quantity: nextQty,
        },
      });
    }

    return jsonResponse(await getCartPayload(cart.id), 201);
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}

/**
 * PATCH /api/cart — set the quantity of a cart item
 * Body: { itemId, quantity }
 */
export async function PATCH(req) {
  try {
    const customer = await requireCustomer();
    const { itemId, quantity } = await req.json();
    const cart = await getOrCreateCart(customer.id);

    const item = await prisma.customerCartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: {
        product: { select: { stock: true, b2bMinOrderQty: true, moq: true } },
        variant: { select: { stock: true, b2bMinOrderQty: true } },
      },
    });
    if (!item) return errorResponse("Cart item not found", 404);

    const qty = parseInt(quantity, 10);
    if (!Number.isFinite(qty) || qty < 0) return errorResponse("Invalid quantity", 400);

    if (qty === 0) {
      await prisma.customerCartItem.delete({ where: { id: item.id } });
    } else {
      if (customer._isB2B) {
        const minQty = b2bMinQty(item.product, item.variant);
        if (qty < minQty) {
          return errorResponse(
            `B2B customers must purchase at least ${minQty} units of this product.`,
            400
          );
        }
      }
      await prisma.customerCartItem.update({
        where: { id: item.id },
        data: { quantity: Math.min(qty, availableStock(item.product, item.variant), MAX_QTY) },
      });
    }

    return jsonResponse(await getCartPayload(cart.id));
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}

/**
 * DELETE /api/cart?itemId=… — remove one item
 * DELETE /api/cart              — empty the cart
 */
export async function DELETE(req) {
  try {
    const customer = await requireCustomer();
    const cart = await getOrCreateCart(customer.id);
    const itemId = new URL(req.url).searchParams.get("itemId");

    if (itemId) {
      const { count } = await prisma.customerCartItem.deleteMany({
        where: { id: itemId, cartId: cart.id },
      });
      if (count === 0) return errorResponse("Cart item not found", 404);
    } else {
      await prisma.customerCartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return jsonResponse(await getCartPayload(cart.id));
  } catch (err) {
    if (err instanceof Response) return err;
    return errorResponse("Internal server error", 500);
  }
}
