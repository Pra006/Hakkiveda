"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import AdminStatCard from "@/components/admin/ui/AdminStatCard";
import Icon from "@/components/ui/Icon";

const STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const formatCurrency = (amount) =>
  `Rs ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function B2BOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/b2b/orders/${id}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      const data = await res.json();
      setOrder(data);
    } catch (err) {
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const updateStatus = async (newStatus) => {
    if (updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/b2b/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await fetchOrder();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon name="loader" size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 text-gray-500">Order not found</div>
    );
  }

  const allowedTransitions = STATUS_TRANSITIONS[order.status] || [];
  const placedByUser = order.placedBy?.user;

  return (
    <div>
      <AdminPageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed on ${formatDate(order.createdAt)} by ${
          placedByUser
            ? `${placedByUser.firstName} ${placedByUser.lastName}`
            : "Unknown"
        }`}
      >
        <Link
          href="/admin/b2b/orders"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <Icon name="arrow-left" size={16} />
          Back to Orders
        </Link>
      </AdminPageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AdminStatCard
          label="Status"
          value={order.status}
          icon="activity"
        />
        <AdminStatCard
          label="Total"
          value={formatCurrency(order.total)}
          icon="indian-rupee"
        />
        <AdminStatCard
          label="Items"
          value={order.items?.length || 0}
          icon="package"
        />
        <AdminStatCard
          label="Organization"
          value={order.organization?.companyName || "—"}
          icon="building"
        />
      </div>

      {/* Status Update */}
      {allowedTransitions.length > 0 && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Update Status
          </h3>
          <div className="flex flex-wrap gap-2">
            {allowedTransitions.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={updating}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  s === "CANCELLED"
                    ? "border-red-300 text-red-700 hover:bg-red-50"
                    : "border-blue-300 text-blue-700 hover:bg-blue-50"
                } disabled:opacity-50`}
              >
                {updating ? "Updating..." : `Mark as ${s.charAt(0) + s.slice(1).toLowerCase()}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Order Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Discount</span>
              <span className="text-green-600">
                -{formatCurrency(order.discount)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Tax</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Shipping</span>
            <span>{formatCurrency(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
          {order.purchaseOrderId && (
            <div className="flex justify-between pt-2">
              <span className="text-gray-500">PO Number</span>
              <span>{order.purchaseOrderId}</span>
            </div>
          )}
          {order.paymentTerms && (
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Terms</span>
              <span>{order.paymentTerms}</span>
            </div>
          )}
          {order.notes && (
            <div className="pt-2">
              <span className="text-gray-500 block mb-1">Notes</span>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Order Items ({order.items?.length || 0})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium">Qty</th>
                <th className="pb-2 font-medium">Unit Price</th>
                <th className="pb-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">
                    {item.product?.name || "Unknown Product"}
                  </td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2 text-right">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Link */}
      {order.invoice && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Invoice</h3>
          <Link
            href={`/admin/b2b/invoices/${order.invoice.id}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
          >
            <Icon name="file-text" size={16} />
            View Invoice {order.invoice.invoiceNumber || `#${order.invoice.id}`}
          </Link>
        </div>
      )}
    </div>
  );
}
