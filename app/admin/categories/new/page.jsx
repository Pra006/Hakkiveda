"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

export default function NewCategoryPage() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    image: "",
    isActive: true,
  });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        const all = data.data || data || [];
        // Only root categories can be parents (max 2 levels)
        setCategories(all.filter((c) => !c.parentId));
      })
      .catch(() => {});
  }, []);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const generateSlug = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleName = (name) => {
    update("name", name);
    if (!slugEdited) update("slug", generateSlug(name));
  };

  const handleSlugChange = (slug) => {
    setSlugEdited(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Category name is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || null,
          parentId: form.parentId || null,
          image: form.image || null,
          isActive: form.isActive,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Create failed");
      }
      toast.success("Category created!");
      router.push("/admin/categories");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="New Category" description="Create a new product category">
        <button
          onClick={() => router.push("/admin/categories")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <Icon name="arrow_back" size={16} /> Back
        </button>
      </AdminPageHeader>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Category Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleName(e.target.value)}
                placeholder="e.g. Hair Care"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="hair-care"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none font-mono"
              />
              <p className="text-xs text-slate-400 mt-1">URL-friendly identifier. Auto-generated from name.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Brief description of this category..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none resize-vertical"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Parent Category</label>
              <select
                value={form.parentId}
                onChange={(e) => update("parentId", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none"
              >
                <option value="">None (Top Level)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
                    onClick={() => update("image", "")}
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
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Creating..." : "Create Category"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/categories")}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
