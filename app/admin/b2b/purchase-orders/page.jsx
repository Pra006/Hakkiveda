"use client";

import { useState, useEffect, useCallback } from "react";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Link from "next/link";

const STATUSES = ["DRAFT", "SUBMITTED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

function formatRs(amount) {
  return `Rs ${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default function B2BPurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set("search", search);
      if (status) params.set("status", status);

      const res = await fetch(`/api/admin/b2b/purchase-orders?${params}`);
      const data = await res.json();
      setOrders(data.data || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to fetch purchase orders:", err);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns = [
    {
      header: "PO #",
      accessor: (row) => (
        <Link href={`/admin/b2b/purchase-orders/${row.id}`} className="text-blue-600 hover:underline font-medium">
          {row.poNumber}
        </Link>
      ),
    },
    {
      header: "Organization",
      accessor: (row) => row.organization?.companyName || "—",
    },
    {
      header: "Items",
      accessor: (row) => row._count?.items ?? 0,
    },
    {
      header: "Total",
      accessor: (row) => formatRs(row.total),
    },
    {
      header: "Status",
      accessor: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      header: "Date",
      accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="B2B Purchase Orders" />

      <div className="mb-4 flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by PO # or organization..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border rounded px-3 py-2 text-sm w-64"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={orders}
        loading={loading}
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
