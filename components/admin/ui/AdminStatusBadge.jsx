"use client";

const statusColors = {
  // Generic
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-slate-50 text-slate-600 border-slate-200",
  SUSPENDED: "bg-red-50 text-red-700 border-red-200",
  REMOVED: "bg-red-50 text-red-700 border-red-200",

  // Application
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  CONTACT_REQUIRED: "bg-orange-50 text-orange-700 border-orange-200",
  MORE_INFORMATION_REQUIRED: "bg-orange-50 text-orange-700 border-orange-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",

  // Orders
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SHIPPED: "bg-cyan-50 text-cyan-700 border-cyan-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-slate-50 text-slate-600 border-slate-200",
  RETURNED: "bg-orange-50 text-orange-700 border-orange-200",
  REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",

  // Payment
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",

  // Fulfillment
  UNFULFILLED: "bg-slate-50 text-slate-600 border-slate-200",
  PARTIALLY_FULFILLED: "bg-amber-50 text-amber-700 border-amber-200",
  FULFILLED: "bg-emerald-50 text-emerald-700 border-emerald-200",

  // Quotation
  DRAFT: "bg-slate-50 text-slate-600 border-slate-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SENT: "bg-blue-50 text-blue-700 border-blue-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  QUOTED: "bg-blue-50 text-blue-700 border-blue-200",
  EXPIRED: "bg-slate-50 text-slate-500 border-slate-200",
  SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200",

  // Admin roles
  ADMIN: "bg-purple-50 text-purple-700 border-purple-200",

  // B2B business types
  INDIVIDUAL: "bg-slate-50 text-slate-600 border-slate-200",
  SOLE_PROPRIETORSHIP: "bg-blue-50 text-blue-700 border-blue-200",
  PARTNERSHIP: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PRIVATE_COMPANY: "bg-purple-50 text-purple-700 border-purple-200",

  // Verification
  VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",

  // B2B member roles
  ORGANIZATION_OWNER: "bg-purple-50 text-purple-700 border-purple-200",
  PURCHASER: "bg-blue-50 text-blue-700 border-blue-200",
  APPROVER: "bg-cyan-50 text-cyan-700 border-cyan-200",
  ACCOUNTANT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  EMPLOYEE: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function AdminStatusBadge({ status }) {
  const colors = statusColors[status] || "bg-slate-50 text-slate-600 border-slate-200";
  const label = status?.replace(/_/g, " ") || "—";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide border ${colors}`}>
      {label}
    </span>
  );
}
