/**
 * Hakkiveda — B2B Auth & Helper Utilities
 *
 * Every B2B API must verify:
 *   1. Authenticated User
 *   2. Organization Membership
 *   3. Required Organization Role
 *   4. Resource Ownership
 */

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
export { generateRefNumber, generateNumber } from "@/lib/ref-number";

// ─── Auth Helpers ───────────────────────────────────────────────────────────

/**
 * Get the authenticated session or return null.
 */
export async function getSession() {
  const session = await auth();
  return session;
}

/**
 * Require authentication. Returns { user } or throws a Response.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session;
}

/**
 * Get the user's organization membership.
 * Returns { membership, organization } or null.
 */
export async function getOrgMembership(userId) {
  const membership = await prisma.b2BOrganizationMember.findFirst({
    where: { userId, status: "ACTIVE" },
    include: {
      organization: true,
    },
  });

  if (!membership) return null;

  return {
    membership,
    organization: membership.organization,
  };
}

/**
 * Require B2B organization membership.
 * Returns { session, membership, organization }.
 */
export async function requireB2BMember(requiredRoles = []) {
  const session = await requireAuth();
  const userId = session.user.id;

  const result = await getOrgMembership(userId);

  if (!result) {
    throw new Response(
      JSON.stringify({ error: "B2B organization membership required" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  if (result.organization.status !== "ACTIVE") {
    throw new Response(
      JSON.stringify({ error: "Organization is inactive" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(result.membership.role)) {
    throw new Response(
      JSON.stringify({ error: "Insufficient organization role" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  return {
    session,
    membership: result.membership,
    organization: result.organization,
  };
}

/**
 * Verify that a resource belongs to the user's organization.
 */
export function verifyOrgOwnership(resource, organizationId) {
  if (resource.organizationId !== organizationId) {
    throw new Response(
      JSON.stringify({ error: "Resource does not belong to your organization" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ─── Pricing Helpers ────────────────────────────────────────────────────────

/**
 * Get the effective B2B price for a product + organization + quantity.
 * Priority:
 *   1. Organization-specific price (B2BPrice)
 *   2. Quantity-based tier (B2BPriceTier)
 *   3. Retail price fallback
 */
export async function getB2BPrice(productId, organizationId, quantity = 1) {
  // 1. Check org-specific price
  const orgPrice = await prisma.b2BPrice.findUnique({
    where: {
      productId_organizationId: { productId, organizationId },
    },
  });

  if (orgPrice) {
    return { unitPrice: orgPrice.unitPrice, source: "organization" };
  }

  // 2. Check quantity-based tiers
  const tier = await prisma.b2BPriceTier.findFirst({
    where: {
      productId,
      minQty: { lte: quantity },
      OR: [{ maxQty: null }, { maxQty: { gte: quantity } }],
    },
    orderBy: { minQty: "desc" },
  });

  if (tier) {
    return { unitPrice: tier.unitPrice, source: "tier" };
  }

  // 3. Fallback to retail
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { retailPrice: true },
  });

  return { unitPrice: product?.retailPrice ?? 0, source: "retail" };
}

// ─── Validation Helpers ─────────────────────────────────────────────────────

export function validateRequired(data, fields) {
  const errors = {};
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === "string" && !data[field].trim())) {
      errors[field] = `${field} is required`;
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  return /^[\d+\-\s()]{7,20}$/.test(phone);
}

// ─── JSON Response Helpers ──────────────────────────────────────────────────

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
