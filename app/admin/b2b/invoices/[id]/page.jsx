"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import AdminDataTable from "@/components/admin/ui/AdminDataTable";
import { Icon } from "@/components/ui/Icon";

const PAYMENT_STATUSES = ["PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"];

export default function B2BInvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/b2b/invoices/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
        setSelectedStatus(data.paymentStatus);
      }
    } catch (err) {
      console.error("Failed to fetch invoice:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleStatusUpdate = async () => {
    if (selectedStatus === invoice.paymentStatus) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/b2b/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: selectedStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!invoice) {
    return <div className="p-6">Invoice not found</div>;
  }

  const formatCurrency = (val) =>
    `Rs ${(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const itemColumns = [
    { header: "Product", accessor: (row) => row.productName },
    { header: "Quantity", accessor: (row) => row.quantity },
    { header: "Unit Price", accessor: (row) => formatCurrency(row.unitPrice) },
    { header: "Total", accessor: (row) => formatCurrency(row.totalPrice) },
    { header: "Notes", accessor: (row) => row.notes || "—" },
  ];

  const paymentColumns = [
    { header: "Reference", accessor: (row) => row.reference || row.id.slice(0, 8) },
    { header: "Amount", accessor: (row) => formatCurrency(row.amount) },
    { header: "Method", accessor: (row) => row.method },
    {
      header: "Organization",
      accessor: (row) => row.organization?.companyName || "—",
    },
    {
      header: "Paid At",
      accessor: (row) => row.paidAt ? new Date(row.paidAt).toLocaleString() : "—",
    },
    { header: "Notes", accessor: (row) => row.notes || "—" },
  ];

  return (
    <div>
      <AdminPageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={invoice.organization?.companyName}
        backHref="/admin/b2b/invoices"
      />

      {/* Summary */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Payment Status</p>
            <div className="mt-1">
              <AdminStatusBadge status={invoice.paymentStatus} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="font-medium">
              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-semibold text-lg">{formatCurrency(invoice.total)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          <div>
            <p className="text-sm text-gray-500">Subtotal</p>
            <p className="font-medium">{formatCurrency(invoice.subtotal)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Discount</p>
            <p className="font-medium">{formatCurrency(invoice.discount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tax</p>
            <p className="font-medium">{formatCurrency(invoice.tax)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Shipping</p>
            <p className="font-medium">{formatCurrency(invoice.shippingCost)}</p>
          </div>
        </div>

        {(invoice.billingAddress || invoice.shippingAddress || invoice.paymentTerms) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 pt-4 border-t">
            {invoice.billingAddress && (
              <div>
                <p className="text-sm text-gray-500">Billing Address</p>
                <p className="font-medium whitespace-pre-line">{invoice.billingAddress}</p>
              </div>
            )}
            {invoice.shippingAddress && (
              <div>
                <p className="text-sm text-gray-500">Shipping Address</p>
                <p className="font-medium whitespace-pre-line">{invoice.shippingAddress}</p>
              </div>
            )}
            {invoice.paymentTerms && (
              <div>
                <p className="text-sm text-gray-500">Payment Terms</p>
                <p className="font-medium">{invoice.paymentTerms}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Update */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Update Payment Status</h2>
        <div className="flex items-center gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <button
            onClick={handleStatusUpdate}
            disabled={updating || selectedStatus === invoice.paymentStatus}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {updating ? "Updating..." : "Update Status"}
          </button>
        </div>
      </div>

      {/* Linked Order */}
      {invoice.order && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Linked Order</h2>
          <Link href={`/admin/b2b/orders/${invoice.order.id}`} className="text-blue-600 hover:underline">
            Order #{invoice.order.orderNumber || invoice.order.id.slice(0, 8)}
          </Link>
        </div>
      )}

      {/* Items */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">
          Invoice Items ({invoice.items?.length || 0})
        </h2>
        <AdminDataTable
          columns={itemColumns}
          data={invoice.items || []}
          loading={false}
          emptyMessage="No items"
        />
      </div>

      {/* Payments */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">
          Payments ({invoice.payments?.length || 0})
        </h2>
        <AdminDataTable
          columns={paymentColumns}
          data={invoice.payments || []}
          loading={false}
          emptyMessage="No payments recorded"
        />
      </div>
    </div>
  );
}
