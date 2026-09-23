"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";
import Link from "next/link";

const STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"];

function formatRs(amount) {
  return `Rs ${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default function B2BQuotationDetailPage() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchQuotation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/b2b/quotations/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setQuotation(data);
    } catch (err) {
      console.error("Failed to fetch quotation:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuotation();
  }, [fetchQuotation]);

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/b2b/quotations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await fetchQuotation();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!quotation) return <div className="p-6">Quotation not found.</div>;

  return (
    <div>
      <AdminPageHeader
        title={`Quotation ${quotation.quoteNumber}`}
        backHref="/admin/b2b/quotations"
      />

      {/* Status Update Buttons */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {STATUSES.filter((s) => s !== quotation.status).map((s) => (
          <button
            key={s}
            onClick={() => updateStatus(s)}
            disabled={updating}
            className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Mark as {s}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <AdminStatusBadge status={quotation.status} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Organization</p>
            <p className="font-medium">{quotation.organization?.companyName || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Valid Until</p>
            <p>{quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment Terms</p>
            <p>{quotation.paymentTerms || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Delivery Terms</p>
            <p>{quotation.deliveryTerms || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p>{new Date(quotation.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="mt-6 border-t pt-4">
          <div className="flex flex-col gap-1 items-end text-sm">
            <p>Subtotal: {formatRs(quotation.subtotal)}</p>
            <p>Discount: {formatRs(quotation.discount)}</p>
            <p>Tax: {formatRs(quotation.tax)}</p>
            <p>Shipping: {formatRs(quotation.shippingCost)}</p>
            <p className="text-lg font-bold">Total: {formatRs(quotation.total)}</p>
          </div>
        </div>

        {quotation.notes && (
          <div className="mt-4 border-t pt-4">
            <p className="text-sm text-gray-500">Notes</p>
            <p className="whitespace-pre-wrap">{quotation.notes}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Items ({quotation.items?.length || 0})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2 pr-4">Unit Price</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items?.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2 pr-4">{item.productName}</td>
                  <td className="py-2 pr-4">{item.quantity}</td>
                  <td className="py-2 pr-4">{formatRs(item.unitPrice)}</td>
                  <td className="py-2 pr-4">{formatRs(item.totalPrice)}</td>
                  <td className="py-2 text-gray-500">{item.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Linked Entities */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Linked Entities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">RFQ</p>
            {quotation.rfq ? (
              <Link href={`/admin/b2b/rfqs/${quotation.rfq.id}`} className="text-blue-600 hover:underline">
                <Icon name="FileText" className="inline w-4 h-4 mr-1" />
                {quotation.rfq.rfqNumber} — <AdminStatusBadge status={quotation.rfq.status} />
              </Link>
            ) : (
              <p className="text-gray-400">No linked RFQ</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Purchase Order</p>
            {quotation.purchaseOrder ? (
              <Link href={`/admin/b2b/purchase-orders/${quotation.purchaseOrder.id}`} className="text-blue-600 hover:underline">
                <Icon name="ShoppingCart" className="inline w-4 h-4 mr-1" />
                {quotation.purchaseOrder.poNumber} — <AdminStatusBadge status={quotation.purchaseOrder.status} />
              </Link>
            ) : (
              <p className="text-gray-400">No linked Purchase Order</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
