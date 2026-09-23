"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

/* ── Tiny helpers ─────────────────────────────────────── */

function InfoItem({ icon, label, value, mono }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon name={icon} size={16} className="text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
        <p className={`text-sm text-slate-800 font-medium mt-0.5 break-words ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

function Card({ title, icon, accent, children, className = "", action }) {
  const accentBar = {
    blue: "border-t-blue-500",
    green: "border-t-green-500",
    amber: "border-t-amber-500",
    purple: "border-t-purple-500",
    slate: "border-t-slate-300",
  };
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 border-t-[3px] ${accentBar[accent] || accentBar.slate} shadow-sm overflow-hidden ${className}`}>
      <div className="px-6 pt-5 pb-4 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-[15px]">
          <Icon name={icon} size={20} className="text-slate-400" />
          {title}
        </h3>
        {action}
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}

function StatusBanner({ icon, color, title, children, date, dateLabel }) {
  const styles = {
    orange: "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 text-orange-800",
    blue: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800",
    red: "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800",
    green: "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800",
  };
  return (
    <div className={`rounded-2xl border p-5 ${styles[color]}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
          <Icon name={icon} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          {children && <p className="text-sm opacity-80 mt-1">{children}</p>}
          {date && (
            <p className="text-xs opacity-50 mt-2">{dateLabel || "Date"}: {new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function VerificationBadge({ label, status, onVerify, onReject, disabled }) {
  const cfg = {
    PENDING: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "hourglass_empty", dot: "bg-amber-400" },
    VERIFIED: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "check_circle", dot: "bg-green-500" },
    REJECTED: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "cancel", dot: "bg-red-500" },
  };
  const c = cfg[status] || cfg.PENDING;
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${c.bg} ${c.border}`}>
      <div className="flex items-center gap-2.5">
        <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
        <span className={`text-sm font-semibold ${c.text}`}>{label}</span>
        <span className={`text-xs ${c.text} opacity-70`}>{status}</span>
      </div>
      <div className="flex gap-2">
        {status !== "VERIFIED" && (
          <button onClick={onVerify} disabled={disabled} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors font-medium">
            Verify
          </button>
        )}
        {status !== "VERIFIED" && status !== "REJECTED" && (
          <button onClick={onReject} disabled={disabled} className="text-xs px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors font-medium">
            Reject
          </button>
        )}
        {status === "VERIFIED" && <Icon name="verified" size={20} className="text-green-500" />}
      </div>
    </div>
  );
}

function ActionModal({ title, onClose, onSubmit, submitLabel, submitColor = "bg-red-600 hover:bg-red-700", children, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-lg text-slate-900 mb-4">{title}</h3>
        {children}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 transition-colors">
            Cancel
          </button>
          <button onClick={onSubmit} disabled={loading} className={`px-5 py-2 text-sm text-white rounded-lg disabled:opacity-50 transition-colors font-medium ${submitColor}`}>
            {loading ? "Processing…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────── */

export default function B2BApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(true);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showMoreInfoModal, setShowMoreInfoModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [moreInfoMessage, setMoreInfoMessage] = useState("");
  const [suspendReason, setSuspendReason] = useState("");

  const [docUrls, setDocUrls] = useState({});
  const [docLoading, setDocLoading] = useState({});

  const fetchApp = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/b2b/applications/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setApp(data);
          setAdminNotes(data.internalNotes || "");
          setNotesSaved(true);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchApp(); }, [fetchApp]);

  const updateStatus = async (status, extra = {}) => {
    if (status === "APPROVED" && app.status !== "SUSPENDED" && !confirm("Approve this application? This will create a B2B organization and add the applicant as owner.")) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/b2b/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes, ...extra }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Application ${status.toLowerCase().replace(/_/g, " ")}`);
        fetchApp();
        setShowRejectModal(false);
        setShowMoreInfoModal(false);
        setShowSuspendModal(false);
        setRejectionReason("");
        setMoreInfoMessage("");
        setSuspendReason("");
      } else {
        toast.error(data.error || "Failed to update");
      }
    } finally {
      setUpdating(false);
    }
  };

  const updateVerification = async (action, verificationStatus) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/b2b/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, verificationStatus }),
      });
      if (res.ok) {
        toast.success("Verification updated");
        fetchApp();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update verification");
      }
    } finally {
      setUpdating(false);
    }
  };

  const saveNotes = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/b2b/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_notes", adminNotes }),
      });
      if (res.ok) {
        toast.success("Notes saved");
        setNotesSaved(true);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save notes");
      }
    } finally {
      setUpdating(false);
    }
  };

  const viewDocument = async (url, key) => {
    if (docUrls[key]) { window.open(docUrls[key], "_blank", "noopener"); return; }
    setDocLoading((p) => ({ ...p, [key]: true }));
    try {
      const res = await fetch(`/api/admin/documents?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.signedUrl) {
        setDocUrls((p) => ({ ...p, [key]: data.signedUrl }));
        window.open(data.signedUrl, "_blank", "noopener");
      } else { toast.error("Failed to load document"); }
    } finally { setDocLoading((p) => ({ ...p, [key]: false })); }
  };

  /* ── Loading / empty ── */

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-2/5" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-100 rounded-2xl" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-24">
        <Icon name="error" size={48} className="text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 mb-4">Application not found</p>
        <button onClick={() => router.push("/admin/b2b/applications")} className="text-blue-600 hover:underline text-sm font-medium">
          ← Back to Applications
        </button>
      </div>
    );
  }

  const canReview = ["PENDING", "UNDER_REVIEW", "CONTACT_REQUIRED", "MORE_INFORMATION_REQUIRED"].includes(app.status);
  const canSuspend = app.status === "APPROVED";
  const canReinstate = app.status === "SUSPENDED";
  const contactName = app.contactPersonName || [app.user?.firstName, app.user?.lastName].filter(Boolean).join(" ") || app.user?.email || "—";
  const companyDisplay = app.companyName || app.storeName || "—";
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => router.push("/admin/b2b/applications")} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-2 transition-colors">
            <Icon name="arrow_back" size={14} /> All Applications
          </button>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            {companyDisplay}
            <AdminStatusBadge status={app.status} />
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {app.applicationNumber} · Submitted {fmtDate(app.submittedAt)}
          </p>
        </div>
      </div>

      {/* ── Actions bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4">
        <div className="flex items-center gap-2 flex-wrap">
          {canReview && (
            <>
              {app.status !== "UNDER_REVIEW" && (
                <button onClick={() => updateStatus("UNDER_REVIEW")} disabled={updating} className="text-sm px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors font-medium">
                  <Icon name="rate_review" size={16} className="inline mr-1.5 -mt-0.5" />Mark Under Review
                </button>
              )}
              <button onClick={() => setShowMoreInfoModal(true)} disabled={updating} className="text-sm px-4 py-2 rounded-xl border border-orange-200 text-orange-700 hover:bg-orange-50 disabled:opacity-40 transition-colors font-medium">
                <Icon name="help" size={16} className="inline mr-1.5 -mt-0.5" />Request Info
              </button>
              <div className="flex-1" />
              <button onClick={() => setShowRejectModal(true)} disabled={updating} className="text-sm px-5 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-40 transition-colors font-medium">
                Reject
              </button>
              <button onClick={() => updateStatus("APPROVED")} disabled={updating} className="text-sm px-5 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors font-medium shadow-sm">
                <Icon name="check" size={16} className="inline mr-1.5 -mt-0.5" />Approve
              </button>
            </>
          )}
          {canSuspend && (
            <>
              <div className="flex-1" />
              <button onClick={() => setShowSuspendModal(true)} disabled={updating} className="text-sm px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors font-medium">
                <Icon name="block" size={16} className="inline mr-1.5 -mt-0.5" />Suspend
              </button>
            </>
          )}
          {canReinstate && (
            <>
              <div className="flex-1" />
              <button onClick={() => updateStatus("APPROVED")} disabled={updating} className="text-sm px-5 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 transition-colors font-medium shadow-sm">
                <Icon name="undo" size={16} className="inline mr-1.5 -mt-0.5" />Reinstate
              </button>
            </>
          )}
          {!canReview && !canSuspend && !canReinstate && (
            <span className="text-sm text-slate-400">No actions available for this status.</span>
          )}
        </div>
      </div>

      {/* ── Status banners ── */}
      {app.status === "MORE_INFORMATION_REQUIRED" && app.moreInfoMessage && (
        <StatusBanner icon="help" color="orange" title="Information Requested" date={app.moreInfoRequestedAt} dateLabel="Requested">
          {app.moreInfoMessage}
        </StatusBanner>
      )}
      {app.status === "CONTACT_REQUIRED" && (
        <StatusBanner icon="phone_callback" color="blue" title="Contact Required">
          This applicant needs to be contacted directly to proceed.
        </StatusBanner>
      )}
      {app.status === "REJECTED" && (
        <StatusBanner icon="cancel" color="red" title="Application Rejected" date={app.rejectedAt} dateLabel="Rejected">
          {app.rejectionReason}
        </StatusBanner>
      )}
      {app.status === "SUSPENDED" && (
        <StatusBanner icon="block" color="red" title="Suspended" date={app.suspendedAt} dateLabel="Suspended">
          {app.suspendedReason}
        </StatusBanner>
      )}
      {app.organization && (
        <StatusBanner icon="check_circle" color="green" title="B2B Account Active" date={app.approvedAt} dateLabel="Approved">
          {app.organization.companyName} — {app.organization.organizationNumber}
        </StatusBanner>
      )}

      {/* ── Identity Verification ── */}
      {(app.citizenshipNumber || app.citizenshipFrontUrl || app.citizenshipBackUrl) && (
        <Card title="Identity Verification" icon="badge" accent="blue">
          {app.citizenshipNumber && (
            <div className="mb-4 px-4 py-3 bg-slate-50 rounded-xl">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Citizenship Number</span>
              <p className="text-base font-mono font-semibold text-slate-800 mt-0.5">{app.citizenshipNumber}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            {app.citizenshipFrontUrl && (
              <button
                onClick={() => viewDocument(app.citizenshipFrontUrl, "front")}
                disabled={docLoading.front}
                className="group flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                  <Icon name="image" size={20} className="text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm text-slate-800">Front Side</p>
                  <p className="text-xs text-slate-400">{docLoading.front ? "Loading…" : "Click to view document"}</p>
                </div>
                <Icon name="open_in_new" size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
              </button>
            )}
            {app.citizenshipBackUrl && (
              <button
                onClick={() => viewDocument(app.citizenshipBackUrl, "back")}
                disabled={docLoading.back}
                className="group flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                  <Icon name="image" size={20} className="text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm text-slate-800">Back Side</p>
                  <p className="text-xs text-slate-400">{docLoading.back ? "Loading…" : "Click to view document"}</p>
                </div>
                <Icon name="open_in_new" size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            <VerificationBadge
              label="Identity Verification"
              status={app.identityStatus || "PENDING"}
              onVerify={() => updateVerification("verify_identity", "VERIFIED")}
              onReject={() => updateVerification("verify_identity", "REJECTED")}
              disabled={updating}
            />
            <VerificationBadge
              label="Business Info Verification"
              status={app.businessInfoStatus || "PENDING"}
              onVerify={() => updateVerification("verify_business", "VERIFIED")}
              onReject={() => updateVerification("verify_business", "REJECTED")}
              disabled={updating}
            />
          </div>
        </Card>
      )}

      {/* ── Business + Contact side-by-side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card title="Business Information" icon="business" accent="green" className="lg:col-span-3">
          <div className="grid sm:grid-cols-2 gap-x-6">
            <InfoItem icon="corporate_fare" label="Company" value={companyDisplay} />
            <InfoItem icon="category" label="Business Type" value={app.businessType?.replace(/_/g, " ")} />
            <InfoItem icon="public" label="Country" value={app.country} />
            <InfoItem icon="mail" label="Business Email" value={app.businessEmail} />
            <InfoItem icon="phone" label="Phone" value={app.phone || app.businessPhone} />
            {app.whatsapp && <InfoItem icon="chat" label="WhatsApp" value={app.whatsapp} />}
            {app.businessRegNo && <InfoItem icon="pin" label="Business Reg No." value={app.businessRegNo} mono />}
            {app.panVatNo && <InfoItem icon="receipt" label="PAN / VAT" value={app.panVatNo} mono />}
            {app.estimatedOrderVolume && <InfoItem icon="inventory" label="Est. Order Volume" value={app.estimatedOrderVolume.replace(/_/g, " ")} />}
            {app.estimatedPurchaseValue && <InfoItem icon="payments" label="Est. Purchase Value" value={app.estimatedPurchaseValue} />}
            {app.preferredCommunication && <InfoItem icon="forum" label="Preferred Contact" value={app.preferredCommunication.replace(/_/g, " ")} />}
          </div>
        </Card>

        <Card title="Contact Person" icon="person" accent="purple" className="lg:col-span-2">
          <InfoItem icon="badge" label="Name" value={contactName} />
          <InfoItem icon="mail" label="Email" value={app.user?.email} />
          {app.user?.phone && <InfoItem icon="phone" label="Phone" value={app.user.phone} />}
          <InfoItem icon="calendar_today" label="Registered" value={fmtDate(app.user?.createdAt)} />
        </Card>
      </div>

      {/* ── Address ── */}
      {(app.province || app.district || app.city || app.streetAddress) && (
        <Card title="Business Address" icon="location_on" accent="amber">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
            <InfoItem icon="map" label="Province" value={app.province} />
            <InfoItem icon="pin_drop" label="District" value={app.district} />
            <InfoItem icon="location_city" label="City" value={app.city} />
            <InfoItem icon="home" label="Street Address" value={app.streetAddress} />
            {app.postalCode && <InfoItem icon="markunread_mailbox" label="Postal Code" value={app.postalCode} mono />}
          </div>
        </Card>
      )}

      {/* ── Store Description ── */}
      {app.storeDescription && (
        <Card title="Store Description" icon="store" accent="slate">
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{app.storeDescription}</p>
        </Card>
      )}

      {/* ── Products & Requirements ── */}
      {((app.productCategories?.length || app.productsOfInterest?.length) || app.customProductNote || app.customMessage) && (
        <Card title="Products & Requirements" icon="inventory_2" accent="blue">
          {(app.productCategories?.length || app.productsOfInterest?.length) ? (
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Interested Categories</p>
              <div className="flex flex-wrap gap-2">
                {(app.productCategories?.length ? app.productCategories : app.productsOfInterest)?.map((p) => (
                  <span key={p} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full font-medium">{p}</span>
                ))}
              </div>
            </div>
          ) : null}
          {app.customProductNote && (
            <div className="mb-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Additional Notes</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{app.customProductNote}</p>
            </div>
          )}
          {app.customMessage && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Custom Message</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{app.customMessage}</p>
            </div>
          )}
        </Card>
      )}

      {/* ── Target Market ── */}
      {(app.targetMarket || app.targetCountry || app.targetProvince || app.targetCity) && (
        <Card title="Target Market" icon="public" accent="purple">
          <div className="grid sm:grid-cols-2 gap-x-6">
            {app.targetMarket && <InfoItem icon="storefront" label="Market" value={app.targetMarket} />}
            {app.targetCountry && <InfoItem icon="flag" label="Country" value={app.targetCountry} />}
            {app.targetProvince && <InfoItem icon="map" label="Province" value={app.targetProvince} />}
            {app.targetCity && <InfoItem icon="location_city" label="City" value={app.targetCity} />}
          </div>
        </Card>
      )}

      {/* ── Admin Notes ── */}
      <Card title="Admin Notes" icon="note" accent="slate"
        action={
          <button
            onClick={saveNotes}
            disabled={updating || notesSaved}
            className="text-xs px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors font-medium"
          >
            {updating ? "Saving…" : notesSaved ? "Saved" : "Save Notes"}
          </button>
        }
      >
        <textarea
          value={adminNotes}
          onChange={(e) => { setAdminNotes(e.target.value); setNotesSaved(false); }}
          rows={3}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all resize-y bg-slate-50 placeholder:text-slate-400"
          placeholder="Internal notes about this application…"
        />
        {!notesSaved && <p className="text-[11px] text-amber-500 mt-2 font-medium">Unsaved changes</p>}
      </Card>

      {/* ── Audit History ── */}
      {app.auditLogs?.length > 0 && (
        <Card title="Audit History" icon="history" accent="slate">
          <div className="relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200" />
            <div className="space-y-0">
              {app.auditLogs.map((log, i) => (
                <div key={log.id} className="relative flex items-start gap-4 py-3">
                  <div className={`relative z-10 w-[31px] h-[31px] rounded-full flex items-center justify-center shrink-0 ${
                    log.action === "APPROVE" ? "bg-green-100" :
                    log.action === "REJECT" ? "bg-red-100" : "bg-slate-100"
                  }`}>
                    <Icon
                      name={log.action === "APPROVE" ? "check" : log.action === "REJECT" ? "close" : "edit"}
                      size={14}
                      className={
                        log.action === "APPROVE" ? "text-green-600" :
                        log.action === "REJECT" ? "text-red-600" : "text-slate-500"
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm text-slate-700">{log.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {log.admin?.user ? `${log.admin.user.firstName || ""} ${log.admin.user.lastName || ""}`.trim() || log.admin.user.email : "System"} · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded shrink-0 mt-1 ${
                    log.action === "APPROVE" ? "bg-green-50 text-green-600" :
                    log.action === "REJECT" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
                  }`}>{log.action}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ── Modals ── */}
      {showRejectModal && (
        <ActionModal
          title="Reject Application"
          onClose={() => setShowRejectModal(false)}
          onSubmit={() => updateStatus("REJECTED", { rejectionReason })}
          submitLabel="Reject Application"
          loading={updating}
        >
          <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none bg-slate-50"
            placeholder="Reason for rejection…" />
        </ActionModal>
      )}

      {showMoreInfoModal && (
        <ActionModal
          title="Request More Information"
          onClose={() => setShowMoreInfoModal(false)}
          onSubmit={() => {
            if (!moreInfoMessage.trim()) { toast.warn("Please enter a message."); return; }
            updateStatus("MORE_INFORMATION_REQUIRED", { moreInfoMessage });
          }}
          submitLabel="Send Request"
          submitColor="bg-orange-600 hover:bg-orange-700"
          loading={updating}
        >
          <p className="text-sm text-slate-500 mb-3">Describe what additional information or documents are needed.</p>
          <textarea value={moreInfoMessage} onChange={(e) => setMoreInfoMessage(e.target.value)} rows={4}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none bg-slate-50"
            placeholder="e.g. Please re-upload your citizenship — the back side is not legible…" />
        </ActionModal>
      )}

      {showSuspendModal && (
        <ActionModal
          title="Suspend Application"
          onClose={() => setShowSuspendModal(false)}
          onSubmit={() => {
            if (!suspendReason.trim()) { toast.warn("Please enter a reason."); return; }
            updateStatus("SUSPENDED", { suspendedReason: suspendReason });
          }}
          submitLabel="Suspend"
          loading={updating}
        >
          <p className="text-sm text-slate-500 mb-3">This will suspend the approved business. They will lose access to B2B features.</p>
          <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={3}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none bg-slate-50"
            placeholder="Reason for suspension…" />
        </ActionModal>
      )}
    </div>
  );
}
