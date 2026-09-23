"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import AdminStatCard from "@/components/admin/ui/AdminStatCard";
import Icon from "@/components/ui/Icon";

export default function B2BOrgDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/b2b/organizations/${id}`)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setOrg(data); })
      .finally(() => setLoading(false));
  }, [id]);

  const updateOrg = async (updates) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/b2b/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setOrg((prev) => ({ ...prev, ...data }));
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-center py-20">
        <Icon name="error" size={48} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Organization not found</p>
        <button onClick={() => router.push("/admin/b2b/organizations")} className="mt-4 text-blue-600 hover:underline text-sm">Back</button>
      </div>
    );
  }

  const counts = org._count || {};
  const stats = org.stats || {};

  return (
    <div className="space-y-6">
      <AdminPageHeader title={org.companyName} description={`Organization ${org.organizationNumber}`}>
        <button onClick={() => router.push("/admin/b2b/organizations")} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <Icon name="arrow_back" size={18} /> Back
        </button>
      </AdminPageHeader>

      {/* Status + actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AdminStatusBadge status={org.status} />
          <span className="text-sm text-slate-500">{org.businessType?.replace(/_/g, " ")}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {org.status !== "ACTIVE" && (
            <button onClick={() => updateOrg({ status: "ACTIVE" })} disabled={updating} className="text-xs px-4 py-2 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-50">
              Activate
            </button>
          )}
          {org.status !== "SUSPENDED" && (
            <button onClick={() => updateOrg({ status: "SUSPENDED" })} disabled={updating} className="text-xs px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50">
              Suspend
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Total Orders" value={counts.orders || 0} icon="shopping_bag" accent="blue" />
        <AdminStatCard label="Order Value" value={`Rs ${(stats.totalOrderValue || 0).toLocaleString()}`} icon="payments" accent="green" />
        <AdminStatCard label="Outstanding" value={`Rs ${(stats.outstandingInvoices || 0).toLocaleString()}`} icon="receipt_long" accent="red" />
        <AdminStatCard label="Members" value={counts.members || 0} icon="group" accent="purple" />
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Business Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{org.businessEmail}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{org.phone}</dd></div>
            {org.whatsapp && <div className="flex justify-between"><dt className="text-slate-500">WhatsApp</dt><dd>{org.whatsapp}</dd></div>}
            {org.website && <div className="flex justify-between"><dt className="text-slate-500">Website</dt><dd>{org.website}</dd></div>}
            {org.taxNumber && <div className="flex justify-between"><dt className="text-slate-500">Tax No.</dt><dd>{org.taxNumber}</dd></div>}
            <div className="flex justify-between"><dt className="text-slate-500">Country</dt><dd>{org.country}</dd></div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Payment Terms</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Payment Term</dt><dd>{org.defaultPaymentTerm?.replace(/_/g, " ")}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Credit Limit</dt><dd>{org.creditLimit ? `Rs ${org.creditLimit.toLocaleString()}` : "Not set"}</dd></div>
          </dl>
        </div>
      </div>

      {/* Application link */}
      {org.b2bApplication && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-2">Source Application</h3>
          <p className="text-sm text-slate-600">
            {org.b2bApplication.applicationNumber} · <AdminStatusBadge status={org.b2bApplication.status} />
          </p>
        </div>
      )}

      {/* Members */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Members ({org.members?.length || 0})</h3>
        </div>
        {org.members?.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {org.members.map((m) => (
              <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {[m.user?.firstName, m.user?.lastName].filter(Boolean).join(" ") || "—"}
                  </p>
                  <p className="text-xs text-slate-500">{m.user?.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <AdminStatusBadge status={m.role} />
                  <AdminStatusBadge status={m.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-slate-400">No members</div>
        )}
      </div>

      {/* Activity summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Activity Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center text-sm">
          {[
            { label: "RFQs", count: counts.rfqs },
            { label: "Quotations", count: counts.quotations },
            { label: "POs", count: counts.purchaseOrders },
            { label: "Orders", count: counts.orders },
            { label: "Invoices", count: counts.invoices },
            { label: "Payments", count: counts.payments },
          ].map((item) => (
            <div key={item.label} className="p-3 bg-slate-50 rounded-lg">
              <p className="text-lg font-semibold text-slate-900">{item.count || 0}</p>
              <p className="text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
