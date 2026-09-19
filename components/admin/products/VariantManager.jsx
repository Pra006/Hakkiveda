"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

const input =
  "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none";

const blank = { name: "", sku: "", price: "", compareAt: "", stock: 0, isActive: true, images: [] };

function VariantRow({ variant, onSave, onDelete, busy }) {
  const [draft, setDraft] = useState({
    name: variant.name,
    sku: variant.sku ?? "",
    price: variant.price,
    compareAt: variant.compareAt ?? "",
    stock: variant.stock,
    isActive: variant.isActive,
  });
  const [dirty, setDirty] = useState(false);

  const set = (field, value) => {
    setDraft((d) => ({ ...d, [field]: value }));
    setDirty(true);
  };

  return (
    <tr className={variant.isActive ? "" : "bg-slate-50/70"}>
      <td className="px-2 py-2">
        <input className={input} value={draft.name} onChange={(e) => set("name", e.target.value)} />
      </td>
      <td className="px-2 py-2">
        <input className={input} value={draft.sku} placeholder="—" onChange={(e) => set("sku", e.target.value)} />
      </td>
      <td className="px-2 py-2 w-28">
        <input type="number" min="0" step="0.01" className={input} value={draft.price} onChange={(e) => set("price", e.target.value)} />
      </td>
      <td className="px-2 py-2 w-28">
        <input type="number" min="0" step="0.01" className={input} value={draft.compareAt} placeholder="—" onChange={(e) => set("compareAt", e.target.value)} />
      </td>
      <td className="px-2 py-2 w-24">
        <input type="number" min="0" step="1" className={input} value={draft.stock} onChange={(e) => set("stock", e.target.value)} />
      </td>
      <td className="px-2 py-2 text-center">
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          aria-label="Option active"
        />
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!dirty || busy}
            onClick={async () => {
              await onSave(variant.id, {
                ...draft,
                sku: draft.sku.trim() || null,
                compareAt: draft.compareAt === "" ? null : draft.compareAt,
              });
              setDirty(false);
            }}
            className="px-2.5 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white disabled:opacity-30"
          >
            Save
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(variant)}
            className="p-1.5 rounded hover:bg-red-50 text-red-500 disabled:opacity-40"
            aria-label="Delete option"
          >
            <Icon name="delete" size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/**
 * Per-product option management: each row is a ProductVariant carrying its own
 * price, SKU, stock and status.
 */
export default function VariantManager({ productId, onStockChange }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(blank);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/products/${productId}/variants`);
    const json = await res.json();
    if (res.ok) setVariants(json.variants);
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/products/${productId}/variants`)
      .then((res) => (res.ok ? res.json() : { variants: [] }))
      .catch(() => ({ variants: [] }))
      .then((json) => {
        if (!active) return;
        setVariants(json.variants || []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productId]);

  async function call(url, method, body) {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      await load();
      onStockChange?.();
      return json;
    } catch (err) {
      setNotice({ type: "error", text: err.message });
      toast.error(err.message || "Operation failed");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  const save = async (variantId, data) => {
    await call(`/api/admin/products/${productId}/variants/${variantId}`, "PATCH", data);
    setNotice({ type: "success", text: "Option saved" });
    toast.success("Variant saved");
  };

  const remove = async (variant) => {
    if (!window.confirm(`Delete option “${variant.name}”?\n\nIf it appears in an order it will be deactivated instead.`)) return;
    const res = await call(`/api/admin/products/${productId}/variants/${variant.id}`, "DELETE");
    setNotice({ type: "success", text: res.message });
  };

  const add = async (e) => {
    e.preventDefault();
    try {
      await call(`/api/admin/products/${productId}/variants`, "POST", {
        ...draft,
        sku: draft.sku.trim() || null,
        compareAt: draft.compareAt === "" ? null : draft.compareAt,
      });
      setDraft(blank);
      setAdding(false);
      setNotice({ type: "success", text: "Option added" });
    } catch {
      /* surfaced in notice */
    }
  };

  const totalStock = variants.reduce((s, v) => s + v.stock, 0);

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-slate-900">Options &amp; variants</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {variants.length === 0
              ? "No options — this product is sold at its own price and stock."
              : `${variants.length} option${variants.length === 1 ? "" : "s"} · ${totalStock} units in total, which becomes the product's stock.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          <Icon name={adding ? "close" : "add"} size={16} /> {adding ? "Cancel" : "Add option"}
        </button>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <Icon name={notice.type === "success" ? "check_circle" : "error"} size={16} />
          {notice.text}
        </div>
      )}

      {adding && (
        <div className="grid sm:grid-cols-5 gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <input className={input} placeholder="Name (e.g. 500ml)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className={input} placeholder="SKU (optional)" value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
          <input className={input} type="number" min="0" step="0.01" placeholder="Price" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
          <input className={input} type="number" min="0" step="0.01" placeholder="Compare-at" value={draft.compareAt} onChange={(e) => setDraft({ ...draft, compareAt: e.target.value })} />
          <div className="flex gap-2">
            <input className={input} type="number" min="0" step="1" placeholder="Stock" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} />
            <button type="button" onClick={add} disabled={busy}
              className="shrink-0 px-3 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white disabled:opacity-50">
              Add
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-20 bg-slate-50 rounded animate-pulse" />
      ) : variants.length === 0 ? (
        <p className="text-sm text-slate-400">
          Add an option to sell this product in several sizes, weights or finishes. Each option carries its own price, SKU and stock.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="px-2 py-2 font-semibold">Name</th>
                <th className="px-2 py-2 font-semibold">SKU</th>
                <th className="px-2 py-2 font-semibold">Price</th>
                <th className="px-2 py-2 font-semibold">Compare-at</th>
                <th className="px-2 py-2 font-semibold">Stock</th>
                <th className="px-2 py-2 font-semibold text-center">Active</th>
                <th className="px-2 py-2 font-semibold w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {variants.map((v) => (
                <VariantRow key={v.id} variant={v} onSave={save} onDelete={remove} busy={busy} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
