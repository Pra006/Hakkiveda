import prisma from "@/lib/prisma";
import { jsonResponse, errorResponse } from "@/lib/b2b";
import { requireCustomer, getOrCreateCart, computeTotals } from "@/lib/cart";
import { generateNumber } from "@/lib/ref-number";
import { effectivePrice, availableStock, syncProductStock } from "@/lib/variants";

const PAYMENT_METHODS = ["ESEWA", "KHALTI", "BANK_TRANSFER", "COD", "CARD"];

/**
 * GET /api/orders — the signed-in customer's own orders
 */
export async function GET() {
  try {
    const customer = await requireCustomer();
    const orders = await prisma.customerOrder.findMany({
      where: { customerId: customer.id },
      include: {
        items: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
    return jsonResponse({ orders });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[ORDERS_LIST_ERROR]", err);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * POST /api/orders — place an order from the customer's cart.
 *
 * Body: { paymentMethod, notes?, addressId? } or inline shipping fields
 * { fullName, phone, street, city, province, postalCode, country, saveAddress? }
 */
export async function POST(req) {
  try {
    const customer = await requireCustomer();
    const body = await req.json();

    const paymentMethod = String(body.paymentMethod || "COD").toUpperCase();
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return errorResponse("Unsupported payment method", 400);
    }

    // ── Resolve the shipping destination ──
    let address = null;
    if (body.addressId) {
      address = await prisma.customerAddress.findFirst({
        where: { id: body.addressId, customerId: customer.id },
      });
      if (!address) return errorResponse("Shipping address not found", 404);
    }

    const shipping = address
      ? {
          fullName: address.fullName,
          phone: address.phone,
          street: address.streetAddress,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          country: "Nepal",
        }
      : {
          fullName: body.fullName?.trim(),
          phone: body.phone?.trim(),
          street: body.street?.trim(),
          city: body.city?.trim(),
          province: body.province?.trim(),
          postalCode: body.postalCode?.trim() || null,
          country: body.country?.trim() || "Nepal",
        };

    const missing = ["fullName", "phone", "street", "city", "province"].filter((f) => !shipping[f]);
    if (missing.length) {
      return errorResponse(`Missing shipping details: ${missing.join(", ")}`, 400);
    }

    // ── Load the cart ──
    const cart = await getOrCreateCart(customer.id);
    const cartItems = await prisma.customerCartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true, variant: true },
    });

    if (cartItems.length === 0) return errorResponse("Your cart is empty", 400);

    const label = (i) => (i.variant ? `${i.product.name} (${i.variant.name})` : i.product.name);

    const inactive = cartItems.filter((i) => !i.product.isActive || (i.variant && !i.variant.isActive));
    if (inactive.length) {
      return errorResponse(`No longer available: ${inactive.map(label).join(", ")}`, 409);
    }

    const short = cartItems.filter((i) => availableStock(i.product, i.variant) < i.quantity);
    if (short.length) {
      return errorResponse(
        `Not enough stock for ${short
          .map((i) => `${label(i)} (${availableStock(i.product, i.variant)} left)`)
          .join(", ")}`,
        409
      );
    }

    // ── Money ──
    const priced = cartItems.map((i) => {
      const unitPrice = effectivePrice(i.product, i.variant);
      return {
        quantity: i.quantity,
        unitPrice,
        lineTotal: unitPrice * i.quantity,
        product: i.product,
        variant: i.variant,
      };
    });
    const { subtotal, shipping: shippingCost, tax, total } = computeTotals(priced);

    // ── Create everything atomically ──
    const order = await prisma.$transaction(async (tx) => {
      // Conditional decrement guards against two orders racing for the last unit.
      // Stock is held on the variant when there is one, otherwise on the product.
      const touchedProducts = new Set();
      for (const item of priced) {
        if (item.variant) {
          const { count } = await tx.productVariant.updateMany({
            where: { id: item.variant.id, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (count === 0) {
            throw new Error(`STOCK_CONFLICT:${item.product.name} (${item.variant.name})`);
          }
          touchedProducts.add(item.product.id);
        } else {
          const { count } = await tx.product.updateMany({
            where: { id: item.product.id, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (count === 0) {
            throw new Error(`STOCK_CONFLICT:${item.product.name}`);
          }
        }
      }
      // Keep the denormalised product total in step with its variants.
      for (const productId of touchedProducts) {
        await syncProductStock(tx, productId);
      }

      const created = await tx.customerOrder.create({
        data: {
          orderNumber: generateNumber("ORD"),
          customerId: customer.id,
          shippingAddressId: address?.id || null,
          billingAddressId: address?.id || null,
          status: "PENDING",
          paymentStatus: "PENDING",
          fulfillmentStatus: "UNFULFILLED",
          subtotal,
          discount: 0,
          tax,
          shippingCost,
          total,
          currency: "NPR",
          notes: body.notes?.trim() || null,

          shippingFullName: shipping.fullName,
          shippingPhone: shipping.phone,
          shippingStreet: shipping.street,
          shippingCity: shipping.city,
          shippingState: shipping.province,
          shippingPostalCode: shipping.postalCode,
          shippingCountry: shipping.country,

          items: {
            create: priced.map((i) => ({
              productId: i.product.id,
              variantId: i.variant?.id ?? null,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: 0,
              tax: 0,
              total: i.lineTotal,
              // Snapshot so the order stays accurate if the product or option
              // is later edited, deactivated or deleted.
              productName: i.product.name,
              productSku: i.variant?.sku || i.product.sku,
              productImage: i.variant?.images?.[0] || i.product.images?.[0] || null,
              variantName: i.variant?.name ?? null,
              variantSku: i.variant?.sku ?? null,
            })),
          },

          payments: {
            create: {
              customerId: customer.id,
              amount: total,
              currency: "NPR",
              method: paymentMethod,
              status: "PENDING",
              provider: paymentMethod === "ESEWA" ? "ESEWA" : "MANUAL",
            },
          },

          events: {
            create: {
              status: "PENDING",
              message: "Order placed by customer",
              actor: "CUSTOMER",
              actorId: customer.id,
            },
          },
        },
        include: { items: true, payments: true },
      });

      // For eSewa the customer hasn't paid yet — keep the cart so they can
      // retry from the same items if the gateway drops them mid-flow. The
      // success callback clears the cart once the payment is confirmed.
      if (paymentMethod !== "ESEWA") {
        await tx.customerCartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return created;
    });

    return jsonResponse({ order }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    if (err.message?.startsWith("STOCK_CONFLICT:")) {
      return errorResponse(`${err.message.split(":")[1]} just went out of stock`, 409);
    }
    console.error("[ORDER_CREATE_ERROR]", err);
    return errorResponse("Could not place your order", 500);
  }
}
