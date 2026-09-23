"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

export default function CategoryDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const fileRef = useRef(null);

  const [form, setForm] = useState(null);
  const [original, setOriginal] = useState(null);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [reassignTarget, setReassignTarget] = useState("");

  useEffect(() => {
    fetch(`/api/admin/categories/${id}`)
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((data) => {
        setForm(data);
        setOriginal(data);
      })
      .catch(() => {
        toast.error("Category not found");
        router.push("/admin/categories");
      });

    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        const all = data.data || data || [];
        // For parent picker: exclude self and children of self, only show roots
        setCategories(all.filter((c) => c.id !== id && !c.parentId));
      })
      .catch(() => {});
  }, [id, router]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSlugChange = (slug) => {
    update("slug", slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-"));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/category-images", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Upload failed");
      }
      const { url } = await res.json();
      update("image", url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) { toast.error("Category name is required"); return; }
    if (!form.slug?.trim()) { toast.error("Slug is required"); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description?.trim() || null,
          parentId: form.parentId || null,
          image: form.image || null,
          isActive: form.isActive,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Save failed");
      }
      const updated = await res.json();
      setForm(updated);
      setOriginal(updated);
      toast.success("Category updated!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      let url = `/api/admin/categories/${id}`;
      if ((original?._count?.products || 0) > 0 && reassignTarget) {
        url += `?force=reassign&target=${reassignTarget}`;
      }
      const res = await fetch(url, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Delete failed");
      toast.success(d.message || "Category deleted");
      router.push("/admin/categories");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !form.isActive }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      const updated = await res.json();
      setForm((p) => ({ ...p, isActive: updated.isActive }));
      setOriginal((p) => ({ ...p, isActive: updated.isActive }));
      toast.success(`Category ${updated.isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasChildren = (original?.children?.length || 0) > 0;
  const productCount = original?._count?.products || 0;
  const canSelectParent = !hasChildren; // categories with children cannot become subcategories

  return (
    <div>
      <AdminPageHeader title="Edit Category" description={form.name}>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleStatus}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              form.isActive
                ? "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
                : "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <Icon name={form.isActive ? "visibility_off" : "visibility"} size={16} />
            {form.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => router.push("/admin/categories")}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Icon name="arrow_back" size={16} /> Back
          </button>
        </div>
      </AdminPageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <form onSubmit={handleSave} className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Category Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slug <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={form.description || ""}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none resize-vertical"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent Category</label>
                {canSelectParent ? (
                  <select
                    value={form.parentId || ""}
                    onChange={(e) => update("parentId", e.target.value || null)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none"
                  >
                    <option value="">None (Top Level)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-500 bg-slate-100 rounded-lg border border-slate-200">
                    Top Level <span className="text-xs text-slate-400">(has subcategories)</span>
                  </div>
                )}
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => update("isActive", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Active</span>
                </label>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category Image</label>
              <div className="flex items-start gap-4">
                {form.image ? (
                  <div className="relative group">
                    <img src={form.image} alt="Category" className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => update("image", null)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                  >
                    <Icon name="add_photo_alternate" size={24} className="text-slate-400" />
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {uploading ? "Uploading..." : form.image ? "Change Image" : "Upload Image"}
                  </button>
                  <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP. Max 5 MB.</p>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" />
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Category Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <AdminStatusBadge status={form.isActive ? "ACTIVE" : "INACTIVE"} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Products</span>
                <span className="font-medium text-slate-700">{productCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subcategories</span>
                <span className="font-medium text-slate-700">{original?.children?.length || 0}</span>
              </div>
              {original?.createdAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Created</span>
                  <span className="text-slate-700">{new Date(original.createdAt).toLocaleDateString()}</span>
                </div>
              )}
              {original?.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Updated</span>
                  <span className="text-slate-700">{new Date(original.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Subcategories list */}
          {original?.children?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">Subcategories</h3>
              <div className="space-y-2">
                {original.children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">{child.name}</span>
                      <AdminStatusBadge status={child.isActive ? "ACTIVE" : "INACTIVE"} />
                    </div>
                    <button
                      onClick={() => router.push(`/admin/categories/${child.id}`)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border border-red-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                Delete this category
              </button>
            ) : (
              <div className="space-y-3">
                {hasChildren ? (
                  <p className="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    Cannot delete: has {original.children.length} subcategorie(s). Remove them first.
                  </p>
                ) : productCount > 0 ? (
                  <>
                    <p className="text-sm text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      This category has {productCount} product(s). Reassign them to delete.
                    </p>
                    <select
                      value={reassignTarget}
                      onChange={(e) => setReassignTarget(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                    >
                      <option value="">Select target category...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <p className="text-sm text-slate-600">
                    This will permanently delete the category. This cannot be undone.
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting || hasChildren || (productCount > 0 && !reassignTarget)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                  <button
                    onClick={() => { setShowDelete(false); setReassignTarget(""); }}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
