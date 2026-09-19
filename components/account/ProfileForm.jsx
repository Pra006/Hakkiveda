"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";

export default function ProfileForm({ initialData, image }) {
  const router = useRouter();
  const [form, setForm] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setMessage({ type: "success", text: "Profile updated successfully" });
      toast.success("Profile updated successfully");
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  const displayName = [form.firstName, form.lastName].filter(Boolean).join(" ") || "?";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        {image ? (
          <img src={image} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-antique-gold/30" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-forest-base text-antique-gold flex items-center justify-center font-headline text-2xl">
            {displayName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-forest-deep">{displayName}</div>
          <div className="text-xs text-on-surface-variant">{form.email}</div>
        </div>
      </div>

      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 ${message.type === "success" ? "text-herbal-jade bg-herbal-jade/8" : "text-terracotta bg-terracotta/8"}`}>
          {message.text}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">First Name</span>
          <input
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            required
            className="bg-surface-container-low border border-outline-variant rounded px-3 py-2.5 text-sm text-forest-deep outline-none focus:border-antique-gold"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Last Name</span>
          <input
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className="bg-surface-container-low border border-outline-variant rounded px-3 py-2.5 text-sm text-forest-deep outline-none focus:border-antique-gold"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Phone Number</span>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="bg-surface-container-low border border-outline-variant rounded px-3 py-2.5 text-sm text-forest-deep outline-none focus:border-antique-gold max-w-xs"
        />
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
