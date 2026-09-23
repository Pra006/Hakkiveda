"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";

const STATUSES = ["", "PENDING", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED", "CONTACT_REQUIRED", "APPROVED", "REJECTED", "SUSPENDED"];

const STAT_CARDS = [
  { key: "pending", label: "Pending", icon: "hourglass_empty", color: "text-amber-600 bg-amber-50 border-amber-200", filter: "PENDING" },
  { key: "underReview", label: "Under Review", icon: "rate_review", color: "text-blue-600 bg-blue-50 border-blue-200", filter: "UNDER_REVIEW" },
  { key: "approved", label: "Approved", icon: "check_circle", color: "text-green-600 bg-green-50 border-green-200", filter: "APPROVED" },
  { key: "rejected", label: "Rejected", icon: "cancel", color: "text-red-600 bg-red-50 border-red-200", filter: "REJECTED" },
];

export default function B2BApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [counts, setCounts] = useState({});

  const fetchApps = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/b2b/applications?${params}`);
      const json = await res.json();
      if (res.ok) {
        setApps(json.data);
        setPagination(json.pagination);
        if (json.counts) setCounts(json.counts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchApps(1); }, [fetchApps]);

  const columns = [
    {
      key: "applicationNumber",
      label: "Application",
      render: (row) => (
        <Link href={`/admin/b2b/applications/${row.id}`} className="font-medium text-blue-600 hover:underline">
          {row.applicationNumber}
        </Link>
      ),
    },
    {
      key: "companyName",
      label: "Company",
      render: (row) => row.companyName || row.storeName || "—",
    },
    {
      key: "contactPersonName",
      label: "Contact",
      render: (row) => {
        if (row.contactPersonName) return row.contactPersonName;
        const u = row.user;
        if (u) return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
        return "—";
      },
    },
    {
      key: "businessEmail",
      label: "Email",
      render: (row) => (
        <span className="text-xs text-slate-600 truncate max-w-[180px] inline-block">{row.businessEmail || row.user?.email || "—"}</span>
      ),
    },
    {
      key: "businessType",
      label: "Type",
      render: (row) => <AdminStatusBadge status={row.businessType} />,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      key: "submittedAt",
      label: "Applied",
      render: (row) => {
        const date = row.submittedAt || row.createdAt;
        return date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
      },
    },
  ];

  return (
    <div>
      <AdminPageHeader title="B2B Applications" description="Review and approve business applications" />

      {/* Stats */}
      {Object.keys(counts).length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STAT_CARDS.map((card) => (
            <button
              key={card.key}
              onClick={() => setStatusFilter(statusFilter === card.filter ? "" : card.filter)}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${card.color} ${
                statusFilter === card.filter ? "ring-2 ring-offset-1 ring-current" : ""
              }`}
            >
              <Icon name={card.icon} size={24} />
              <div>
                <div className="text-2xl font-bold">{counts[card.key] ?? 0}</div>
                <div className="text-xs font-medium opacity-80">{card.label}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s.replace(/_/g, " ") : "All Status"}</option>
          ))}
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={apps}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchApps}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by application number, company, contact, or email…"
        emptyIcon="business"
        emptyMessage="No applications found"
        actions={(row) => (
          <Link href={`/admin/b2b/applications/${row.id}`} className="text-slate-400 hover:text-blue-600">
            <Icon name="visibility" size={20} />
          </Link>
        )}
      />
    </div>
  );
}
