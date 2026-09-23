/**
 * Hakkiveda — Customer Cart Helpers
 *
 * The customer cart lives in the DB (CustomerCart / CustomerCartItem) and is
 * owned by the signed-in user's Customer record.
 */

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateRefNumber } from "@/lib/ref-number";
import { effectivePrice, availableStock } from "@/lib/variants";

/**
 * Resolve the effective B2B minimum order quantity for a product/variant.
 * Variant-level overrides product-level; falls back to 1 if unset.
 */
export function b2bMinQty(product, variant) {
  return variant?.b2bMinOrderQty ?? product.b2bMinOrderQty ?? product.moq ?? 1;
}

const FREE_SHIPPING_THRESHOLD = 2999;
const SHIPPING_FLAT = 150;
const VAT_RATE = 0.13;

/**
 * Require a signed-in customer. Creates the Customer record on first use
 * (OAuth sign-ups don't get one at registration). Throws a Response on 401.
 */
export async function requireCustomer() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = session.user.id;
  let customer = await prisma.customer.findUnique({ where: { userId } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { userId, customerNumber: generateRefNumber("CUST") },
    });
  }
  customer._isB2B = !!session.user.isB2B;
  return customer;
}

/**
 * Get the customer's cart, creating it if absent.
 */
export async function getOrCreateCart(customerId) {
  const cart = await prisma.customerCart.findUnique({ where: { customerId } });
  if (cart) return cart;
  return prisma.customerCart.create({ data: { customerId } });
}

/**
 * Load cart items with their products, shaped for the client.
 */
export async function getCartPayload(cartId) {
  const items = await prisma.customerCartItem.findMany({
    where: { cartId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          retailPrice: true,
          compareAt: true,
          stock: true,
          brand: true,
          isActive: true,
          moq: true,
          b2bMinOrderQty: true,
        },
      },
      variant: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          compareAt: true,
          stock: true,
          images: true,
          isActive: true,
          b2bMinOrderQty: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const shaped = items.map((it) => {
    const unitPrice = effectivePrice(it.product, it.variant);
    return {
      id: it.id,
      productId: it.productId,
      variantId: it.variantId,
      quantity: it.quantity,
      unitPrice,
      lineTotal: unitPrice * it.quantity,
      // Stock and imagery follow the chosen option when there is one.
      availableStock: availableStock(it.product, it.variant),
      b2bMinOrderQty: b2bMinQty(it.product, it.variant),
      image: it.variant?.images?.[0] || it.product.images?.[0] || null,
      variant: it.variant,
      variantName: it.variant?.name || null,
      product: it.product,
    };
  });

  return { items: shaped, ...computeTotals(shaped) };
}

/**
 * Money math for the cart summary.
 */
export function computeTotals(items) {
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const tax = Math.round(subtotal * VAT_RATE);
  return { count, subtotal, shipping, tax, total: subtotal + shipping + tax };
}
