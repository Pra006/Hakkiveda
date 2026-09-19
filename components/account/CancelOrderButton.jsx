"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

export default function CancelOrderButton({ orderId }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel order");
      toast.success("Order cancelled successfully");
      router.refresh();
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to cancel order");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-terracotta bg-terracotta/8 hover:bg-terracotta/15 border border-terracotta/20 transition-all"
      >
        <Icon name="cancel" size={16} />
        Cancel Order
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && <p className="text-xs text-terracotta">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setConfirming(false); setError(null); }}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-all"
        >
          Keep Order
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-terracotta hover:bg-terracotta/90 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Icon name="progress_activity" size={14} className="animate-spin" />
              Cancelling...
            </>
          ) : (
            "Yes, Cancel"
          )}
        </button>
      </div>
    </div>
  );
}
