/**
 * Hakkiveda — Product validation & shaping for the admin API.
 *
 * Mirrors the Product model in prisma/schema.prisma:
 *   name, slug, sku, description, brand, retailPrice, compareAt,
 *   images[], stock, moq, isB2B, isActive, categoryId
 */

import { slugify } from "@/lib/utils";

export const PRODUCT_SORT_FIELDS = ["name", "retailPrice", "stock", "createdAt", "updatedAt"];

function isBlank(v) {
  return v == null || (typeof v === "string" && v.trim() === "");
}

/**
 * Validate and normalise a product payload.
 *
 * @param {object} body    raw request body
 * @param {boolean} partial  true for PATCH — only validates supplied fields
 * @returns {{ errors: string[], data: object }}
 */
export function validateProduct(body, { partial = false } = {}) {
  const errors = [];
  const data = {};
  const has = (f) => body[f] !== undefined;

  // ── Name ──
  if (!partial || has("name")) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (isBlank(name)) errors.push("Product name is required");
    else if (name.length > 200) errors.push("Product name must be 200 characters or fewer");
    else data.name = name;
  }

  // ── Slug (derived from name when omitted on create) ──
  if (!partial || has("slug")) {
    const raw = !isBlank(body.slug) ? body.slug : body.name;
    const slug = slugify(raw || "");
    if (isBlank(slug)) errors.push("A valid URL slug is required");
    else if (slug.length > 200) errors.push("Slug must be 200 characters or fewer");
    else data.slug = slug;
  }

  // ── Price ──
  if (!partial || has("retailPrice")) {
    const price = Number(body.retailPrice);
    if (body.retailPrice === "" || body.retailPrice == null || Number.isNaN(price)) {
      errors.push("Retail price is required");
    } else if (price <= 0) {
      errors.push("Retail price must be greater than 0");
    } else {
      data.retailPrice = price;
    }
  }

  // ── Compare-at price (the discount reference) ──
  if (has("compareAt")) {
    if (isBlank(body.compareAt)) {
      data.compareAt = null;
    } else {
      const compareAt = Number(body.compareAt);
      if (Number.isNaN(compareAt)) errors.push("Compare-at price must be a number");
      else if (compareAt <= 0) errors.push("Compare-at price must be greater than 0");
      else data.compareAt = compareAt;
    }
  }

  // ── Stock ──
  if (!partial || has("stock")) {
    if (isBlank(body.stock)) {
      data.stock = 0;
    } else {
      const stock = Number(body.stock);
      if (!Number.isInteger(stock)) errors.push("Stock must be a whole number");
      else if (stock < 0) errors.push("Stock cannot be negative");
      else data.stock = stock;
    }
  }

  // ── Minimum order quantity ──
  if (has("moq")) {
    if (isBlank(body.moq)) {
      data.moq = 1;
    } else {
      const moq = Number(body.moq);
      if (!Number.isInteger(moq)) errors.push("Minimum order quantity must be a whole number");
      else if (moq < 1) errors.push("Minimum order quantity must be at least 1");
      else data.moq = moq;
    }
  }

  // ── B2B minimum order quantity ──
  if (has("b2bMinOrderQty")) {
    if (isBlank(body.b2bMinOrderQty) || body.b2bMinOrderQty === null) {
      data.b2bMinOrderQty = null;
    } else {
      const b2bMoq = Number(body.b2bMinOrderQty);
      if (!Number.isInteger(b2bMoq)) errors.push("B2B minimum order quantity must be a whole number");
      else if (b2bMoq < 1) errors.push("B2B minimum order quantity must be at least 1");
      else data.b2bMinOrderQty = b2bMoq;
    }
  }

  // ── Optional text metadata ──
  for (const field of ["sku", "description", "brand"]) {
    if (has(field)) {
      const value = typeof body[field] === "string" ? body[field].trim() : body[field];
      data[field] = isBlank(value) ? null : value;
    }
  }
  if (data.sku && data.sku.length > 100) errors.push("SKU must be 100 characters or fewer");

  // ── Images ──
  if (has("images")) {
    if (!Array.isArray(body.images)) {
      errors.push("Images must be a list");
    } else {
      const images = body.images.map((i) => (typeof i === "string" ? i.trim() : "")).filter(Boolean);
      if (images.some((i) => !/^(https?:\/\/|\/)/.test(i))) {
        errors.push("Each image must be a URL or an absolute path");
      } else {
        data.images = images;
      }
    }
  }

  // ── Flags & relations ──
  if (has("isActive")) data.isActive = Boolean(body.isActive);
  if (has("isB2B")) data.isB2B = Boolean(body.isB2B);
  if (has("categoryId")) data.categoryId = isBlank(body.categoryId) ? null : body.categoryId;

  // ── Featured product controls ──
  if (has("isFeatured")) data.isFeatured = Boolean(body.isFeatured);
  if (has("isNewArrival")) data.isNewArrival = Boolean(body.isNewArrival);
  if (has("featuredOrder")) {
    if (body.featuredOrder === null || body.featuredOrder === "" || body.featuredOrder === undefined) {
      data.featuredOrder = null;
    } else {
      const featuredOrder = Number(body.featuredOrder);
      if (!Number.isInteger(featuredOrder)) errors.push("Featured order must be a whole number");
      else if (featuredOrder < 0) errors.push("Featured order cannot be negative");
      else data.featuredOrder = featuredOrder;
    }
  }

  // ── Cross-field rule: a compare-at price only means something above the price ──
  const price = data.retailPrice;
  const compareAt = data.compareAt;
  if (price != null && compareAt != null && compareAt <= price) {
    errors.push("Compare-at price must be higher than the retail price");
  }

  return { errors, data };
}

/**
 * Discount percentage implied by compareAt, or 0.
 */
export function discountFor(product) {
  if (!product.compareAt || product.compareAt <= product.retailPrice) return 0;
  return Math.round(((product.compareAt - product.retailPrice) / product.compareAt) * 100);
}

/**
 * Validate featured product fields.
 * Returns { errors: string[], data: object }
 */
export function validateFeaturedUpdate(body) {
  const errors = [];
  const data = {};

  if (body.isFeatured !== undefined) {
    data.isFeatured = Boolean(body.isFeatured);
  }

  if (body.featuredOrder !== undefined) {
    if (body.featuredOrder === null || body.featuredOrder === "" || body.featuredOrder === undefined) {
      data.featuredOrder = null;
    } else {
      const order = Number(body.featuredOrder);
      if (!Number.isInteger(order)) errors.push("Featured order must be a whole number");
      else if (order < 0) errors.push("Featured order cannot be negative");
      else data.featuredOrder = order;
    }
  }

  return { errors, data };
}
