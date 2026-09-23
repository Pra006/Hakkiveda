/**
 * Hakkiveda — Admin Auth & Utility Functions
 *
 * Single-admin system: the one administrator has full access to everything.
 * Permission checks have been removed — requireAdmin() only verifies that
 * the caller is an active admin.
 */

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// ─── Auth Helpers ────────────────────────────────────────────────────────────

/**
 * Require admin authentication. Returns { session, admin } or throws a Response.
 *
 * The `requiredPermission` parameter is accepted for backward compatibility
 * with existing API route call-sites but is ignored — the single admin
 * always has full access.
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
