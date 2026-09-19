/**
 * Hakkiveda — Admin Auth & Permission Utilities
 */

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// ─── Permission Matrix ──────────────────────────────────────────────────────

const PERMISSIONS = {
  ADMIN: ["*"],
  ORDER_MANAGER: ["dashboard", "customer-orders", "b2b.orders", "customers"],
  PRODUCT_MANAGER: ["dashboard", "products", "categories", "reviews"],
  B2B_MANAGER: [
    "dashboard",
    "b2b.applications", "b2b.organizations", "b2b.members",
    "b2b.rfqs", "b2b.quotations", "b2b.purchase-orders",
    "b2b.orders", "b2b.invoices", "b2b.payments",
  ],
  FINANCE_MANAGER: [
    "dashboard", "customer-orders", "b2b.orders",
    "b2b.invoices", "b2b.payments", "reports",
  ],
  SUPPORT_MANAGER: ["dashboard", "customers", "customer-orders"],
};

/**
 * Check if an admin role has a specific permission.
 */
export function hasPermission(role, permission) {
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

/**
 * Get all permissions for a role.
 */
export function getPermissions(role) {
  return PERMISSIONS[role] || [];
}

// ─── Auth Helpers ────────────────────────────────────────────────────────────

/**
 * Require admin authentication. Returns { session, admin } or throws a Response.
 */
export async function requireAdmin(requiredPermission) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true, image: true } } },
  });

  if (!admin || !admin.isActive) {
    throw new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (requiredPermission && !hasPermission(admin.role, requiredPermission)) {
    throw new Response(JSON.stringify({ error: "Insufficient permissions" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { session, admin };
}

// ─── Audit Logging ──────────────────────────────────────────────────────────

/**
 * Create an audit log entry.
 */
export async function createAuditLog({
  adminId,
  action,
  entityType,
  entityId,
  description,
  metadata,
  ipAddress,
}) {
  // Best-effort: the audited operation has already committed, so a logging
  // failure must not turn a successful write into an error response.
  try {
    return await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId: entityId || null,
        description,
        metadata: metadata || undefined,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("[AUDIT_LOG_FAILED]", { action, entityType, entityId }, err);
    return null;
  }
}

// ─── Response Helpers ────────────────────────────────────────────────────────

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

// ─── Pagination Helper ──────────────────────────────────────────────────────

export function parsePagination(searchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build a pagination response.
 */
export function paginatedResponse(data, total, page, limit) {
  return jsonResponse({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
}
