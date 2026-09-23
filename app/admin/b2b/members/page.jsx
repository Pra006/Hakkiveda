"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";

export default function B2BMembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");

  const fetchMembers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/b2b/members?${params}`);
      const json = await res.json();
      if (res.ok) {
        setMembers(json.data);
        setPagination(json.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchMembers(1); }, [fetchMembers]);

  const columns = [
    {
      key: "name",
      label: "Member",
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-slate-900">{row.name || "—"}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: "organization",
      label: "Organization",
      render: (row) => (
        <Link href={`/admin/b2b/organizations/${row.organizationId}`} className="text-sm text-blue-600 hover:underline">
          {row.organizationName}
        </Link>
      ),
    },
    { key: "role", label: "Role", render: (row) => <AdminStatusBadge status={row.role} /> },
    { key: "status", label: "Status", render: (row) => <AdminStatusBadge status={row.status} /> },
    {
      key: "createdAt",
      label: "Joined",
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="B2B Members" description="All organization members across B2B accounts" />
      <AdminDataTable
        columns={columns}
        data={members}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchMembers}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, or organization…"
        emptyIcon="badge"
        emptyMessage="No members found"
      />
    </div>
  );
}
