"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import ProductForm from "@/components/admin/products/ProductForm";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

export default function NewProductPage() {
  const router = useRouter();

  async function handleCreate(payload) {
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Could not create the product");
    toast.success("Product created successfully!");
    router.push(`/admin/products/${json.id}?created=1`);
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

      <ProductForm onSubmit={handleCreate} submitLabel="Create product" busyLabel="Creating…" />
    </div>
  );
}
