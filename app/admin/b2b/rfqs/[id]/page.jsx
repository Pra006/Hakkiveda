"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import { Icon } from "@/components/ui/Icon";

const STATUS_OPTIONS = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "QUOTED", "CANCELLED", "EXPIRED"];

export default function B2BRFQDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusValue, setStatusValue] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const fetchRfq = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/b2b/rfqs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch RFQ");
      const data = await res.json();
      setRfq(data);
      setStatusValue(data.status || "");
      setInternalNotes(data.internalNotes || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRfq();
  }, [fetchRfq]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/b2b/rfqs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusValue, internalNotes }),
      });
      if (!res.ok) throw new Error("Failed to update RFQ");
      const data = await res.json();
      setRfq(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }

  if (!rfq) {
    return <div className="p-6 text-center text-red-500">RFQ not found</div>;
  }

  const requester = rfq.requestedBy?.user;
  const requesterName = requester
    ? `${requester.firstName || ""} ${requester.lastName || ""}`.trim() || requester.email
    : "-";

  const itemColumns = [
    { header: "Product", accessor: "productName", render: (row) => row.productName || row.product?.name || "-" },
    { header: "Quantity", accessor: "quantity" },
    { header: "Unit", accessor: "unit", render: (row) => row.unit || "-" },
    { header: "Notes", accessor: "notes", render: (row) => row.notes || "-" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`RFQ ${rfq.rfqNumber}`}
        description="Request for quotation details"
        backHref="/admin/b2b/rfqs"
      />

      {/* RFQ Info */}
      <div className="bg-white rounded-lg border p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">RFQ Number</p>
          <p className="font-medium">{rfq.rfqNumber}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Organization</p>
          <p className="font-medium">{rfq.organization?.companyName || "-"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Requested By</p>
          <p className="font-medium">{requesterName}</p>
          {requester?.email && <p className="text-xs text-gray-400">{requester.email}</p>}
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <AdminStatusBadge status={rfq.status} />
        </div>
        <div>
          <p className="text-sm text-gray-500">Requested Delivery Date</p>
          <p className="font-medium">
            {rfq.requestedDeliveryDate
              ? new Date(rfq.requestedDeliveryDate).toLocaleDateString()
              : "-"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Created</p>
          <p className="font-medium">
            {rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString() : "-"}
          </p>
        </div>
        {rfq.message && (
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Message</p>
            <p className="font-medium whitespace-pre-wrap">{rfq.message}</p>
          </div>
        )}
        {(rfq.shippingCountry || rfq.shippingCity || rfq.shippingAddress) && (
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Shipping Address</p>
            <p className="font-medium">
              {[rfq.shippingAddress, rfq.shippingCity, rfq.shippingCountry]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">
          Items ({rfq.items?.length || 0})
        </h2>
        <AdminDataTable columns={itemColumns} data={rfq.items || []} />
      </div>

      {/* Linked Quotation */}
      {rfq.quotation && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Linked Quotation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Quotation ID</p>
              <p className="font-medium">{rfq.quotation.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <AdminStatusBadge status={rfq.quotation.status} />
            </div>
            {rfq.quotation.totalAmount != null && (
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium">{rfq.quotation.totalAmount}</p>
              </div>
            )}
            {rfq.quotation.validUntil && (
              <div>
                <p className="text-sm text-gray-500">Valid Until</p>
                <p className="font-medium">
                  {new Date(rfq.quotation.validUntil).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Update & Internal Notes */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Update RFQ</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Internal Notes
          </label>
          <textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Add internal notes..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
