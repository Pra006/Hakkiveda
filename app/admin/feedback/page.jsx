"use client";

import { useState, useEffect, useCallback } from "react";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import AdminStatCard from "@/components/admin/ui/AdminStatCard";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

const CATEGORY_LABELS = {
  PRODUCT: "Product",
  DELIVERY: "Delivery",
  WEBSITE: "Website",
  CUSTOMER_SERVICE: "Customer Service",
  OTHER: "Other",
};

function StarDisplay({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Icon
          key={s}
          name="star"
          size={14}
          filled={s <= rating}
          className={s <= rating ? "text-amber-500" : "text-slate-300"}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-slate-700">{rating}</span>
    </div>
  );
}

function displayName(user) {
  return (
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.name ||
    "Customer"
  );
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, newCount: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [viewing, setViewing] = useState(null);

  const fetchFeedback = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await fetch(`/api/admin/feedback?${params}`);
      const json = await res.json();
      if (res.ok) {
        setItems(json.data);
        setPagination(json.pagination);
        setStats(json.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchFeedback(1);
  }, [fetchFeedback]);

  async function markRead(id, status) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchFeedback(pagination.page);
        setViewing((v) => (v && v.id === id ? { ...v, status } : v));
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Could not update feedback");
      }
    } catch {
      toast.error("Could not update feedback");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Permanently delete this feedback? This cannot be undone.")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Feedback deleted");
        setViewing((v) => (v && v.id === id ? null : v));
        fetchFeedback(pagination.page);
      } else {
        toast.error("Could not delete feedback");
      }
    } catch {
      toast.error("Could not delete feedback");
    } finally {
      setActionLoading(null);
    }
  }

  function openView(row) {
    setViewing(row);
    if (row.status === "NEW") markRead(row.id, "READ");
  }

  const columns = [
    {
      key: "customer",
      label: "Customer",
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{displayName(row.user)}</p>
          <p className="text-xs text-slate-500">{row.user?.email}</p>
        </div>
      ),
    },
    { key: "rating", label: "Rating", render: (row) => <StarDisplay rating={row.rating} /> },
    {
      key: "category",
      label: "Category",
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">{CATEGORY_LABELS[row.category] || row.category}</span>
      ),
    },
    {
      key: "message",
      label: "Message",
      render: (row) => (
        <p className="text-xs text-slate-600 line-clamp-2 max-w-xs">{row.message}</p>
      ),
    },
    { key: "status", label: "Status", render: (row) => <AdminStatusBadge status={row.status} /> },
    { key: "createdAt", label: "Date", render: (row) => <span className="text-xs text-slate-600">{fmtDate(row.createdAt)}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="Feedback" description="Customer feedback and satisfaction insights" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <AdminStatCard label="Total Feedback" value={stats.total} icon="forum" accent="blue" />
        <AdminStatCard label="New / Unread" value={stats.newCount} icon="mark_email_unread" accent="amber" />
        <AdminStatCard
          label="Average Rating"
          value={stats.averageRating ? `${stats.averageRating.toFixed(2)} ★` : "—"}
          icon="star"
          accent="green"
        />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="READ">Read</option>
        </select>
        <select
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white flex-1 max-w-sm">
          <span className="pl-3 text-slate-400"><Icon name="search" size={16} /></span>
          <input
            type="text"
            placeholder="Search message, name, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-2 py-2 text-sm w-full outline-none"
          />
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={items}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => fetchFeedback(page)}
        emptyIcon="forum"
        emptyMessage="No feedback yet"
        actions={(row) => {
          const isLoading = actionLoading === row.id;
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => openView(row)}
                disabled={isLoading}
                className="p-1.5 rounded text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                title="View"
              >
                <Icon name="visibility" size={18} />
              </button>
              {row.status === "NEW" && (
                <button
                  onClick={() => markRead(row.id, "READ")}
                  disabled={isLoading}
                  className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                  title="Mark as read"
                >
                  <Icon name="mark_email_read" size={18} />
                </button>
              )}
              <button
                onClick={() => handleDelete(row.id)}
                disabled={isLoading}
                className="p-1.5 rounded text-red-500 hover:bg-red-50 disabled:opacity-50"
                title="Delete"
              >
                <Icon name="delete" size={18} />
              </button>
            </div>
          );
        }}
      />

      {/* View modal */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Feedback Detail</h3>
              <button onClick={() => setViewing(null)} className="p-1 rounded hover:bg-slate-100 text-slate-500">
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{displayName(viewing.user)}</p>
                  <p className="text-xs text-slate-500">{viewing.user?.email}</p>
                </div>
                <AdminStatusBadge status={viewing.status} />
              </div>
              <div className="flex items-center gap-4">
                <StarDisplay rating={viewing.rating} />
                <span className="text-xs font-medium text-slate-600">
                  {CATEGORY_LABELS[viewing.category] || viewing.category}
                </span>
                <span className="text-xs text-slate-400">{fmtDate(viewing.createdAt)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{viewing.message}</p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
              {viewing.status === "NEW" && (
                <button
                  onClick={() => markRead(viewing.id, "READ")}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Mark as Read
                </button>
              )}
              <button
                onClick={() => handleDelete(viewing.id)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
