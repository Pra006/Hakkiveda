"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import {
  ORDER_STATES,
  PAYMENT_STATES,
  FULFILLMENT_STATES,
  ORDER_TRANSITIONS,
  PAYMENT_TRANSITIONS,
  FULFILLMENT_TRANSITIONS,
  suggestSideEffects,
} from "@/lib/order-state-machine";

// ─── Color utilities ────────────────────────────────────────────────────────
const COLOR_MAP = {
  amber:  { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-500"  },
  blue:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500"   },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
  cyan:   { bg: "bg-cyan-50",   text: "text-cyan-700",   border: "border-cyan-200",   dot: "bg-cyan-500"   },
  green:  { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  dot: "bg-green-500"  },
  red:    { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500"    },
  orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  slate:  { bg: "bg-slate-50",  text: "text-slate-700",  border: "border-slate-200",  dot: "bg-slate-500"  },
};

function colorFor(color) {
  return COLOR_MAP[color] || COLOR_MAP.slate;
}

// ─── State badge ────────────────────────────────────────────────────────────
function StateBadge({ label, color }) {
  const c = colorFor(color);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {label}
    </span>
  );
}

// ─── Native select dropdown (Shopware-style) ───────────────────────────────
function StateSelect({ currentState, states, transitions, onTransition, disabled }) {
  const available = transitions[currentState] || [];
  const current = states[currentState] || { label: currentState, color: "slate" };
  const c = colorFor(current.color);
  const isTerminal = available.length === 0;

  return (
    <select
      value={currentState}
      onChange={(e) => onTransition(e.target.value)}
      disabled={disabled || isTerminal}
      className={`w-full px-3 py-2.5 rounded-lg border text-sm font-medium appearance-none bg-no-repeat cursor-pointer disabled:cursor-default ${c.bg} ${c.text} ${c.border}`}
      style={{ backgroundImage: isTerminal ? "none" : "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath fill='%236b7280' d='M7 7l3-3 3 3m0 6l-3 3-3-3'/%3E%3C/svg%3E\")", backgroundPosition: "right 8px center" }}
    >
      <option value={currentState}>{current.label}</option>
      {available.map((s) => (
        <option key={s} value={s}>{(states[s] || { label: s }).label}</option>
      ))}
    </select>
  );
}

// ─── Confirm modal ──────────────────────────────────────────────────────────
function ConfirmModal({ title, message, suggestions, onConfirm, onCancel }) {
  const [applySuggestions, setApplySuggestions] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Icon name="swap_horiz" size={20} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
          <p className="text-sm text-slate-600">{message}</p>

          {suggestions && Object.keys(suggestions).length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applySuggestions}
                  onChange={(e) => setApplySuggestions(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="text-sm">
                  <span className="font-medium text-blue-800">Also update related statuses:</span>
                  <ul className="mt-1 space-y-0.5 text-blue-700">
                    {suggestions.paymentStatus && (
                      <li>Payment → {PAYMENT_STATES[suggestions.paymentStatus]?.label || suggestions.paymentStatus}</li>
                    )}
                    {suggestions.fulfillmentStatus && (
                      <li>Fulfillment → {FULFILLMENT_STATES[suggestions.fulfillmentStatus]?.label || suggestions.fulfillmentStatus}</li>
                    )}
                  </ul>
                </div>
              </label>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(applySuggestions ? suggestions : null)}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirm, setConfirm] = useState(null); // { title, message, suggestions, payload }

  const fetchOrder = useCallback(async () => {
    const data = await fetch(`/api/admin/customer-orders/${id}`).then((r) => r.json());
    if (!data.error) setOrder(data);
    return data;
  }, [id]);

  useEffect(() => {
    fetchOrder().finally(() => setLoading(false));
  }, [fetchOrder]);

  const patch = async (payload) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/customer-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchOrder();
        toast.success("Order updated");
      } else {
        toast.error(data.error || "Failed to update order");
      }
    } finally {
      setUpdating(false);
    }
  };

  // ─── Transition handlers with confirmation ────────────────────────────────
  const handleOrderTransition = (nextStatus) => {
    const from = ORDER_STATES[order.status]?.label || order.status;
    const to = ORDER_STATES[nextStatus]?.label || nextStatus;
    const suggestions = suggestSideEffects(nextStatus, order.paymentStatus, order.fulfillmentStatus);
    setConfirm({
      title: "Change Order Status",
      message: `Move this order from "${from}" to "${to}"?`,
      suggestions,
      payload: { status: nextStatus },
    });
  };

  const handlePaymentTransition = (nextStatus) => {
    const from = PAYMENT_STATES[order.paymentStatus]?.label || order.paymentStatus;
    const to = PAYMENT_STATES[nextStatus]?.label || nextStatus;
    setConfirm({
      title: "Change Payment Status",
      message: `Move payment from "${from}" to "${to}"?`,
      suggestions: null,
      payload: { paymentStatus: nextStatus },
    });
  };

  const handleFulfillmentTransition = (nextStatus) => {
    const from = FULFILLMENT_STATES[order.fulfillmentStatus]?.label || order.fulfillmentStatus;
    const to = FULFILLMENT_STATES[nextStatus]?.label || nextStatus;
    setConfirm({
      title: "Change Fulfillment Status",
      message: `Move fulfillment from "${from}" to "${to}"?`,
      suggestions: null,
      payload: { fulfillmentStatus: nextStatus },
    });
  };

  const confirmTransition = async (sideEffects) => {
    const payload = { ...confirm.payload };
    if (sideEffects) Object.assign(payload, sideEffects);
    setConfirm(null);
    await patch(payload);
  };

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

  // ─── Loading / empty ──────────────────────────────────────────────────────
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
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          suggestions={confirm.suggestions}
          onConfirm={confirmTransition}
          onCancel={() => setConfirm(null)}
        />
      )}

      <AdminPageHeader title={`Order ${order.orderNumber}`} description={`Placed by ${customerName}`}>
        <button onClick={() => router.push("/admin/customer-orders")} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <Icon name="arrow_back" size={18} /> Back
        </button>
      </AdminPageHeader>


      {/* ── State Management (Shopware-style) ────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm text-slate-600 mb-1.5 font-medium">Payment status</label>
            <StateSelect
              currentState={order.paymentStatus || "PENDING"}
              states={PAYMENT_STATES}
              transitions={PAYMENT_TRANSITIONS}
              onTransition={handlePaymentTransition}
              disabled={updating}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1.5 font-medium">Delivery status</label>
            <StateSelect
              currentState={order.fulfillmentStatus || "UNFULFILLED"}
              states={FULFILLMENT_STATES}
              transitions={FULFILLMENT_TRANSITIONS}
              onTransition={handleFulfillmentTransition}
              disabled={updating}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1.5 font-medium">Order status</label>
            <StateSelect
              currentState={order.status}
              states={ORDER_STATES}
              transitions={ORDER_TRANSITIONS}
              onTransition={handleOrderTransition}
              disabled={updating}
            />
          </div>
        </div>
      </div>

      {/* ── Items ──────────────────────────────────────────────────────────── */}
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


      {/* ── Customer + Order summary ───────────────────────────────────────── */}
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

      {/* ── Addresses ──────────────────────────────────────────────────────── */}
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

      {/* ── Delivery & Tracking ────────────────────────────────────────────── */}
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

      {/* ── Payments ───────────────────────────────────────────────────────── */}
      {order.payments?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Payments</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {order.payments.map((p) => {
              const isEsewa = p.method === "ESEWA";
              const canVerify = isEsewa && p.transactionUuid && p.status !== "COMPLETED" && p.status !== "REFUNDED";
              const verify = async () => {
                setUpdating(true);
                try {
                  const r = await fetch(`/api/admin/customer-orders/${id}/verify-payment`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentId: p.id }),
                  });
                  const data = await r.json();
                  await fetchOrder();
                  if (r.ok) {
                    const msg = data.status === "COMPLETED"
                      ? "Payment verified successfully — marked as COMPLETED."
                      : data.status === "NOT_FOUND"
                      ? "eSewa has not registered this transaction yet. Try again in a few minutes."
                      : data.status === "FAILED"
                      ? `Payment verification confirmed FAILED: ${data.error || "eSewa rejected the transaction."}`
                      : `Verification returned: ${data.status}${data.error ? " — " + data.error : ""}`;
                    if (data.status === "COMPLETED") toast.success(msg);
                    else if (data.status === "FAILED") toast.error(msg);
                    else toast.info(msg);
                  } else {
                    toast.error(data.error || "Verification request failed");
                  }
                } finally {
                  setUpdating(false);
                }
              };

              const statusColor = {
                COMPLETED: "text-green-700 bg-green-50 border-green-200",
                PENDING: "text-amber-700 bg-amber-50 border-amber-200",
                FAILED: "text-red-700 bg-red-50 border-red-200",
                REFUNDED: "text-slate-700 bg-slate-50 border-slate-200",
              }[p.status] || "text-slate-600 bg-slate-50 border-slate-200";

              return (
                <div key={p.id} className="px-6 py-4 space-y-2">
                  <div className="flex items-center justify-between gap-4">
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
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${statusColor}`}>
                        {p.status}
                      </span>
                      {canVerify && (
                        <button
                          onClick={verify}
                          disabled={updating}
                          className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                        >
                          {updating ? "Verifying…" : "Verify with eSewa"}
                        </button>
                      )}
                    </div>
                  </div>
                  {p.status === "FAILED" && p.notes && (
                    <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                      Reason: {p.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Timeline ───────────────────────────────────────────────────────── */}
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

      {/* ── Notes ──────────────────────────────────────────────────────────── */}
      {order.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
