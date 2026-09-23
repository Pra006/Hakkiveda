"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchBlogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", page);
    params.set("limit", "20");

    fetch(`/api/admin/blogs?${params}`)
      .then((r) => r.json())
      .then((res) => {
        setBlogs(res.data || []);
        setPagination(res.pagination || null);
      })
      .catch(() => {
        setBlogs([]);
        toast.error("Failed to load blogs");
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter, page]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const toggleStatus = async (blog) => {
    setActionLoading(blog.id);
    try {
      const newStatus = blog.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      const res = await fetch(`/api/admin/blogs/${blog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update status");
      }
      toast.success(`"${blog.title}" ${newStatus === "PUBLISHED" ? "published" : "unpublished"}`);
      fetchBlogs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteBlog = async () => {
    if (!deleteModal) return;
    setActionLoading(deleteModal.id);
    try {
      const res = await fetch(`/api/admin/blogs/${deleteModal.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete");
      }
      toast.success(`"${deleteModal.title}" deleted`);
      setDeleteModal(null);
      fetchBlogs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <>
      <AdminPageHeader title="Blog Posts" description="Create and manage blog content">
        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
        >
          <Icon name="add" size={18} />
          New Post
        </Link>
      </AdminPageHeader>

      <div className="bg-white rounded-xl border border-slate-200">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
            <Icon name="search" size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search blogs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="article" size={48} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No blog posts found</p>
            <Link href="/admin/blogs/new" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Post</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Published</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {blog.featuredImage ? (
                          <img src={blog.featuredImage} alt="" className="w-12 h-9 rounded object-cover border border-slate-200" />
                        ) : (
                          <div className="w-12 h-9 rounded bg-slate-100 flex items-center justify-center">
                            <Icon name="image" size={16} className="text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link href={`/admin/blogs/${blog.id}`} className="font-medium text-slate-900 hover:text-blue-600 truncate block">
                            {blog.title}
                          </Link>
                          <div className="text-xs text-slate-400 truncate">/{blog.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                      {blog.category || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <AdminStatusBadge status={blog.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-500 text-xs">
                      {fmtDate(blog.publishedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleStatus(blog)}
                          disabled={actionLoading === blog.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            blog.status === "PUBLISHED"
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={blog.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        >
                          <Icon name={blog.status === "PUBLISHED" ? "unpublished" : "publish"} size={18} />
                        </button>
                        <Link
                          href={`/admin/blogs/${blog.id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Icon name="edit" size={18} />
                        </Link>
                        <button
                          onClick={() => setDeleteModal(blog)}
                          disabled={actionLoading === blog.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Icon name="delete" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {pagination.total} post{pagination.total !== 1 ? "s" : ""} · Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasMore}
                className="px-3 py-1.5 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteModal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Blog Post</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to permanently delete &ldquo;{deleteModal.title}&rdquo;? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteBlog}
                disabled={actionLoading === deleteModal.id}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === deleteModal.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
