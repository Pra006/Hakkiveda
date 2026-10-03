"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/Icon";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { toast } from "react-toastify";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const EMPTY_FORM = {
  title: "",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
  category: "",
  displayOrder: 0,
  isActive: true,
};

/* ─── Upload Field ────────────────────────────────────────────────────── */

function UploadField({ label, accept, type, currentUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(10);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      setProgress(30);
      const res = await fetch("/api/upload/video-ritual-media", {
        method: "POST",
        body: formData,
      });
      setProgress(80);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Upload failed");
        return;
      }
      setProgress(100);
      onUploaded(data.url);
      toast.success(`${label} uploaded`);
    } catch {
      toast.error("Upload failed — network error");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {currentUrl && (
        <div className="mb-2 text-xs text-slate-500 truncate max-w-full" title={currentUrl}>
          Current: {currentUrl.split("/").pop()}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        disabled={uploading}
        className="block w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-50"
      />
      {uploading && (
        <div className="mt-1.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Video Form Modal ────────────────────────────────────────────────── */

function VideoFormModal({ video, onClose, onSaved }) {
  const isEdit = !!video?.id;
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          title: video.title || "",
          description: video.description || "",
          videoUrl: video.videoUrl || "",
          thumbnailUrl: video.thumbnailUrl || "",
          category: video.category || "",
          displayOrder: video.displayOrder ?? 0,
          isActive: video.isActive ?? true,
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.videoUrl.trim()) errs.videoUrl = "Video is required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        videoUrl: form.videoUrl.trim(),
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        category: form.category.trim() || null,
        displayOrder: parseInt(form.displayOrder, 10) || 0,
        isActive: form.isActive,
      };

      const url = isEdit
        ? `/api/admin/video-rituals/${video.id}`
        : "/api/admin/video-rituals";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }

      toast.success(isEdit ? "Video updated" : "Video created");
      onSaved();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h2 className="text-lg font-bold text-slate-900">
            {isEdit ? "Edit Video Ritual" : "Add Video Ritual"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <Icon name="close" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${errors.title ? "border-red-400" : "border-slate-300"}`}
              placeholder="e.g. Morning Hair Oil Ritual"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
              placeholder="Optional description..."
            />
          </div>

          {/* Video Upload */}
          <div>
            <UploadField
              label="Video *"
              accept="video/mp4,video/webm,video/quicktime"
              type="video"
              currentUrl={form.videoUrl}
              onUploaded={(url) => set("videoUrl", url)}
            />
            {form.videoUrl && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Icon name="check_circle" size={14} /> Video uploaded
              </p>
            )}
            {errors.videoUrl && <p className="text-xs text-red-500 mt-1">{errors.videoUrl}</p>}
          </div>

          {/* Thumbnail Upload */}
          <UploadField
            label="Thumbnail"
            accept="image/jpeg,image/png,image/webp"
            type="thumbnail"
            currentUrl={form.thumbnailUrl}
            onUploaded={(url) => set("thumbnailUrl", url)}
          />

          {/* Category & Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                placeholder="e.g. Hair Care"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) => set("displayOrder", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                min={0}
              />
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? "bg-green-500" : "bg-slate-300"}`}
              onClick={() => set("isActive", !form.isActive)}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </div>
            <span className="text-sm text-slate-700">{form.isActive ? "Active" : "Inactive"}</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Preview Modal ───────────────────────────────────────────────────── */

function PreviewModal({ video, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-black rounded-xl shadow-xl w-full max-w-3xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white/80 hover:text-white bg-black/40 rounded-full p-1"
        >
          <Icon name="close" size={22} />
        </button>
        <div className="p-4">
          <h3 className="text-white font-medium mb-3 truncate">{video.title}</h3>
          <video
            src={video.videoUrl}
            poster={video.thumbnailUrl || undefined}
            controls
            autoPlay
            className="w-full rounded-lg max-h-[70vh] bg-black"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Delete Confirm Modal ────────────────────────────────────────────── */

function DeleteModal({ video, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Video?</h3>
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to delete <strong>{video.title}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */

export default function VideoRitualsAdmin() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editVideo, setEditVideo] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/video-rituals?${params}`);
      const json = await res.json();
      setVideos(json.data || []);
    } catch {
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  async function toggleStatus(video) {
    try {
      const res = await fetch(`/api/admin/video-rituals/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !video.isActive }),
      });
      if (!res.ok) {
        toast.error("Failed to update status");
        return;
      }
      toast.success(video.isActive ? "Video deactivated" : "Video activated");
      fetchVideos();
    } catch {
      toast.error("Network error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/video-rituals/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("Video deleted");
      setDeleteTarget(null);
      fetchVideos();
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(video) {
    setEditVideo(video);
    setFormOpen(true);
  }

  function openAdd() {
    setEditVideo(null);
    setFormOpen(true);
  }

  function handleSaved() {
    setFormOpen(false);
    setEditVideo(null);
    fetchVideos();
  }

  return (
    <>
      <AdminPageHeader title="Video Rituals" description="Manage homepage video ritual content.">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
        >
          <Icon name="add" size={18} />
          Add Video
        </button>
      </AdminPageHeader>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full" />
          <p className="text-sm text-slate-500 mt-3">Loading videos...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Icon name="videocam_off" size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            {search ? "No videos match your search." : "No videos yet. Add your first video ritual."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Video</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Order</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {videos.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div
                        className="w-16 h-20 rounded-lg bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center"
                        onClick={() => setPreviewVideo(v)}
                      >
                        {v.thumbnailUrl ? (
                          <img
                            src={v.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon name="videocam" size={24} className="text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 max-w-[200px] truncate">{v.title}</p>
                      {v.description && (
                        <p className="text-xs text-slate-400 max-w-[200px] truncate mt-0.5">{v.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{v.category || "—"}</td>
                    <td className="px-4 py-3 text-center font-mono text-slate-600">{v.displayOrder}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleStatus(v)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          v.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${v.isActive ? "bg-green-500" : "bg-slate-400"}`} />
                        {v.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(v.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewVideo(v)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Preview"
                        >
                          <Icon name="play_circle" size={18} />
                        </button>
                        <button
                          onClick={() => openEdit(v)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                          title="Edit"
                        >
                          <Icon name="edit" size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(v)}
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
        </div>
      )}

      {/* Modals */}
      {formOpen && (
        <VideoFormModal
          video={editVideo}
          onClose={() => {
            setFormOpen(false);
            setEditVideo(null);
          }}
          onSaved={handleSaved}
        />
      )}
      {previewVideo && (
        <PreviewModal video={previewVideo} onClose={() => setPreviewVideo(null)} />
      )}
      {deleteTarget && (
        <DeleteModal
          video={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </>
  );
}
