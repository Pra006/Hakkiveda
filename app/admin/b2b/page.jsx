"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";

function StatCard({ label, value, icon, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-5 text-left hover:shadow-md transition-shadow w-full ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon name={icon} size={20} className="text-white" />
        </div>
        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>
      <p className="text-sm text-slate-500">{label}</p>
    </button>
  );
}

export default function B2BOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/b2b/overview")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const s = data?.stats || {};
  const goTo = (status) => router.push(`/admin/b2b/applications?status=${status}`);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="B2B Management Overview" description="Application pipeline and business stats" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Applications" value={s.total || 0} icon="description" color="bg-slate-600" onClick={() => router.push("/admin/b2b/applications")} />
        <StatCard label="Pending" value={s.pending || 0} icon="hourglass_empty" color="bg-amber-500" onClick={() => goTo("PENDING")} />
        <StatCard label="Under Review" value={s.underReview || 0} icon="rate_review" color="bg-blue-500" onClick={() => goTo("UNDER_REVIEW")} />
        <StatCard label="More Info Required" value={s.moreInfoRequired || 0} icon="help" color="bg-orange-500" onClick={() => goTo("MORE_INFORMATION_REQUIRED")} />
        <StatCard label="Approved" value={s.approved || 0} icon="check_circle" color="bg-green-600" onClick={() => goTo("APPROVED")} />
        <StatCard label="Rejected" value={s.rejected || 0} icon="cancel" color="bg-red-500" onClick={() => goTo("REJECTED")} />
        <StatCard label="Suspended" value={s.suspended || 0} icon="block" color="bg-red-800" onClick={() => goTo("SUSPENDED")} />
        <StatCard label="Active Businesses" value={s.activeOrgs || 0} icon="storefront" color="bg-emerald-600" onClick={() => router.push("/admin/b2b/organizations")} />
      </div>

      {data?.recentApplications?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Icon name="schedule" size={18} className="text-slate-400" />
            Recent Applications
          </h3>
          <div className="space-y-3">
            {data.recentApplications.map((app) => (
              <button
                key={app.id}
                onClick={() => router.push(`/admin/b2b/applications/${app.id}`)}
                className="w-full flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{app.companyName || app.storeName}</p>
                  <p className="text-xs text-slate-500">{app.applicationNumber} · {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <AdminStatusBadge status={app.status} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
