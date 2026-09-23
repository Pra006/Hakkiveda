"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";

export default function B2BOrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOrgs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/b2b/organizations?${params}`);
      const json = await res.json();
      if (res.ok) {
        setOrgs(json.data);
        setPagination(json.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchOrgs(1); }, [fetchOrgs]);

  const columns = [
    {
      key: "companyName",
      label: "Organization",
      render: (row) => (
        <Link href={`/admin/b2b/organizations/${row.id}`} className="group">
          <p className="font-medium text-slate-900 group-hover:text-blue-600">{row.companyName}</p>
          <p className="text-xs text-slate-500">{row.organizationNumber}</p>
        </Link>
      ),
    },
    { key: "businessType", label: "Type", render: (row) => <AdminStatusBadge status={row.businessType} /> },
    { key: "members", label: "Members", render: (row) => row._count?.members || 0 },
    { key: "orders", label: "Orders", render: (row) => row._count?.orders || 0 },
    { key: "status", label: "Status", render: (row) => <AdminStatusBadge status={row.status} /> },
    {
      key: "createdAt",
      label: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="B2B Organizations" description="Manage approved business organizations" />

      <div className="mb-4 flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={orgs}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchOrgs}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, number, or email…"
        emptyIcon="business"
        emptyMessage="No organizations found"
        actions={(row) => (
          <Link href={`/admin/b2b/organizations/${row.id}`} className="text-slate-400 hover:text-blue-600">
            <Icon name="visibility" size={20} />
          </Link>
        )}
      />
    </div>
  );
}
