"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "ORDER_MANAGER", label: "Order Manager" },
  { value: "PRODUCT_MANAGER", label: "Product Manager" },
  { value: "B2B_MANAGER", label: "B2B Manager" },
  { value: "FINANCE_MANAGER", label: "Finance Manager" },
  { value: "SUPPORT_MANAGER", label: "Support Manager" },
];

export default function NewAdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userPreview, setUserPreview] = useState(null);
  const [searching, setSearching] = useState(false);

  const lookupUser = async () => {
    if (!email) return;
    setSearching(true);
    setError("");
    setUserPreview(null);
    try {
      const res = await fetch(`/api/admin/admins?search=${encodeURIComponent(email)}`);
      const json = await res.json();
      const match = json.data?.find((a) => a.user?.email === email);
      if (match) {
        setError("This user is already an admin");
        toast.warn("This user is already an admin");
      }
    } catch {
      // ignore lookup errors
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to create admin");
        toast.error(json.error || "Failed to create admin");
        return;
      }
      toast.success("Admin created successfully!");
      router.push("/admin/admins");
    } catch {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminPageHeader title="Add Admin" description="Grant admin access to an existing user" />
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {error && (
          <div className="alert alert-error">
            <Icon name="alert-circle" size={16} /> {error}
          </div>
        )}
        <div className="form-group">
          <label className="form-label">User Email</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setUserPreview(null); }}
            onBlur={lookupUser}
            placeholder="Enter existing user email"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)} required>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading || !email}>
            {loading ? "Creating..." : "Create Admin"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => router.push("/admin/admins")}>
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
