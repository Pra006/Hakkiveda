"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";

export default function B2BPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/b2b/payments?${params}`);
      const data = await res.json();
      if (res.ok) {
        setPayments(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const formatCurrency = (val) =>
    `Rs ${(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const columns = [
    {
      header: "Reference",
      accessor: (row) => row.reference || row.id.slice(0, 8),
    },
    {
      header: "Invoice #",
      accessor: (row) =>
        row.invoice ? (
          <Link
            href={`/admin/b2b/invoices/${row.invoice.id}`}
            className="text-blue-600 hover:underline"
          >
            {row.invoice.invoiceNumber}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      header: "Organization",
      accessor: (row) => row.organization?.companyName || "—",
    },
    {
      header: "Amount",
      accessor: (row) => formatCurrency(row.amount),
    },
    {
      header: "Method",
      accessor: (row) => row.method || "—",
    },
    {
      header: "Paid Date",
      accessor: (row) => row.paidAt ? new Date(row.paidAt).toLocaleDateString() : "—",
    },
  ];

  return (
    <div>
      <AdminPageHeader title="B2B Payments" subtitle={`${total} payment${total !== 1 ? "s" : ""}`} />

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by reference, invoice number, or organization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-2 w-96"
        />
      </div>

      <AdminDataTable
        columns={columns}
        data={payments}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No payments found"
      />
    </div>
  );
}
