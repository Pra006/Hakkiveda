"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/customers?${params}`);
      const json = await res.json();
      if (res.ok) {
        setCustomers(json.data);
        setPagination(json.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchCustomers(1); }, [fetchCustomers]);

  const columns = [
    {
      key: "customer",
      label: "Customer",
      render: (row) => (
        <Link href={`/admin/customers/${row.id}`} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600 overflow-hidden">
            {row.image ? (
              <img src={row.image} alt="" className="w-full h-full object-cover" />
            ) : (
              (row.firstName?.[0] || "?").toUpperCase()
            )}
          </div>
          <div>
            <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
              {[row.firstName, row.lastName].filter(Boolean).join(" ") || "—"}
            </p>
            <p className="text-xs text-slate-500">{row.customerNumber}</p>
          </div>
        </Link>
      ),
    },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone", render: (row) => row.phone || "—" },
    { key: "totalOrders", label: "Orders", render: (row) => row.totalOrders },
    {
      key: "isActive",
      label: "Status",
      render: (row) => <AdminStatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Customers" description="Manage registered customers" />

      <div className="mb-4 flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={customers}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchCustomers}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, phone, or customer number…"
        emptyIcon="group"
        emptyMessage="No customers found"
        actions={(row) => (
          <Link
            href={`/admin/customers/${row.id}`}
            className="text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Icon name="visibility" size={20} />
          </Link>
        )}
      />
    </div>
  );
}
