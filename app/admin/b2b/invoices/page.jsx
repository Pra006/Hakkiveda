"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import { Icon } from "@/components/ui/Icon";

const PAYMENT_STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Partially Paid", value: "PARTIALLY_PAID" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function B2BInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search) params.set("search", search);
      if (paymentStatus) params.set("paymentStatus", paymentStatus);

      const res = await fetch(`/api/admin/b2b/invoices?${params}`);
      const data = await res.json();
      if (res.ok) {
        setInvoices(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, paymentStatus]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    setPage(1);
  }, [search, paymentStatus]);

  const columns = [
    {
      header: "Invoice #",
      accessor: (row) => (
        <Link href={`/admin/b2b/invoices/${row.id}`} className="text-blue-600 hover:underline font-medium">
          {row.invoiceNumber}
        </Link>
      ),
    },
    {
      header: "Organization",
      accessor: (row) => row.organization?.companyName || "—",
    },
    {
      header: "Items",
      accessor: (row) => row._count?.items || 0,
    },
    {
      header: "Total",
      accessor: (row) => `Rs ${(row.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    },
    {
      header: "Due Date",
      accessor: (row) => row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "—",
    },
    {
      header: "Payment Status",
      accessor: (row) => <AdminStatusBadge status={row.paymentStatus} />,
    },
    {
      header: "Created",
      accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="B2B Invoices" subtitle={`${total} invoice${total !== 1 ? "s" : ""}`} />

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by invoice number or organization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-2 w-80"
        />
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          {PAYMENT_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={invoices}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No invoices found"
      />
    </div>
  );
}
