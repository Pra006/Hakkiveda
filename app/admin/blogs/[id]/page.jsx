"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import Link from "next/link";

export default function EditBlogPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/blogs/${id}`)
      .then((r) => r.json())
      .then((blog) => {
        if (blog.error) throw new Error(blog.error);
        setForm({
          title: blog.title || "",
          slug: blog.slug || "",
          excerpt: blog.excerpt || "",
          content: blog.content || "",
          featuredImage: blog.featuredImage || "",
          category: blog.category || "",
          author: blog.author || "",
          tags: (blog.tags || []).join(", "),
          status: blog.status || "DRAFT",
          publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString().slice(0, 16) : "",
          _original: blog,
        });
      })
      .catch(() => toast.error("Failed to load blog post"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !form) {
    return (
      <>
        <AdminPageHeader title="Edit Blog Post" />
        <div className="space-y-4">
          <div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
          <div className="h-96 bg-white rounded-xl border border-slate-200 animate-pulse" />
        </div>
      </>
    );
  }

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/blog-images", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      set("featuredImage", data.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (statusOverride) => {
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        featuredImage: form.featuredImage,
        category: form.category,
        author: form.author,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        status: statusOverride || form.status,
        publishedAt: form.publishedAt || null,
      };

      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success(`Blog post ${statusOverride === "PUBLISHED" ? "published" : "updated"}`);
      router.push("/admin/blogs");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteBlog = async () => {
    if (!confirm("Delete this blog post permanently?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      toast.success("Blog post deleted");
      router.push("/admin/blogs");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminPageHeader title="Edit Blog Post" description={form._original?.title}>
        <div className="flex items-center gap-2">
          <AdminStatusBadge status={form._original?.status} />
          <Link href="/admin/blogs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <Icon name="arrow_back" size={16} /> Back
          </Link>
        </div>
      </AdminPageHeader>

      {preview ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 lg:p-10 max-w-3xl">
          <button onClick={() => setPreview(false)} className="text-sm text-blue-600 hover:underline mb-4 flex items-center gap-1">
            <Icon name="arrow_back" size={16} /> Back to editor
          </button>
          {form.featuredImage && (
            <img src={form.featuredImage} alt="" className="w-full h-64 object-cover rounded-lg mb-6" />
          )}
          <div className="space-y-2 mb-6">
            {form.category && <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">{form.category}</span>}
            <h1 className="text-3xl font-bold text-slate-900">{form.title || "Untitled"}</h1>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              {form.author && <span>By {form.author}</span>}
              {form.publishedAt && <span>{new Date(form.publishedAt).toLocaleDateString()}</span>}
            </div>
          </div>
          {form.excerpt && <p className="text-lg text-slate-600 italic border-l-4 border-slate-200 pl-4 mb-6">{form.excerpt}</p>}
          <div className="prose prose-slate max-w-none whitespace-pre-wrap">{form.content || "No content yet."}</div>
          {form.tags && (
            <div className="mt-6 flex flex-wrap gap-2">
              {form.tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{tag}</span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Title *</label>
                <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Slug</label>
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <span>/blogs/</span><span className="text-slate-600">{form.slug || "..."}</span>
                </div>
                <input type="text" value={form.slug} onChange={(e) => set("slug", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Excerpt</label>
                <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2}
                  placeholder="Short description shown on blog listing..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Content</label>
              <textarea value={form.content} onChange={(e) => set("content", e.target.value)} rows={16}
                placeholder="Write your blog content here..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono" />
            </div>
          </div>

          <div className="space-y-5">
            {/* Publish controls */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Publish</h3>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Publish Date</label>
                <input type="datetime-local" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => submit("DRAFT")} disabled={saving}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50">
                  Save Draft
                </button>
                <button onClick={() => submit("PUBLISHED")} disabled={saving}
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Publish"}
                </button>
              </div>
              <button onClick={() => setPreview(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                <Icon name="visibility" size={16} /> Preview
              </button>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Featured Image</h3>
              {form.featuredImage ? (
                <div className="relative">
                  <img src={form.featuredImage} alt="" className="w-full h-40 object-cover rounded-lg border border-slate-200" />
                  <button onClick={() => set("featuredImage", "")}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700">
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                  <Icon name={uploading ? "hourglass_empty" : "cloud_upload"} size={24} className="text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500">{uploading ? "Uploading..." : "Click to upload"}</span>
                  <input type="file" accept="image/*" onChange={uploadImage} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>

            {/* Meta */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Details</h3>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Category</label>
                <input type="text" value={form.category} onChange={(e) => set("category", e.target.value)}
                  placeholder="e.g. Ayurveda, Culture, Recipes"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Author</label>
                <input type="text" value={form.author} onChange={(e) => set("author", e.target.value)}
                  placeholder="Author name"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Tags</label>
                <input type="text" value={form.tags} onChange={(e) => set("tags", e.target.value)}
                  placeholder="Comma-separated tags"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                <p className="text-[11px] text-slate-400 mt-0.5">Separate with commas</p>
              </div>
            </div>

            {/* Danger zone */}
            <div className="bg-white rounded-xl border border-red-200 p-5">
              <h3 className="text-sm font-bold text-red-700 mb-2">Danger Zone</h3>
              <button onClick={deleteBlog} disabled={saving}
                className="w-full px-3 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
                <Icon name="delete" size={16} className="inline mr-1" />
                Delete this post
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
