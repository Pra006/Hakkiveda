/**
 * Hakkiveda — Product variant helpers.
 *
 * A product either has variants or it doesn't:
 *   - with variants:    price and stock live on the chosen ProductVariant
 *   - without variants: price and stock live on the Product
 *
 * Product.stock is kept as the denormalised sum of variant stock so existing
 * catalog filters, sorts and low-stock reports keep working unchanged.
 */

import prisma from "@/lib/prisma";

/** Price actually charged for a cart/order line. */
export function effectivePrice(product, variant) {
  return variant ? variant.price : product.retailPrice;
}

/** Units available for a cart/order line. */
export function availableStock(product, variant) {
  return variant ? variant.stock : product.stock;
}

/** Compare-at (pre-discount) price for a line, falling back to the product's. */
export function effectiveCompareAt(product, variant) {
  if (variant) return variant.compareAt ?? null;
  return product.compareAt ?? null;
}

/**
 * Recompute Product.stock from its variants. No-op for products without any,
 * whose own stock column stays authoritative.
 *
 * @param {object} tx  a Prisma client or transaction client
 */
export async function syncProductStock(tx, productId) {
  const count = await tx.productVariant.count({ where: { productId } });
  if (count === 0) return;

  const agg = await tx.productVariant.aggregate({
    where: { productId },
    _sum: { stock: true },
  });
  await tx.product.update({
    where: { id: productId },
    data: { stock: agg._sum.stock ?? 0 },
  });
}

/**
 * Resolve and validate the variant for a product line.
 *
 * Returns { variant } on success or { error, status } when the selection is
 * invalid — a product with variants requires one, a product without must not
 * receive one, and the variant must belong to the product and be purchasable.
 */
export async function resolveVariant(product, variantId, { client = prisma } = {}) {
  const variantCount = await client.productVariant.count({
    where: { productId: product.id, isActive: true },
  });

  if (variantCount === 0) {
    if (variantId) return { error: "This product has no options to choose from", status: 400 };
    return { variant: null };
  }

  if (!variantId) return { error: "Please choose an option before adding this product", status: 400 };

  const variant = await client.productVariant.findFirst({
    where: { id: variantId, productId: product.id },
  });
  if (!variant) return { error: "Selected option not found for this product", status: 404 };
  if (!variant.isActive) return { error: `${variant.name} is no longer available`, status: 409 };

  return { variant };
}

const MAX_NAME = 80;

/**
 * Validate an admin variant payload.
 * @returns {{ errors: string[], data: object }}
 */
export function validateVariant(body, { partial = false } = {}) {
  const errors = [];
  const data = {};
  const has = (f) => body[f] !== undefined;
  const blank = (v) => v == null || (typeof v === "string" && v.trim() === "");

  if (!partial || has("name")) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) errors.push("Option name is required");
    else if (name.length > MAX_NAME) errors.push(`Option name must be ${MAX_NAME} characters or fewer`);
    else data.name = name;
  }

  if (!partial || has("price")) {
    const price = Number(body.price);
    if (blank(body.price) || Number.isNaN(price)) errors.push("Option price is required");
    else if (price <= 0) errors.push("Option price must be greater than 0");
    else data.price = price;
  }

  if (has("compareAt")) {
    if (blank(body.compareAt)) {
      data.compareAt = null;
    } else {
      const compareAt = Number(body.compareAt);
      if (Number.isNaN(compareAt) || compareAt <= 0) errors.push("Compare-at price must be a positive number");
      else data.compareAt = compareAt;
    }
  }

  if (!partial || has("stock")) {
    if (blank(body.stock)) {
      data.stock = 0;
    } else {
      const stock = Number(body.stock);
      if (!Number.isInteger(stock)) errors.push("Option stock must be a whole number");
      else if (stock < 0) errors.push("Option stock cannot be negative");
      else data.stock = stock;
    }
  }

  if (has("sku")) {
    const sku = typeof body.sku === "string" ? body.sku.trim() : body.sku;
    data.sku = blank(sku) ? null : sku;
    if (data.sku && data.sku.length > 100) errors.push("Option SKU must be 100 characters or fewer");
  }

  if (has("images")) {
    if (!Array.isArray(body.images)) {
      errors.push("Option images must be a list");
    } else {
      const images = body.images.map((i) => (typeof i === "string" ? i.trim() : "")).filter(Boolean);
      if (images.some((i) => !/^(https?:\/\/|\/)/.test(i))) {
        errors.push("Each option image must be a URL or an absolute path");
      } else {
        data.images = images;
      }
    }
  }

  if (has("b2bMinOrderQty")) {
    if (blank(body.b2bMinOrderQty) || body.b2bMinOrderQty === null) {
      data.b2bMinOrderQty = null;
    } else {
      const b2bMoq = Number(body.b2bMinOrderQty);
      if (!Number.isInteger(b2bMoq)) errors.push("B2B minimum order quantity must be a whole number");
      else if (b2bMoq < 1) errors.push("B2B minimum order quantity must be at least 1");
      else data.b2bMinOrderQty = b2bMoq;
    }
  }

  if (has("isActive")) data.isActive = Boolean(body.isActive);
  if (has("sortOrder")) {
    const sortOrder = Number(body.sortOrder);
    if (Number.isInteger(sortOrder)) data.sortOrder = sortOrder;
  }

  const price = data.price;
  const compareAt = data.compareAt;
  if (price != null && compareAt != null && compareAt <= price) {
    errors.push("Compare-at price must be higher than the option price");
  }

  return { errors, data };
}
