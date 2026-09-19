"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";

const STARS = [1, 2, 3, 4, 5];

function StarDisplay({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {STARS.map((s) => (
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

/* ─────────────────────────── Interactive star input ──────────────────────── */
function StarInput({ value, onChange, max = 5 }) {
  const [hovered, setHovered] = useState(0);
  // Support half-star display for existing values, but input is whole + .5 steps
  const steps = [];
  for (let i = 0.5; i <= max; i += 0.5) steps.push(i);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="p-0.5"
        >
          <Icon
            name="star"
            size={22}
            filled={s <= (hovered || value)}
            className={s <= (hovered || value) ? "text-amber-500" : "text-slate-300"}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-semibold text-slate-700">{value}/5</span>
      )}
    </div>
  );
}

/* ─────────────── Product Rating Override Panel ──────────────── */
function ProductRatingOverride() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState(null); // productId
  const [editForm, setEditForm] = useState({
    isAdminRatingEnabled: false,
    adminRating: 0,
    adminReviewCount: "",
  });
  const [saving, setSaving] = useState(false);
  const [ratingData, setRatingData] = useState({}); // productId → rating info

  // Fetch all products for the listing
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: 1, limit: 100 });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/products?${params}`);
      const json = await res.json();
      if (res.ok) {
        setProducts(json.data || []);
        // Fetch rating info for each product
        const ratingInfo = {};
        await Promise.all(
          (json.data || []).map(async (p) => {
            try {
              const rRes = await fetch(`/api/admin/products/${p.id}/rating`);
              if (rRes.ok) {
                ratingInfo[p.id] = await rRes.json();
              }
            } catch {}
          })
        );
        setRatingData(ratingInfo);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function startEdit(product) {
    const info = ratingData[product.id];
    setEditingProduct(product.id);
    setEditForm({
      isAdminRatingEnabled: info?.isAdminRatingEnabled || false,
      adminRating: info?.adminRating || 0,
      adminReviewCount: info?.adminReviewCount ?? "",
    });
  }

  async function saveOverride(productId) {
    setSaving(true);
    try {
      const payload = {
        isAdminRatingEnabled: editForm.isAdminRatingEnabled,
      };
      if (editForm.isAdminRatingEnabled) {
        payload.adminRating = parseFloat(editForm.adminRating) || 0;
        if (editForm.adminReviewCount !== "" && editForm.adminReviewCount !== null) {
          payload.adminReviewCount = parseInt(editForm.adminReviewCount, 10) || 0;
        }
      }

      const res = await fetch(`/api/admin/products/${productId}/rating`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingProduct(null);
        fetchProducts(); // refresh data
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save rating override");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Product Rating Control</h3>
          <p className="text-xs text-slate-500 mt-0.5">Set manual ratings or use auto-calculated from approved reviews</p>
        </div>
        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white max-w-xs">
          <span className="pl-3 text-slate-400">
            <Icon name="search" size={16} />
          </span>
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-2 py-1.5 text-sm w-full outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-slate-500">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-500">No products found</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {products.map((product) => {
            const info = ratingData[product.id];
            const isEditing = editingProduct === product.id;
            const source = info?.displayed?.source || "auto";
            const displayedRating = info?.displayed?.rating ?? 0;
            const displayedCount = info?.displayed?.reviewCount ?? 0;
            const computedRating = info?.computed?.avgRating ?? 0;
            const computedCount = info?.computed?.count ?? 0;

            return (
              <div key={product.id} className="px-5 py-4">
                <div className="flex items-center gap-4">
                  {/* Product info */}
                  <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Icon name="inventory_2" size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        source === "admin"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        <Icon name={source === "admin" ? "tune" : "calculate"} size={12} />
                        {source === "admin" ? "Admin controlled" : "Automatically calculated"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-600">
                        <Icon name="star" size={12} filled className="text-amber-500" />
                        {displayedRating.toFixed(1)} ({displayedCount} {displayedCount === 1 ? "review" : "reviews"})
                      </span>
                      {source === "admin" && (
                        <span className="text-xs text-slate-400">
                          Approved: {computedRating.toFixed(1)} ({computedCount})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  {!isEditing && (
                    <button
                      onClick={() => startEdit(product)}
                      className="shrink-0 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                  )}
                </div>

                {/* Editing panel */}
                {isEditing && (
                  <div className="mt-4 ml-14 p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.isAdminRatingEnabled}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, isAdminRatingEnabled: e.target.checked }))
                          }
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700">
                          Enable admin-controlled rating
                        </span>
                      </label>
                    </div>

                    {editForm.isAdminRatingEnabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1.5">
                            Display Rating (0–5 stars)
                          </label>
                          <div className="flex items-center gap-3">
                            <StarInput
                              value={editForm.adminRating}
                              onChange={(v) => setEditForm((f) => ({ ...f, adminRating: v }))}
                            />
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="0.1"
                              value={editForm.adminRating}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, adminRating: parseFloat(e.target.value) || 0 }))
                              }
                              className="w-20 border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-center"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1.5">
                            Display Review Count (optional — leave blank to use actual approved count of {computedCount})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder={`Auto: ${computedCount}`}
                            value={editForm.adminReviewCount}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, adminReviewCount: e.target.value }))
                            }
                            className="w-32 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {!editForm.isAdminRatingEnabled && (
                      <p className="text-xs text-slate-500">
                        Rating will be automatically calculated from {computedCount} approved {computedCount === 1 ? "review" : "reviews"} ({computedRating.toFixed(1)} stars)
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => saveOverride(product.id)}
                        disabled={saving}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingProduct(null)}
                        disabled={saving}
                        className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Main Admin Reviews Page ──────────────── */
export default function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState("reviews");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchReviews = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("sort", "createdAt");
      params.set("order", "desc");
      const res = await fetch(`/api/admin/reviews?${params}`);
      const json = await res.json();
      if (res.ok) {
        setReviews(json.data);
        setPagination(json.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    if (activeTab === "reviews") fetchReviews(1);
  }, [fetchReviews, activeTab]);

  async function handleModerate(id, status) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchReviews(pagination.page);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchReviews(pagination.page);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  }

  const columns = [
    {
      key: "product",
      label: "Product",
      render: (row) => (
        <Link href={`/admin/products/${row.product.id}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden shrink-0">
            {row.product.images?.[0] ? (
              <img src={row.product.images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Icon name="inventory_2" size={16} />
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 line-clamp-1">
            {row.product.name}
          </span>
        </Link>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (row) => {
        const u = row.customer?.user;
        const name = [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "Anonymous";
        return (
          <div>
            <p className="text-sm font-medium text-slate-900">{name}</p>
            <p className="text-xs text-slate-500">{u?.email}</p>
          </div>
        );
      },
    },
    {
      key: "rating",
      label: "Rating",
      render: (row) => <StarDisplay rating={row.rating} />,
    },
    {
      key: "review",
      label: "Review",
      render: (row) => (
        <div className="max-w-xs">
          {row.title && <p className="text-sm font-semibold text-slate-900 line-clamp-1">{row.title}</p>}
          {row.body && <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{row.body}</p>}
          {!row.title && !row.body && <span className="text-xs text-slate-400 italic">No text</span>}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "actions",
      label: "",
      render: (row) => {
        const isLoading = actionLoading === row.id;
        return (
          <div className="flex items-center gap-1">
            {row.status !== "APPROVED" && (
              <button
                onClick={() => handleModerate(row.id, "APPROVED")}
                disabled={isLoading}
                className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                title="Approve"
              >
                <Icon name="check_circle" size={18} />
              </button>
            )}
            {row.status !== "REJECTED" && (
              <button
                onClick={() => handleModerate(row.id, "REJECTED")}
                disabled={isLoading}
                className="p-1.5 rounded text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                title="Reject"
              >
                <Icon name="block" size={18} />
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
      },
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Reviews" description="Manage customer reviews and product ratings" />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "reviews"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Icon name="reviews" size={16} />
            Customer Reviews
          </span>
        </button>
        <button
          onClick={() => setActiveTab("ratings")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "ratings"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Icon name="star" size={16} />
            Rating Control
          </span>
        </button>
      </div>

      {activeTab === "ratings" && <ProductRatingOverride />}

      {activeTab === "reviews" && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white flex-1 max-w-sm">
              <span className="pl-3 text-slate-400">
                <Icon name="search" size={16} />
              </span>
              <input
                type="text"
                placeholder="Search reviews, products, customers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-2 py-2 text-sm w-full outline-none"
              />
            </div>
          </div>

          <AdminDataTable
            columns={columns}
            data={reviews}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => fetchReviews(page)}
            emptyMessage="No reviews found"
          />
        </>
      )}
    </div>
  );
}
