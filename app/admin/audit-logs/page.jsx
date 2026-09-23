"use client";

import { useState, useEffect, useCallback } from "react";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";

const ACTIONS = [
  "CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT",
  "SUSPEND", "ACTIVATE", "LOGIN", "LOGOUT", "EXPORT",
];

const columns = [
  {
    key: "createdAt",
    label: "Timestamp",
    render: (row) => new Date(row.createdAt).toLocaleString(),
  },
  {
    key: "admin",
    label: "Admin",
    render: (row) => {
      const u = row.admin?.user;
      return u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email : "—";
    },
  },
  {
    key: "action",
    label: "Action",
    render: (row) => <AdminStatusBadge status={row.action}>{row.action}</AdminStatusBadge>,
  },
  {
    key: "entityType",
    label: "Entity",
    render: (row) => row.entityType || "—",
  },
  {
    key: "description",
    label: "Description",
    render: (row) => row.description || "—",
  },
];

export default function AuditLogsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("search", search);
      if (action) params.set("action", action);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setPagination({ page: json.page || 1, totalPages: json.totalPages || 1, total: json.total || 0 });
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [search, action, from, to]);

  useEffect(() => {
    fetchLogs(1);
  }, [search, action, from, to]);

  return (
    <>
      <AdminPageHeader title="Audit Logs" description="View all admin activity logs" />
      <div className="flex flex-wrap gap-3 mb-4">
        <select className="form-select w-auto" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All Actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input type="date" className="form-input w-auto" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" />
        <input type="date" className="form-input w-auto" value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" />
      </div>
      <AdminDataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchLogs}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search description or entity..."
        emptyIcon="file-text"
        emptyMessage="No audit logs found"
      />
    </>
  );
}
