"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const formatCurrency = (amount) =>
  `Rs ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const columns = [
  {
    key: "orderNumber",
    label: "Order #",
    render: (row) => (
      <Link
        href={`/admin/b2b/orders/${row.id}`}
        className="text-blue-600 hover:underline font-medium"
      >
        {row.orderNumber}
      </Link>
    ),
  },
  {
    key: "organization",
    label: "Organization",
    render: (row) => row.organization?.companyName || "—",
  },
  {
    key: "placedBy",
    label: "Placed By",
    render: (row) => {
      const user = row.placedBy?.user;
      return user ? `${user.firstName} ${user.lastName}` : "—";
    },
  },
  {
    key: "items",
    label: "Items",
    render: (row) => row._count?.items || 0,
  },
  {
    key: "total",
    label: "Total",
    render: (row) => formatCurrency(row.total),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => <AdminStatusBadge status={row.status} />,
  },
  {
    key: "createdAt",
    label: "Date",
    render: (row) => formatDate(row.createdAt),
  },
];

export default function B2BOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page);
      if (search) params.set("search", search);
      if (status) params.set("status", status);

      const res = await fetch(`/api/admin/b2b/orders?${params}`);
      const data = await res.json();

      setOrders(data.data || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: data.totalPages || 1,
        total: data.total || 0,
      }));
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  return (
    <div>
      <AdminPageHeader
        title="B2B Orders"
        description="Manage business-to-business orders"
      />
      <AdminDataTable
        columns={columns}
        data={orders}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by order number or organization..."
        emptyIcon="package"
        emptyMessage="No orders found"
        headerExtra={
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="border rounded-md px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        }
      />
    </div>
  );
}
