"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import AdminStatCard from "@/components/admin/ui/AdminStatCard";
import Icon from "@/components/ui/Icon";
import CustomerOrderHistory from "@/components/admin/customers/CustomerOrderHistory";
import CustomerWishlist from "@/components/admin/customers/CustomerWishlist";
import CustomerActivity from "@/components/admin/customers/CustomerActivity";
import { toast } from "react-toastify";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/customers/${id}`)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setCustomer(data); })
      .finally(() => setLoading(false));
  }, [id]);

  const [notice, setNotice] = useState(null);

  const refresh = async () => {
    const res = await fetch(`/api/admin/customers/${id}`);
    const data = await res.json();
    if (!data.error) setCustomer(data);
  };

  const applyAction = async (action) => {
    if (action === "BLOCK" && !window.confirm("Block this account? The customer will no longer be able to sign in.")) return;
    setUpdating(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      await refresh();
      setNotice({ type: "success", text: `Customer ${action.toLowerCase()}d` });
      toast.success(`Customer ${action.toLowerCase()}d`);
    } catch (err) {
      setNotice({ type: "error", text: err.message });
      toast.error(err.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-20">
        <Icon name="error" size={48} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Customer not found</p>
        <button onClick={() => router.push("/admin/customers")} className="mt-4 text-blue-600 hover:underline text-sm">
          Back to Customers
        </button>
      </div>
    );
  }

  const name = [customer.user?.firstName, customer.user?.lastName].filter(Boolean).join(" ") || "—";
  const stats = customer.stats || {};
  const status = customer.accountStatus || (customer.isActive ? "ACTIVE" : "SUSPENDED");

  return (
    <div className="space-y-6">
      <AdminPageHeader title={name} description={`Customer ${customer.customerNumber}`}>
        <button
          onClick={() => router.push("/admin/customers")}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <Icon name="arrow_back" size={18} /> Back
        </button>
      </AdminPageHeader>

      {notice && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-sm ${notice.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          <span className="flex items-center gap-2">
            <Icon name={notice.type === "success" ? "check_circle" : "error"} size={18} />
            {notice.text}
          </span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"><Icon name="close" size={16} /></button>
        </div>
      )}

      {/* Profile header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row items-start gap-6">
        <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-500 overflow-hidden shrink-0">
          {customer.user?.image ? (
            <img src={customer.user.image} alt="" className="w-full h-full object-cover" />
          ) : (
            (customer.user?.firstName?.[0] || "?").toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-semibold text-slate-900">{name}</h2>
            <AdminStatusBadge status={status} />
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
              {customer.customerType === "B2B" ? "B2B" : "Retail"}
            </span>
          </div>
          <div className="text-sm text-slate-500 space-y-0.5">
            <p>
              {customer.user?.email}
              {customer.user?.emailVerified
                ? <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Verified</span>
                : <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Unverified</span>}
            </p>
            {customer.user?.phone && (
              <p>
                {customer.user.phone}
                {customer.user?.phoneVerified
                  ? <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Verified</span>
                  : <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Unverified</span>}
              </p>
            )}
            <p className="font-mono text-xs text-slate-400">ID {customer.id}</p>
            <p>Joined {new Date(customer.user?.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p>Last login: {customer.user?.lastLoginAt ? new Date(customer.user.lastLoginAt).toLocaleString() : "Never"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status !== "ACTIVE" && (
            <button onClick={() => applyAction("ACTIVATE")} disabled={updating}
              className="text-sm px-4 py-2 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-50">
              Activate
            </button>
          )}
          {status === "ACTIVE" && (
            <button onClick={() => applyAction("SUSPEND")} disabled={updating}
              className="text-sm px-4 py-2 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 disabled:opacity-50">
              Suspend
            </button>
          )}
          {status !== "BLOCKED" && (
            <button onClick={() => applyAction("BLOCK")} disabled={updating}
              className="text-sm px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
              Block
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <AdminStatCard label="Total Spent" value={`Rs ${(stats.totalSpent || 0).toLocaleString()}`} icon="payments" accent="green" />
        <AdminStatCard label="Total Orders" value={stats.totalOrders || 0} icon="shopping_bag" accent="blue" />
        <AdminStatCard label="Pending" value={stats.pendingOrders || 0} icon="pending" accent="amber" />
        <AdminStatCard label="Completed" value={stats.completedOrders || 0} icon="check_circle" accent="green" />
        <AdminStatCard label="Cancelled" value={stats.cancelledOrders || 0} icon="cancel" accent="red" />
        <AdminStatCard label="Addresses" value={customer.addresses?.length || 0} icon="location_on" accent="purple" />
      </div>

      {/* Order history */}
      <CustomerOrderHistory orders={customer.orders || []} totalOrders={stats.totalOrders || 0} />

      <CustomerWishlist items={customer.wishlistItems || []} />

      <CustomerActivity
        events={customer.activity || []}
        registeredAt={customer.user?.createdAt}
        lastLoginAt={customer.user?.lastLoginAt}
      />

      {/* Addresses */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Addresses</h3>
        </div>
        {customer.addresses?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {customer.addresses.map((addr) => (
              <div key={addr.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium text-slate-900">{addr.label || "Address"}</p>
                  {addr.isDefault && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Default</span>}
                </div>
                <p className="text-sm text-slate-600">
                  {[addr.streetAddress, addr.city, addr.district, addr.province].filter(Boolean).join(", ")}
                </p>
                {addr.phone && <p className="text-xs text-slate-400 mt-1">{addr.phone}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-slate-400">No addresses</div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Recent Payments</h3>
        </div>
        {customer.payments?.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {customer.payments.map((p) => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Rs {p.amount?.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{p.method} · {new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <AdminStatusBadge status={p.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-slate-400">No payments</div>
        )}
      </div>
    </div>
  );
}
