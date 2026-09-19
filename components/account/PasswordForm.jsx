"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";

export default function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: "error", text: "Passwords don't match" });
      toast.error("Passwords don't match");
      return;
    }

    if (form.newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" });
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setMessage({ type: "success", text: "Password changed successfully" });
      toast.success("Password changed successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
      toast.error(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {message && (
        <div className={`text-sm rounded-lg px-3 py-2 ${message.type === "success" ? "text-herbal-jade bg-herbal-jade/8" : "text-terracotta bg-terracotta/8"}`}>
          {message.text}
        </div>
      )}

      {["currentPassword", "newPassword", "confirmPassword"].map((name) => (
        <label key={name} className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            {name === "currentPassword" ? "Current Password" : name === "newPassword" ? "New Password" : "Confirm Password"}
          </span>
          <input
            type="password"
            name={name}
            value={form[name]}
            onChange={handleChange}
            required
            className="bg-surface-container-low border border-outline-variant rounded px-3 py-2.5 text-sm outline-none focus:border-antique-gold"
          />
        </label>
      ))}

      <Button type="submit" disabled={loading}>
        {loading ? "Changing..." : "Change password"}
      </Button>
    </form>
  );
}
