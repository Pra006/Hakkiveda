"use client";

import { Suspense, use, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import ProductForm from "@/components/admin/products/ProductForm";
import VariantManager from "@/components/admin/products/VariantManager";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

const TABS = [
  { key: "general",  label: "General",  icon: "info" },
  { key: "variants", label: "Variants", icon: "style" },
  { key: "pricing",  label: "Pricing",  icon: "payments" },
];

export default function EditProductPage({ params }) {
  return (
    <Suspense fallback={<div className="h-64 bg-slate-100 rounded-xl animate-pulse" />}>
      <EditProduct params={params} />
    </Suspense>
  );
}

function EditProduct({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const [notice, setNotice] = useState(
    searchParams.get("created") ? { type: "success", text: "Product created" } : null
  );

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/products/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Product not found");
      setProduct(json);
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleUpdate(payload) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Could not save the product");
    setProduct((p) => ({ ...p, ...json }));
    setNotice({ type: "success", text: "Changes saved" });
    toast.success("Product updated successfully");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${product.name}"?\n\nIf it appears in any order it will be deactivated instead.`)) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setNotice({ type: "error", text: json.error || "Delete failed" });
      toast.error(json.error || "Failed to delete product");
      return;
    }
    toast.success("Product deleted");
    router.push("/admin/products");
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <AdminPageHeader title="Product" />
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {notice?.text || "Product not found"}
        </div>
        <Link href="/admin/products" className="inline-block mt-4 text-sm text-blue-600">← Back to products</Link>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title={product.name} description={`Slug: ${product.slug}`}>
        <AdminStatusBadge status={product.isActive ? "ACTIVE" : "INACTIVE"} />
        <Link
          href={`/products/${product.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50"
        >
          <Icon name="open_in_new" size={16} /> View in store
        </Link>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50"
        >
          <Icon name="delete" size={16} /> Delete
        </button>
      </AdminPageHeader>

      {notice && (
        <div
          className={`mb-4 flex items-start justify-between gap-3 px-4 py-3 rounded-lg border text-sm ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <Icon name={notice.type === "success" ? "check_circle" : "error"} size={18} />
            {notice.text}
          </span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {/* ── Tab Navigation ─────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Icon name={tab.icon} size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────── */}
      {activeTab === "variants" ? (
        <VariantManager productId={id} onStockChange={reload} />
      ) : (
        <ProductForm
          initial={{
            name: product.name,
            slug: product.slug,
            sku: product.sku ?? "",
            brand: product.brand ?? "",
            description: product.description ?? "",
            retailPrice: product.retailPrice,
            compareAt: product.compareAt ?? "",
            stock: product.stock,
            moq: product.moq,
            categoryId: product.categoryId ?? "",
            images: product.images ?? [],
            isActive: product.isActive,
            isB2B: product.isB2B,
            isNewArrival: product.isNewArrival ?? false,
            b2bMinOrderQty: product.b2bMinOrderQty ?? "",
          }}
          hasVariants={(product.variantCount ?? 0) > 0}
          onSubmit={handleUpdate}
          submitLabel="Save changes"
          busyLabel="Saving\u2026"
          visibleSections={
            activeTab === "general" ? ["details", "images"] : ["pricing"]
          }
        />
      )}
    </div>
  );
}
