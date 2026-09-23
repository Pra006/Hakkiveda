"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";

const STATUSES = ["", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"];

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/customer-orders?${params}`);
      const json = await res.json();
      if (res.ok) {
        setOrders(json.data);
        setPagination(json.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchOrders(1); }, [fetchOrders]);

  const columns = [
    {
      key: "orderNumber",
      label: "Order",
      render: (row) => (
        <Link href={`/admin/customer-orders/${row.id}`} className="font-medium text-blue-600 hover:underline">
          {row.orderNumber}
        </Link>
      ),
    },
    { key: "customerName", label: "Customer", render: (row) => (
      <div>
        <p className="text-sm text-slate-900">{row.customerName || "—"}</p>
        <p className="text-xs text-slate-500">{row.customerEmail}</p>
      </div>
    )},
    { key: "itemCount", label: "Items" },
    { key: "total", label: "Total", render: (row) => `Rs ${(row.total || 0).toLocaleString()}` },
    { key: "status", label: "Status", render: (row) => <AdminStatusBadge status={row.status} /> },
    {
      key: "createdAt",
      label: "Date",
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Customer Orders" description="Manage all customer orders" />

      <div className="mb-4 flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || "All Status"}</option>
          ))}
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={orders}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchOrders}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by order number, customer name or email…"
        emptyIcon="shopping_bag"
        emptyMessage="No orders found"
        actions={(row) => (
          <Link href={`/admin/customer-orders/${row.id}`} className="text-slate-400 hover:text-blue-600">
            <Icon name="visibility" size={20} />
          </Link>
        )}
      />
    </div>
  );
}
