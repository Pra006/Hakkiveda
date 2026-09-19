"use client";

import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import { toast } from "react-toastify";

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toInputDate(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 16);
}

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  imageUrl: "",
  buttonText: "",
  buttonLink: "",
  badgeIcon: "",
  badgeLabel: "",
  isActive: true,
  startDate: "",
  endDate: "",
};

/* ─── Banner Form Modal ───────────────────────────────────────────────── */

function BannerFormModal({ banner, onClose, onSaved }) {
  const isEdit = !!banner?.id;
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          title: banner.title || "",
          subtitle: banner.subtitle || "",
          imageUrl: banner.imageUrl || "",
          buttonText: banner.buttonText || "",
          buttonLink: banner.buttonLink || "",
          badgeIcon: banner.badgeIcon || "",
          badgeLabel: banner.badgeLabel || "",
          isActive: banner.isActive ?? true,
          startDate: toInputDate(banner.startDate),
          endDate: toInputDate(banner.endDate),
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
    if (!form.imageUrl.trim()) errs.imageUrl = "Image URL is required";
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
      errs.endDate = "End date must be after start date";
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        imageUrl: form.imageUrl.trim(),
        buttonText: form.buttonText.trim() || null,
        buttonLink: form.buttonLink.trim() || null,
        badgeIcon: form.badgeIcon.trim() || null,
        badgeLabel: form.badgeLabel.trim() || null,
        isActive: form.isActive,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      const url = isEdit
        ? `/api/admin/hero-banners/${banner.id}`
        : "/api/admin/hero-banners";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save banner");
        return;
      }

      toast.success(isEdit ? "Banner updated" : "Banner created");
      onSaved();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit Banner" : "New Banner"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <Icon name="close" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image preview */}
          {form.imageUrl && (
            <div className="rounded-lg overflow-hidden border border-slate-200 h-40 bg-slate-50">
              <img
                src={form.imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          )}

          {/* Image URL */}
          <Field label="Image URL" required error={errors.imageUrl}>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className={fieldClass(errors.imageUrl)}
            />
          </Field>

          {/* Title */}
          <Field label="Title" required error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ancient Wisdom. Rooted in Nature."
              className={fieldClass(errors.title)}
            />
          </Field>

          {/* Subtitle */}
          <Field label="Subtitle / Description">
            <textarea
              value={form.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              rows={3}
              placeholder="A longer description shown beneath the title..."
              className={fieldClass()}
            />
          </Field>

          {/* Button text + link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Button Text">
              <input
                type="text"
                value={form.buttonText}
                onChange={(e) => set("buttonText", e.target.value)}
                placeholder="Shop Now"
                className={fieldClass()}
              />
            </Field>
            <Field label="Button Link">
              <input
                type="text"
                value={form.buttonLink}
                onChange={(e) => set("buttonLink", e.target.value)}
                placeholder="/shop"
                className={fieldClass()}
              />
            </Field>
          </div>

          {/* Badge icon + label */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Badge Icon" hint="Material Symbols name">
              <div className="relative">
                <input
                  type="text"
                  value={form.badgeIcon}
                  onChange={(e) => set("badgeIcon", e.target.value)}
                  placeholder="spa"
                  className={fieldClass()}
                />
                {form.badgeIcon && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Icon name={form.badgeIcon} size={18} className="text-slate-400" />
                  </span>
                )}
              </div>
            </Field>
            <Field label="Badge Label">
              <input
                type="text"
                value={form.badgeLabel}
                onChange={(e) => set("badgeLabel", e.target.value)}
                placeholder="Ayurvedic Wellness"
                className={fieldClass()}
              />
            </Field>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Start Date" hint="Optional — leave blank for immediate">
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className={fieldClass()}
              />
            </Field>
            <Field label="End Date" hint="Optional — leave blank for no expiry" error={errors.endDate}>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className={fieldClass(errors.endDate)}
              />
            </Field>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => set("isActive", !form.isActive)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                form.isActive ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.isActive ? "translate-x-4" : ""
                }`}
              />
            </button>
            <span className="text-sm text-slate-700">
              {form.isActive ? "Active — visible on storefront" : "Inactive — hidden from storefront"}
            </span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {saving && <Icon name="progress_activity" size={16} className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create Banner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Form field components ───────────────────────────────────────────── */

function Field({ label, required, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="text-slate-400 font-normal ml-1">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function fieldClass(error) {
  return `w-full text-sm border rounded-lg px-3 py-2 outline-none transition ${
    error
      ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-200"
      : "border-slate-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
  }`;
}

/* ─── Delete Confirmation Modal ───────────────────────────────────────── */

function DeleteConfirmModal({ banner, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/hero-banners/${banner.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
        return;
      }
      toast.success("Banner deleted");
      onDeleted();
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Icon name="delete" size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Delete Banner</h3>
            <p className="text-sm text-slate-500">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to delete <strong>{banner.title}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════════ */

export default function HeroBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(null); // null | {} (new) | banner (edit)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/hero-banners");
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch {
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  /* ── Toggle active ── */
  async function toggleActive(banner) {
    try {
      const res = await fetch(`/api/admin/hero-banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, isActive: !b.isActive } : b))
        );
        toast.success(banner.isActive ? "Banner deactivated" : "Banner activated");
      }
    } catch {
      toast.error("Failed to update status");
    }
  }

  /* ── Drag-to-reorder ── */
  function handleDragStart(idx) {
    setDragIdx(idx);
  }

  function handleDragOver(e, idx) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...banners];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    setBanners(updated);
    setDragIdx(idx);
  }

  async function handleDragEnd() {
    if (dragIdx === null) return;
    setDragIdx(null);
    setReordering(true);
    try {
      const orderedIds = banners.map((b) => b.id);
      const res = await fetch("/api/admin/hero-banners/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (res.ok) {
        toast.success("Order saved");
      } else {
        toast.error("Failed to save order");
        fetchBanners();
      }
    } catch {
      toast.error("Network error");
      fetchBanners();
    } finally {
      setReordering(false);
    }
  }

  /* ── Move up/down (keyboard-friendly reorder) ── */
  async function moveBanner(idx, direction) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= banners.length) return;
    const updated = [...banners];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setBanners(updated);

    setReordering(true);
    try {
      const orderedIds = updated.map((b) => b.id);
      await fetch("/api/admin/hero-banners/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
    } catch {
      fetchBanners();
    } finally {
      setReordering(false);
    }
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div>
        <AdminPageHeader title="Hero Banners" description="Manage storefront hero carousel" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <div>
      <AdminPageHeader title="Hero Banners" description="Manage storefront hero carousel">
        <button
          onClick={() => setShowForm({})}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <Icon name="add" size={18} />
          Add Banner
        </button>
      </AdminPageHeader>

      {/* Summary */}
      <div className="flex items-center gap-4 mb-5">
        <span className="text-sm text-slate-500">
          {banners.length} banner{banners.length !== 1 ? "s" : ""} total
        </span>
        <span className="text-sm text-emerald-600 font-medium">
          {activeCount} active
        </span>
        {reordering && (
          <span className="text-xs text-blue-500 flex items-center gap-1">
            <Icon name="sync" size={14} className="animate-spin" />
            Saving order...
          </span>
        )}
      </div>

      {/* Empty state */}
      {banners.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Icon name="view_carousel" size={48} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 mb-1">No banners yet</h3>
          <p className="text-sm text-slate-500 mb-4">
            Create your first hero banner to display on the storefront carousel.
          </p>
          <button
            onClick={() => setShowForm({})}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Icon name="add" size={18} />
            Add Banner
          </button>
        </div>
      )}

      {/* Banner list */}
      {banners.length > 0 && (
        <div className="space-y-3">
          {banners.map((banner, idx) => {
            const isScheduled = banner.startDate || banner.endDate;
            const now = new Date();
            const withinSchedule =
              (!banner.startDate || new Date(banner.startDate) <= now) &&
              (!banner.endDate || new Date(banner.endDate) >= now);

            return (
              <div
                key={banner.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-xl border transition group ${
                  dragIdx === idx
                    ? "border-blue-300 shadow-md"
                    : "border-slate-200 hover:shadow-sm"
                } ${!banner.isActive ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Drag handle */}
                  <div className="flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                    <Icon name="drag_indicator" size={20} />
                  </div>

                  {/* Thumbnail */}
                  <div className="w-20 h-14 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                    {banner.imageUrl ? (
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="image" size={20} className="text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {banner.title}
                      </h3>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${
                          banner.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {banner.isActive ? "Active" : "Inactive"}
                      </span>
                      {isScheduled && (
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${
                            withinSchedule
                              ? "bg-blue-50 text-blue-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {withinSchedule ? "Scheduled (live)" : "Scheduled (not live)"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {banner.subtitle || "No description"}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                      {banner.buttonText && (
                        <span className="flex items-center gap-1">
                          <Icon name="link" size={12} />
                          {banner.buttonText} → {banner.buttonLink || "/"}
                        </span>
                      )}
                      {isScheduled && (
                        <span className="flex items-center gap-1">
                          <Icon name="schedule" size={12} />
                          {formatDate(banner.startDate)} — {formatDate(banner.endDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Move up/down */}
                    <button
                      onClick={() => moveBanner(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Move up"
                    >
                      <Icon name="arrow_upward" size={16} />
                    </button>
                    <button
                      onClick={() => moveBanner(idx, 1)}
                      disabled={idx === banners.length - 1}
                      className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Move down"
                    >
                      <Icon name="arrow_downward" size={16} />
                    </button>

                    {/* Toggle active */}
                    <button
                      onClick={() => toggleActive(banner)}
                      className={`p-1.5 transition ${
                        banner.isActive
                          ? "text-emerald-500 hover:text-emerald-700"
                          : "text-slate-400 hover:text-emerald-500"
                      }`}
                      title={banner.isActive ? "Deactivate" : "Activate"}
                    >
                      <Icon
                        name={banner.isActive ? "visibility" : "visibility_off"}
                        size={16}
                      />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => setShowForm(banner)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                      title="Edit"
                    >
                      <Icon name="edit" size={16} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteTarget(banner)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hint */}
      {banners.length > 1 && (
        <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5">
          <Icon name="info" size={14} />
          Drag rows or use the arrows to reorder. Changes save automatically.
        </p>
      )}

      {/* Modals */}
      {showForm && (
        <BannerFormModal
          banner={showForm.id ? showForm : null}
          onClose={() => setShowForm(null)}
          onSaved={() => {
            setShowForm(null);
            fetchBanners();
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          banner={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            fetchBanners();
          }}
        />
      )}
    </div>
  );
}
