"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";

const STATUSES = ["", "PENDING", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED", "CONTACT_REQUIRED", "APPROVED", "REJECTED", "SUSPENDED"];

export default function B2BApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
    { key: "companyName", label: "Company" },
    { key: "contactPersonName", label: "Contact" },
    { key: "businessType", label: "Type", render: (row) => <AdminStatusBadge status={row.businessType} /> },
    { key: "status", label: "Status", render: (row) => <AdminStatusBadge status={row.status} /> },
    {
      key: "submittedAt",
      label: "Applied",
      render: (row) => new Date(row.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="B2B Applications" description="Review and approve business applications" />

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
