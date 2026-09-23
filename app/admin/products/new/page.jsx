"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import ProductForm from "@/components/admin/products/ProductForm";
import VariantManager from "@/components/admin/products/VariantManager";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

const TABS = [
  { key: "general",  label: "General",  icon: "info" },
  { key: "variants", label: "Variants", icon: "style" },
  { key: "pricing",  label: "Pricing",  icon: "payments" },
];

export default function NewProductPage() {
  const router = useRouter();
  const formRef = useRef(null);

  const [activeTab, setActiveTab] = useState("general");
  const [productId, setProductId] = useState(null);
  const [saving, setSaving] = useState(false);

  /* ── Create or update the product via API ───────────────────────── */
  async function saveProduct(payload) {
    if (productId) {
      // Update existing
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save the product");
      return json;
    } else {
      // Create new
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not create the product");
      setProductId(json.id);
      return json;
    }
  }

  /* ── "Next" on General tab ──────────────────────────────────────── */
  async function handleGeneralNext() {
    if (!formRef.current) return;
    setSaving(true);
    try {
      const ok = await formRef.current.submit();
      if (ok) {
        toast.success(productId ? "Changes saved" : "Product created — now add variants if needed");
        setActiveTab("variants");
      }
    } finally {
      setSaving(false);
    }
  }

  /* ── "Next" on Variants tab ─────────────────────────────────────── */
  function handleVariantsNext() {
    setActiveTab("pricing");
  }

  /* ── "Create product" / "Save" on Pricing tab ───────────────────── */
  async function handlePricingSubmit() {
    if (!formRef.current) return;
    setSaving(true);
    try {
      const ok = await formRef.current.submit();
      if (ok) {
        toast.success("Product saved successfully!");
        router.push(`/admin/products/${productId}?created=1`);
      }
    } finally {
      setSaving(false);
    }
  }

  /* ── Which tabs are clickable ───────────────────────────────────── */
  function isTabEnabled(key) {
    if (key === "general") return true;
    return !!productId;
  }

  return (
    <div>
      <AdminPageHeader title="New product" description="Add a product to the catalog">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50"
        >
          <Icon name="arrow_back" size={16} /> Back
        </Link>
      </AdminPageHeader>

      {/* ── Tab Navigation ─────────────────────────────────────────── */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((tab) => {
            const enabled = isTabEnabled(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => enabled && setActiveTab(tab.key)}
                disabled={!enabled}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : enabled
                    ? "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    : "border-transparent text-slate-300 cursor-not-allowed"
                }`}
              >
                <Icon name={tab.icon} size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Tab Content ────────────────────────────────────────────── */}

      {/* Single ProductForm — always mounted, sections toggled by CSS */}
      <div className={activeTab === "variants" ? "hidden" : ""}>
        <ProductForm
          ref={formRef}
          onSubmit={saveProduct}
          submitLabel=""
          busyLabel=""
          hideSubmit
          visibleSections={
            activeTab === "general" ? ["details", "images"] : ["pricing"]
          }
          validateSections={
            activeTab === "general" ? ["details"] : ["pricing"]
          }
        />
      </div>

      {/* Variants tab content */}
      {activeTab === "variants" && (
        <div>
          {productId ? (
            <VariantManager productId={productId} onStockChange={() => {}} />
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              Save product details first to add variants.
            </div>
          )}
        </div>
      )}

      {/* ── Footer Buttons ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mt-6 max-w-4xl">
        {/* Left: Back button (hidden on General) */}
        {activeTab !== "general" ? (
          <button
            type="button"
            onClick={() =>
              setActiveTab(activeTab === "pricing" ? "variants" : "general")
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50"
          >
            <Icon name="arrow_back" size={18} />
            Back
          </button>
        ) : (
          <span />
        )}

        {/* Right: Next / Create */}
        {activeTab === "general" && (
          <button
            type="button"
            onClick={handleGeneralNext}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Next"}
            <Icon name="arrow_forward" size={18} />
          </button>
        )}
        {activeTab === "variants" && (
          <button
            type="button"
            onClick={handleVariantsNext}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Next
            <Icon name="arrow_forward" size={18} />
          </button>
        )}
        {activeTab === "pricing" && (
          <button
            type="button"
            onClick={handlePricingSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
          >
            <Icon name="check_circle" size={18} />
            {saving ? "Saving…" : "Create product"}
          </button>
        )}
      </div>
    </div>
  );
}
