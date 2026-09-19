"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";

const INITIAL = {
  label: "",
  type: "HOME",
  fullName: "",
  phone: "",
  province: "",
  district: "",
  city: "",
  streetAddress: "",
  landmark: "",
  postalCode: "",
  isDefault: false,
};

export default function AddressFormModal({ address }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(address ? { ...address } : { ...INITIAL });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = !!address;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isEdit ? `/api/account/addresses/${address.id}` : "/api/account/addresses";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setOpen(false);
      if (!isEdit) setForm({ ...INITIAL });
      toast.success(isEdit ? "Address updated" : "Address added");
      router.refresh();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Could not save address");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {isEdit ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs font-semibold text-forest-deep hover:text-antique-gold"
        >
          Edit
        </button>
      ) : (
        <Button onClick={() => setOpen(true)} size="sm">
          <Icon name="add" size={16} /> Add address
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-surface-container-lowest rounded-xl border border-outline-variant/60 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/40">
              <h2 className="font-headline text-lg text-forest-deep">
                {isEdit ? "Edit Address" : "Add Address"}
              </h2>
              <button onClick={() => setOpen(false)} className="text-on-surface-variant hover:text-forest-deep">
                <Icon name="close" size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
              {error && (
                <div className="text-sm text-terracotta bg-terracotta/8 rounded-lg px-3 py-2">{error}</div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Label" name="label" value={form.label} onChange={handleChange} placeholder="e.g. Home, Office" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Type</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="bg-surface-container-low border border-outline-variant rounded px-3 py-2.5 text-sm outline-none focus:border-antique-gold"
                  >
                    <option value="HOME">Home</option>
                    <option value="OFFICE">Office</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name *" name="fullName" value={form.fullName} onChange={handleChange} required />
                <Field label="Phone *" name="phone" value={form.phone} onChange={handleChange} required />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Province *" name="province" value={form.province} onChange={handleChange} required />
                <Field label="District" name="district" value={form.district || ""} onChange={handleChange} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="City *" name="city" value={form.city} onChange={handleChange} required />
                <Field label="Postal Code" name="postalCode" value={form.postalCode || ""} onChange={handleChange} />
              </div>

              <Field label="Street Address" name="streetAddress" value={form.streetAddress || ""} onChange={handleChange} />
              <Field label="Landmark" name="landmark" value={form.landmark || ""} onChange={handleChange} placeholder="Near..." />

              <label className="flex items-center gap-2 text-sm text-forest-deep">
                <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleChange} className="h-4 w-4 rounded" />
                Set as default address
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : isEdit ? "Update" : "Add Address"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, name, value, onChange, required, placeholder }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{label}</span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="bg-surface-container-low border border-outline-variant rounded px-3 py-2.5 text-sm text-forest-deep outline-none focus:border-antique-gold"
      />
    </label>
  );
}
