"use client";

import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import { toast } from "react-toastify";

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function toInputDateTime(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 16);
}

function promoStatus(promo) {
  const now = Date.now();
  if (!promo.isActive) return "INACTIVE";
  if (new Date(promo.endDate).getTime() < now) return "EXPIRED";
  if (new Date(promo.startDate).getTime() > now) return "SCHEDULED";
  return "LIVE";
}

const control = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100";

/* ─── Product Search & Selector ───────────────────────────────────────── */

function ProductSelector({ selected, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch(q) {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}&status=active&limit=10`);
      const json = await res.json();
      setResults((json.data || []).filter((p) => !selected.some((s) => s.productId === p.id)));
    } catch { setResults([]); }
    finally { setSearching(false); }
  }

  function addProduct(product) {
    if (selected.length >= 3) { toast.warning("Exactly 3 products required — remove one first"); return; }
    const next = [...selected, { productId: product.id, displayOrder: selected.length, product }];
    onChange(next);
    setQuery("");
    setResults([]);
  }

  function removeProduct(productId) {
    const next = selected.filter((s) => s.productId !== productId)
      .map((s, i) => ({ ...s, displayOrder: i }));
    onChange(next);
  }

  function moveProduct(idx, dir) {
    const next = [...selected];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next.map((s, i) => ({ ...s, displayOrder: i })));
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Products ({selected.length}/3)
      </label>

      {/* Selected products */}
      <div className="space-y-2 mb-3">
        {selected.map((item, idx) => (
          <div key={item.productId} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="w-6 h-6 rounded bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
              {idx + 1}
            </span>
            {item.product?.images?.[0] ? (
              <img src={item.product.images[0]} alt="" className="w-10 h-10 rounded object-cover bg-slate-100 shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center shrink-0">
                <Icon name="inventory_2" size={16} className="text-slate-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{item.product?.name}</p>
              <p className="text-xs text-slate-500">
                Rs {Number(item.product?.retailPrice || 0).toLocaleString()}
                {item.product?.compareAt > item.product?.retailPrice && (
                  <span className="ml-1 line-through text-slate-400">Rs {Number(item.product.compareAt).toLocaleString()}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => moveProduct(idx, -1)} disabled={idx === 0}
                className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30" title="Move up">
                <Icon name="arrow_upward" size={16} />
              </button>
              <button onClick={() => moveProduct(idx, 1)} disabled={idx === selected.length - 1}
                className="p-1 rounded hover:bg-slate-200 text-slate-500 disabled:opacity-30" title="Move down">
                <Icon name="arrow_downward" size={16} />
              </button>
              <button onClick={() => removeProduct(item.productId)}
                className="p-1 rounded hover:bg-red-50 text-red-500" title="Remove">
                <Icon name="close" size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Search input */}
      {selected.length < 3 && (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search products by name or SKU…"
            className={control}
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Icon name="progress_activity" size={16} className="text-slate-400 animate-spin" />
            </div>
          )}
          {results.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-left"
                >
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" className="w-8 h-8 rounded object-cover bg-slate-100 shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon name="inventory_2" size={14} className="text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.sku || p.brand || "—"} · Rs {Number(p.retailPrice).toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Promotion Form Modal ────────────────────────────────────────────── */

function PromotionFormModal({ promotion, onClose, onSaved }) {
  const isEdit = !!promotion?.id;
  const [form, setForm] = useState(() =>
    isEdit
      ? {
          title: promotion.title || "",
          subtitle: promotion.subtitle || "",
          bannerImage: promotion.bannerImage || "",
          isActive: promotion.isActive ?? false,
          startDate: toInputDateTime(promotion.startDate),
          endDate: toInputDateTime(promotion.endDate),
        }
      : { title: "", subtitle: "", bannerImage: "", isActive: false, startDate: "", endDate: "" }
  );
  const [products, setProducts] = useState(() =>
    isEdit
      ? (promotion.products || []).map((pp) => ({
          productId: pp.product?.id || pp.productId,
          displayOrder: pp.displayOrder,
          product: pp.product,
        }))
      : []
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.startDate) errs.startDate = "Start date is required";
    if (!form.endDate) errs.endDate = "End date is required";
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
      errs.endDate = "End date must be after start date";
    }
    if (products.length !== 3) errs.products = "Exactly 3 products are required";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      // Step 1: Create or update the promotion
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        bannerImage: form.bannerImage.trim() || null,
        isActive: form.isActive,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      };

      const url = isEdit ? `/api/admin/promotions/${promotion.id}` : "/api/admin/promotions";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save promotion");

      const promoId = json.id;

      // Step 2: Set the products
      const prodRes = await fetch(`/api/admin/promotions/${promoId}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: products.map((p, i) => ({ productId: p.productId, displayOrder: i })),
        }),
      });
      const prodJson = await prodRes.json();
      if (!prodRes.ok) throw new Error(prodJson.error || "Failed to assign products");

      toast.success(isEdit ? "Promotion updated" : "Promotion created");
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Image upload
  const [uploading, setUploading] = useState(false);
  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload/product-images", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      set("bannerImage", json[0].url);
      toast.success("Banner image uploaded");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? "Edit Promotion" : "New Promotion"}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1">
              <Icon name={showPreview ? "edit" : "visibility"} size={16} />
              {showPreview ? "Edit" : "Preview"}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><Icon name="close" size={20} /></button>
          </div>
        </div>

        {showPreview ? (
          /* ── Preview ── */
          <div className="p-6">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50">
              {form.bannerImage && (
                <img src={form.bannerImage} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />
              )}
              <div className="text-center mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">Limited Time Offer</p>
                <h3 className="font-bold text-xl text-slate-900">{form.title || "Promotion Title"}</h3>
                {form.subtitle && <p className="text-sm text-slate-600 mt-1">{form.subtitle}</p>}
                <div className="flex justify-center gap-3 mt-3">
                  {["Days", "Hours", "Mins", "Secs"].map((u) => (
                    <div key={u} className="bg-white rounded-lg px-3 py-2 shadow-sm border border-amber-200/50 min-w-[56px]">
                      <div className="text-lg font-bold text-slate-900 tabular-nums">00</div>
                      <div className="text-[10px] text-slate-500 uppercase">{u}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(products.length > 0 ? products : [null, null, null]).map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="aspect-square bg-slate-100 flex items-center justify-center">
                      {item?.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="inventory_2" size={24} className="text-slate-300" />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{item?.product?.name || "Product " + (i + 1)}</p>
                      <p className="text-xs text-slate-500">
                        {item?.product ? `Rs ${Number(item.product.retailPrice).toLocaleString()}` : "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Monsoon Hair Care Sale" className={control} />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
              <input type="text" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)}
                placeholder="Optional tagline or description" className={control} />
            </div>

            {/* Banner image */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Banner Image</label>
              <div className="flex items-center gap-3">
                {form.bannerImage ? (
                  <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-slate-100">
                    <img src={form.bannerImage} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => set("bannerImage", "")}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                      <Icon name="close" size={12} />
                    </button>
                  </div>
                ) : null}
                <label className="cursor-pointer px-3 py-2 text-sm border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5">
                  <Icon name="upload" size={16} className="text-slate-500" />
                  <span className="text-slate-600">{uploading ? "Uploading…" : "Upload image"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                <input type="datetime-local" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={control} />
                {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                <input type="datetime-local" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className={control} />
                {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm font-medium text-slate-700">Active</span>
              <span className="text-xs text-slate-500">(publish to the storefront)</span>
            </label>

            {/* Products */}
            <ProductSelector selected={products} onChange={setProducts} />
            {errors.products && <p className="text-xs text-red-500">{errors.products}</p>}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                {saving ? "Saving…" : isEdit ? "Update Promotion" : "Create Promotion"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: "create" } | { mode: "edit", promotion }
  const [toggling, setToggling] = useState(null);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promotions?limit=50");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load promotions");
      setPromotions(json.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  async function handleToggleActive(promo) {
    setToggling(promo.id);
    try {
      const res = await fetch(`/api/admin/promotions/${promo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update");
      setPromotions((prev) => prev.map((p) => (p.id === promo.id ? { ...p, isActive: json.isActive } : p)));
      toast.success(json.isActive ? "Promotion activated" : "Promotion deactivated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete(promo) {
    if (!window.confirm(`Delete "${promo.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/promotions/${promo.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");
      toast.success("Promotion deleted");
      fetchPromotions();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <AdminPageHeader title="Sale Promotions" description="Manage limited-time offer banners on the homepage">
        <button
          onClick={() => setModal({ mode: "create" })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          <Icon name="add" size={16} /> New Promotion
        </button>
      </AdminPageHeader>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-xl">
          <Icon name="campaign" size={48} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No promotions yet</p>
          <button
            onClick={() => setModal({ mode: "create" })}
            className="mt-3 text-sm text-blue-600 font-medium hover:underline"
          >
            Create your first promotion
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {promotions.map((promo) => {
            const status = promoStatus(promo);
            return (
              <div key={promo.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{promo.title}</h3>
                    <AdminStatusBadge status={status} />
                  </div>
                  {promo.subtitle && <p className="text-xs text-slate-500 truncate mb-1">{promo.subtitle}</p>}
                  <p className="text-xs text-slate-500">
                    {formatDateTime(promo.startDate)} → {formatDateTime(promo.endDate)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {(promo.products || []).map((pp) => (
                      <div key={pp.product?.id || pp.id} className="flex items-center gap-1.5 bg-slate-50 rounded px-2 py-1">
                        {pp.product?.images?.[0] ? (
                          <img src={pp.product.images[0]} alt="" className="w-5 h-5 rounded object-cover" />
                        ) : (
                          <Icon name="inventory_2" size={12} className="text-slate-400" />
                        )}
                        <span className="text-[11px] text-slate-700 truncate max-w-[80px]">{pp.product?.name}</span>
                      </div>
                    ))}
                    {(promo.products || []).length === 0 && (
                      <span className="text-xs text-amber-600">No products assigned</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleActive(promo)}
                    disabled={toggling === promo.id}
                    className={`p-2 rounded-lg text-sm ${promo.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"}`}
                    title={promo.isActive ? "Deactivate" : "Activate"}
                  >
                    <Icon name={promo.isActive ? "toggle_on" : "toggle_off"} size={24} />
                  </button>
                  <button
                    onClick={() => setModal({ mode: "edit", promotion: promo })}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                    title="Edit"
                  >
                    <Icon name="edit" size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(promo)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                    title="Delete"
                  >
                    <Icon name="delete" size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <PromotionFormModal
          promotion={modal.mode === "edit" ? modal.promotion : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchPromotions(); }}
        />
      )}
    </div>
  );
}
