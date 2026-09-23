"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import AdminStatCard from "@/components/admin/ui/AdminStatCard";
import { Icon } from "@/components/ui/Icon";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Quoted", value: "QUOTED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Expired", value: "EXPIRED" },
];

export default function B2BRFQsPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("pageSize", 20);
      if (search) params.set("search", search);
      if (status) params.set("status", status);

      const res = await fetch(`/api/admin/b2b/rfqs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch RFQs");
      const json = await res.json();
      setRfqs(json.data || []);
      setPagination(json.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchRfqs();
  }, [fetchRfqs]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const columns = [
    {
      header: "RFQ Number",
      accessor: "rfqNumber",
      render: (row) => (
        <a
          href={`/admin/b2b/rfqs/${row.id}`}
          className="text-blue-600 hover:underline font-medium"
          onClick={(e) => {
            e.preventDefault();
            router.push(`/admin/b2b/rfqs/${row.id}`);
          }}
        >
          {row.rfqNumber}
        </a>
      ),
    },
    {
      header: "Organization",
      accessor: "organization",
      render: (row) => row.organization?.companyName || "-",
    },
    {
      header: "Requested By",
      accessor: "requestedBy",
      render: (row) => {
        const u = row.requestedBy?.user;
        return u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email : "-";
      },
    },
    {
      header: "Items",
      accessor: "_count",
      render: (row) => row._count?.items ?? 0,
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <AdminStatusBadge status={row.status} />,
    },
    {
      header: "Date",
      accessor: "createdAt",
      render: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="B2B RFQs"
        description="Manage business-to-business request for quotations"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminStatCard label="Total RFQs" value={pagination.total} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by RFQ number or organization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={rfqs}
        loading={loading}
        pagination={pagination}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
