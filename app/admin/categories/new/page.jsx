"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

export default function NewCategoryPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", slug: "", description: "", parentId: "", isActive: true });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.data || data || []))
      .catch(() => {});
  }, []);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleName = (name) => {
    update("name", name);
    update("slug", name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, parentId: form.parentId || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Create failed");
      }
      const category = await res.json();
      toast.success("Category created!");
      router.push(`/admin/categories/${category.id}`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="New Category" description="Create a new product category">
        <button onClick={() => router.push("/admin/categories")} style={{ padding: "8px 16px", border: "1px solid #ddd", borderRadius: 8, background: "white", cursor: "pointer" }}>
          <Icon name="arrow-left" size={16} /> Back
        </button>
      </AdminPageHeader>

      {error && <div style={{ color: "#dc2626", marginBottom: 16, padding: "8px 12px", background: "#fef2f2", borderRadius: 8 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 700 }}>
        <Field label="Name *" value={form.name} onChange={handleName} />
        <Field label="Slug *" value={form.slug} onChange={(v) => update("slug", v)} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Description" value={form.description} onChange={(v) => update("description", v)} textarea />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Parent Category</label>
          <select value={form.parentId} onChange={(e) => update("parentId", e.target.value)} style={inputStyle}>
            <option value="">None (Top Level)</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 24 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
            Active
          </label>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={handleSubmit} disabled={saving} style={{ padding: "10px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 500, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Creating..." : "Create Category"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 };

function Field({ label, value, onChange, textarea, rows = 3 }) {
  const Tag = textarea ? "textarea" : "input";
  return (
    <div>
      <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 14 }}>{label}</label>
      <Tag value={value} onChange={(e) => onChange(e.target.value)} rows={textarea ? rows : undefined} style={{ ...inputStyle, ...(textarea ? { resize: "vertical" } : {}) }} />
    </div>
  );
}
