"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);
  const [reassignTarget, setReassignTarget] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchCategories = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        const all = data.data || data || [];
        // Build tree: parents first, then children nested beneath
        const parentMap = {};
        const roots = [];
        for (const c of all) {
          if (!c.parentId) roots.push(c);
          else {
            if (!parentMap[c.parentId]) parentMap[c.parentId] = [];
            parentMap[c.parentId].push(c);
          }
        }
        const flat = [];
        for (const root of roots) {
          flat.push({ ...root, depth: 0 });
          const children = parentMap[root.id] || [];
          for (const child of children) {
            flat.push({ ...child, depth: 1 });
          }
        }
        setCategories(flat);
      })
      .catch(() => {
        setCategories([]);
        toast.error("Failed to load categories");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const filtered = search
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.slug.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  const toggleStatus = async (cat) => {
    setActionLoading(cat.id);
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update status");
      }
      toast.success(`Category "${cat.name}" ${cat.isActive ? "deactivated" : "activated"}`);
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setActionLoading(deleteModal.id);
    try {
      let url = `/api/admin/categories/${deleteModal.id}`;
      if (deleteModal._count?.products > 0 && reassignTarget) {
        url += `?force=reassign&target=${reassignTarget}`;
      }
      const res = await fetch(url, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Delete failed");
      toast.success(d.message || "Category deleted");
      setDeleteModal(null);
      setReassignTarget("");
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const rootCategories = categories.filter((c) => !c.parentId && c.id !== deleteModal?.id);

  return (
    <div>
      <AdminPageHeader title="Categories" description="Manage product categories and subcategories">
        <Link href="/admin/categories/new">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Icon name="add" size={18} />
            Add Category
          </button>
        </Link>
      </AdminPageHeader>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none w-64"
            />
          </div>
          <span className="ml-auto text-xs text-slate-500">
            {filtered.length} categor{filtered.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Icon name="folder" size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">
              {search ? "No categories match your search" : "No categories yet"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {search ? "Try a different search term" : "Create your first category to organize products"}
            </p>
            {!search && (
              <Link href="/admin/categories/new">
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  Add Category
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Slug</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Parent</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Products</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => (
                  <tr key={cat.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" style={{ paddingLeft: (cat.depth || 0) * 24 }}>
                        {cat.depth > 0 && (
                          <span className="text-slate-300 text-sm">└</span>
                        )}
                        {cat.image && (
                          <img src={cat.image} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                        )}
                        <div>
                          <Link
                            href={`/admin/categories/${cat.id}`}
                            className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {cat.name}
                          </Link>
                          {cat._count?.children > 0 && (
                            <span className="ml-2 text-[10px] text-slate-400">
                              {cat._count.children} sub
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{cat.slug}</code>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {cat.parent?.name || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-slate-600">{cat._count?.products ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AdminStatusBadge status={cat.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/categories/${cat.id}`}>
                          <button
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                        </Link>
                        <button
                          onClick={() => toggleStatus(cat)}
                          disabled={actionLoading === cat.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            cat.isActive
                              ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={cat.isActive ? "Deactivate" : "Activate"}
                        >
                          <Icon name={cat.isActive ? "visibility_off" : "visibility"} size={16} />
                        </button>
                        <button
                          onClick={() => { setDeleteModal(cat); setReassignTarget(""); }}
                          disabled={actionLoading === cat.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Icon name="delete" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Icon name="delete" size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Category</h3>
                <p className="text-sm text-slate-500">"{deleteModal.name}"</p>
              </div>
            </div>

            {deleteModal._count?.children > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Cannot delete.</strong> This category has {deleteModal._count.children} subcategorie(s).
                  Please delete or reassign them first.
                </p>
              </div>
            ) : deleteModal._count?.products > 0 ? (
              <div className="space-y-3 mb-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    This category has <strong>{deleteModal._count.products} product(s)</strong> assigned.
                    To delete it, reassign the products to another category:
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reassign products to:</label>
                  <select
                    value={reassignTarget}
                    onChange={(e) => setReassignTarget(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  >
                    <option value="">Select a category...</option>
                    {rootCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.depth ? "  └ " : ""}{c.name}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-slate-500">
                  Alternatively, you can <button type="button" onClick={() => { setDeleteModal(null); toggleStatus(deleteModal); }} className="text-blue-600 underline">deactivate</button> this category instead of deleting it.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600 mb-4">
                Are you sure you want to permanently delete this category? This action cannot be undone.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setDeleteModal(null); setReassignTarget(""); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              {deleteModal._count?.children > 0 ? null : (
                <button
                  onClick={handleDelete}
                  disabled={
                    actionLoading === deleteModal.id ||
                    (deleteModal._count?.products > 0 && !reassignTarget)
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === deleteModal.id ? "Deleting..." : "Delete Category"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
