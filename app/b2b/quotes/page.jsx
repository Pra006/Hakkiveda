"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import B2BStatusBadge from "@/components/b2b/B2BStatusBadge";
import { formatNPR } from "@/lib/utils";
import { toast } from "react-toastify";

export default function QuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);

  useEffect(() => {
    fetch("/api/b2b/quotes")
      .then((r) => r.json())
      .then((data) => setQuotes(data.quotations || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleAccept(quoteId) {
    if (!confirm("Accept this quotation? A purchase order will be created.")) return;
    setAccepting(quoteId);
    try {
      const res = await fetch(`/api/b2b/quotes/${quoteId}/accept`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        // Refresh
        const updated = await fetch("/api/b2b/quotes").then((r) => r.json());
        setQuotes(updated.quotations || []);
      } else {
        toast.error(data.error || "Failed to accept quote");
      }
    } finally {
      setAccepting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon name="hourglass_empty" size={24} className="animate-spin text-on-surface-variant" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline text-3xl text-forest-deep">Quotations</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">{quotes.length} quotations</p>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest border border-outline-variant/60 rounded-xl">
          <Icon name="description" size={48} className="text-outline-variant mx-auto mb-4" />
          <p className="text-on-surface-variant text-sm">No quotations received yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((q) => (
            <div key={q.id} className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <div className="font-semibold text-forest-deep">{q.quoteNumber}</div>
                  {q.rfq && (
                    <div className="text-xs text-on-surface-variant">RFQ: {q.rfq.rfqNumber}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <B2BStatusBadge status={q.status} />
                  {q.status === "SENT" && (
                    <button
                      onClick={() => handleAccept(q.id)}
                      disabled={accepting === q.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-herbal-jade text-ivory-canvas text-xs font-semibold rounded hover:brightness-95 disabled:opacity-60 transition-all"
                    >
                      <Icon name="check" size={14} />
                      {accepting === q.id ? "..." : "Accept"}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant mb-2">
                <span>{q.items.length} item{q.items.length !== 1 ? "s" : ""}</span>
                {q.validUntil && (
                  <span>Valid until: {new Date(q.validUntil).toLocaleDateString()}</span>
                )}
                {q.paymentTerms && <span>Terms: {q.paymentTerms.replace(/_/g, " ")}</span>}
              </div>

              <div className="font-headline text-xl text-forest-deep">
                {formatNPR(q.total)}
              </div>

              {q.purchaseOrder && (
                <div className="mt-2 text-xs text-herbal-jade font-semibold">
                  PO created: {q.purchaseOrder.poNumber}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
