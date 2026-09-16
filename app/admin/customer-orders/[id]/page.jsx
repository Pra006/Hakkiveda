"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"];

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/customer-orders/${id}`)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setOrder(data); })
      .finally(() => setLoading(false));
  }, [id]);

  const patch = async (payload) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/customer-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Refetch to include new timeline events and normalized fields
        const fresh = await fetch(`/api/admin/customer-orders/${id}`).then((r) => r.json());
        if (!fresh.error) setOrder(fresh);
      }
    } finally {
      setUpdating(false);
    }
  };

  const updateStatus = (status) => patch({ status });

  const saveTracking = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    patch({
      shippingMethod: f.get("shippingMethod") || null,
      courier: f.get("courier") || null,
      trackingNumber: f.get("trackingNumber") || null,
      estimatedDeliveryDate: f.get("estimatedDeliveryDate") || null,
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <Icon name="error" size={48} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Order not found</p>
        <button onClick={() => router.push("/admin/customer-orders")} className="mt-4 text-blue-600 hover:underline text-sm">
          Back to Orders
        </button>
      </div>
    );
  }

  const customer = order.customer;
  const customerName = [customer?.user?.firstName, customer?.user?.lastName].filter(Boolean).join(" ") || "—";

  return (
    <div className="space-y-6">
      <AdminPageHeader title={`Order ${order.orderNumber}`} description={`Placed by ${customerName}`}>
        <button onClick={() => router.push("/admin/customer-orders")} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <Icon name="arrow_back" size={18} /> Back
        </button>
      </AdminPageHeader>

      {/* Status + update */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Order</p>
            <AdminStatusBadge status={order.status} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Payment</p>
            <AdminStatusBadge status={order.paymentStatus || "PENDING"} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Fulfillment</p>
            <AdminStatusBadge status={order.fulfillmentStatus || "UNFULFILLED"} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
          {STATUSES.filter((s) => s !== order.status).map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={updating}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50"
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Customer + order info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Customer</h3>
          <div className="text-sm space-y-1 text-slate-600">
            <p className="font-medium text-slate-900">{customerName}</p>
            <p>{customer?.user?.email}</p>
            {customer?.user?.phone && <p>{customer.user.phone}</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Order Summary</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{order.currency || "NPR"} {(order.subtotal || 0).toLocaleString()}</span></div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span className="text-red-500">-{order.currency || "NPR"} {order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>{order.currency || "NPR"} {(order.tax || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span>{order.currency || "NPR"} {(order.shippingCost || 0).toLocaleString()}</span></div>
            <div className="flex justify-between font-semibold border-t border-slate-100 pt-2"><span>Total</span><span>{order.currency || "NPR"} {(order.total || 0).toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      {/* Addresses — snapshot preferred, falls back to linked address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Shipping Address</h3>
          {order.shippingStreet || order.shippingCity || order.shippingAddress ? (
            <div className="text-sm text-slate-600 space-y-0.5">
              <p className="font-medium text-slate-900">{order.shippingFullName || order.shippingAddress?.fullName || "—"}</p>
              {(order.shippingPhone || order.shippingAddress?.phone) && <p>{order.shippingPhone || order.shippingAddress.phone}</p>}
              <p>{[
                order.shippingStreet || order.shippingAddress?.streetAddress,
                order.shippingCity || order.shippingAddress?.city,
                order.shippingState || order.shippingAddress?.province,
                order.shippingPostalCode || order.shippingAddress?.postalCode,
                order.shippingCountry,
              ].filter(Boolean).join(", ")}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Not provided</p>
          )}
        </div>
        {order.billingAddress && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Billing Address</h3>
            <p className="text-sm text-slate-600">
              {[order.billingAddress.streetAddress, order.billingAddress.city, order.billingAddress.district, order.billingAddress.province].filter(Boolean).join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Delivery / tracking */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Delivery &amp; Tracking</h3>
        <form onSubmit={saveTracking} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Shipping method</label>
            <input name="shippingMethod" defaultValue={order.shippingMethod || ""} className="form-input w-full" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Courier</label>
            <input name="courier" defaultValue={order.courier || ""} className="form-input w-full" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tracking number</label>
            <input name="trackingNumber" defaultValue={order.trackingNumber || ""} className="form-input w-full" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Estimated delivery</label>
            <input type="date" name="estimatedDeliveryDate" defaultValue={order.estimatedDeliveryDate?.slice(0, 10) || ""} className="form-input w-full" />
          </div>
          <div className="sm:col-span-2 text-xs text-slate-500 space-y-0.5">
            <p>Shipped at: {order.shippedAt ? new Date(order.shippedAt).toLocaleString() : "—"}</p>
            <p>Delivered at: {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={updating} className="btn btn-primary text-sm disabled:opacity-50">
              {updating ? "Saving…" : "Save tracking"}
            </button>
          </div>
        </form>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Order Items ({order.items?.length || 0})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {order.items?.map((item) => {
            const snapImg = item.productImage || item.product?.images?.[0];
            const snapName = item.productName || item.product?.name || "Product";
            const snapSku = item.productSku || item.product?.sku;
            return (
              <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                  {snapImg ? (
                    <img src={snapImg} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Icon name="image" size={20} className="text-slate-300" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{snapName}</p>
                  <p className="text-xs text-slate-500">
                    {snapSku ? `SKU ${snapSku} · ` : ""}Qty: {item.quantity} × {order.currency || "NPR"} {(item.unitPrice || 0).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-medium">{order.currency || "NPR"} {(item.total || 0).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payments */}
      {order.payments?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Payments</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {order.payments.map((p) => {
              const isEsewa = p.method === "ESEWA";
              const canVerify = isEsewa && p.transactionUuid && p.status !== "COMPLETED";
              const verify = async () => {
                setUpdating(true);
                try {
                  const r = await fetch(`/api/admin/customer-orders/${id}/verify-payment`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentId: p.id }),
                  });
                  const data = await r.json();
                  if (r.ok) {
                    const fresh = await fetch(`/api/admin/customer-orders/${id}`).then((x) => x.json());
                    if (!fresh.error) setOrder(fresh);
                    alert(`Verification result: ${data.status}${data.error ? " — " + data.error : ""}`);
                  } else {
                    alert(data.error || "Verification failed");
                  }
                } finally {
                  setUpdating(false);
                }
              };
              return (
                <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{p.currency || "NPR"} {(p.amount || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {p.method}
                      {p.transactionUuid ? ` · uuid ${p.transactionUuid}` : ""}
                      {p.providerRefId ? ` · eSewa ref ${p.providerRefId}` : ""}
                      {p.transactionId && !p.transactionUuid ? ` · txn ${p.transactionId}` : ""}
                      {" · "}
                      {new Date(p.completedAt || p.paidAt || p.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <AdminStatusBadge status={p.status} />
                    {canVerify && (
                      <button
                        onClick={verify}
                        disabled={updating}
                        className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                      >
                        Verify with eSewa
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Timeline</h3>
        </div>
        {order.events?.length > 0 ? (
          <ol className="divide-y divide-slate-100">
            {order.events.map((ev) => (
              <li key={ev.id} className="px-6 py-3 flex items-start gap-3 text-sm">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-slate-900">{ev.message}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(ev.createdAt).toLocaleString()} · {ev.actor?.toLowerCase() || "system"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-slate-400">
            No events yet — status changes will appear here.
          </div>
        )}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
