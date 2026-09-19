"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

function DetailRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className="text-slate-900 font-medium text-right">{children || "—"}</dd>
    </div>
  );
}

function Section({ title, icon, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        {icon && <Icon name={icon} size={18} className="text-slate-400" />}
        {title}
      </h3>
      {children}
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
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onSubmit} disabled={loading} className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${submitColor}`}>
            {loading ? "Processing…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function VerificationToggle({ label, status, onVerify, onReject, disabled }) {
  const colors = {
    PENDING: "bg-amber-50 border-amber-200 text-amber-700",
    VERIFIED: "bg-green-50 border-green-200 text-green-700",
    REJECTED: "bg-red-50 border-red-200 text-red-700",
  };
  const icons = { PENDING: "hourglass_empty", VERIFIED: "check_circle", REJECTED: "cancel" };

  return (
    <div className={`flex items-center justify-between gap-4 p-3 rounded-lg border ${colors[status] || colors.PENDING}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon name={icons[status] || "hourglass_empty"} size={16} />
        <span>{label}: {status}</span>
      </div>
      {status !== "VERIFIED" && (
        <div className="flex gap-2">
          <button onClick={onVerify} disabled={disabled} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            Verify
          </button>
          {status !== "REJECTED" && (
            <button onClick={onReject} disabled={disabled} className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
              Reject
            </button>
          )}
        </div>
      )}
      {status === "VERIFIED" && (
        <Icon name="verified" size={18} className="text-green-600" />
      )}
    </div>
  );
}

export default function B2BApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

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
      if (res.ok) fetchApp();
      else {
        const data = await res.json();
        toast.error(data.error || "Failed to update verification");
      }
    } finally {
      setUpdating(false);
    }
  };

  const viewDocument = async (url, key) => {
    if (docUrls[key]) {
      window.open(docUrls[key], "_blank", "noopener");
      return;
    }
    setDocLoading((p) => ({ ...p, [key]: true }));
    try {
      const res = await fetch(`/api/admin/documents?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.signedUrl) {
        setDocUrls((p) => ({ ...p, [key]: data.signedUrl }));
        window.open(data.signedUrl, "_blank", "noopener");
      } else {
        toast.error("Failed to load document");
      }
    } finally {
      setDocLoading((p) => ({ ...p, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-20">
        <Icon name="error" size={48} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Application not found</p>
        <button onClick={() => router.push("/admin/b2b/applications")} className="mt-4 text-blue-600 hover:underline text-sm">
          Back to Applications
        </button>
      </div>
    );
  }

  const canReview = ["PENDING", "UNDER_REVIEW", "CONTACT_REQUIRED", "MORE_INFORMATION_REQUIRED"].includes(app.status);
  const canSuspend = app.status === "APPROVED";
  const canReinstate = app.status === "SUSPENDED";

  return (
    <div className="space-y-6">
      <AdminPageHeader title={`Application ${app.applicationNumber}`} description={app.companyName || app.storeName}>
        <button onClick={() => router.push("/admin/b2b/applications")} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <Icon name="arrow_back" size={18} /> Back
        </button>
      </AdminPageHeader>

      {/* Status bar + actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Status:</span>
            <AdminStatusBadge status={app.status} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canReview && (
              <>
                {app.status !== "UNDER_REVIEW" && (
                  <button onClick={() => updateStatus("UNDER_REVIEW")} disabled={updating} className="text-xs px-4 py-2 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50">
                    Mark Under Review
                  </button>
                )}
                <button onClick={() => setShowMoreInfoModal(true)} disabled={updating} className="text-xs px-4 py-2 rounded-lg border border-orange-200 text-orange-700 hover:bg-orange-50 disabled:opacity-50">
                  Request More Info
                </button>
                <button onClick={() => updateStatus("APPROVED")} disabled={updating} className="text-xs px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                  Approve
                </button>
                <button onClick={() => setShowRejectModal(true)} disabled={updating} className="text-xs px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                  Reject
                </button>
              </>
            )}
            {canSuspend && (
              <button onClick={() => setShowSuspendModal(true)} disabled={updating} className="text-xs px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                Suspend
              </button>
            )}
            {canReinstate && (
              <button onClick={() => updateStatus("APPROVED")} disabled={updating} className="text-xs px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                Reinstate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* More info message banner */}
      {app.status === "MORE_INFORMATION_REQUIRED" && app.moreInfoMessage && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Icon name="info" size={18} className="text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">Information Requested</p>
              <p className="text-sm text-orange-700 mt-1">{app.moreInfoMessage}</p>
              {app.moreInfoRequestedAt && (
                <p className="text-xs text-orange-500 mt-1">Requested on {new Date(app.moreInfoRequestedAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suspended banner */}
      {app.status === "SUSPENDED" && app.suspendedReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Icon name="block" size={18} className="text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Suspended</p>
              <p className="text-sm text-red-700 mt-1">{app.suspendedReason}</p>
              {app.suspendedAt && (
                <p className="text-xs text-red-500 mt-1">Suspended on {new Date(app.suspendedAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Organization created */}
      {app.organization && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="check_circle" size={20} className="text-green-600" />
            <h3 className="font-semibold text-green-800">Organization Created</h3>
          </div>
          <p className="text-sm text-green-700">
            {app.organization.companyName} ({app.organization.organizationNumber})
          </p>
          <button
            onClick={() => router.push(`/admin/b2b/organizations/${app.organization.id}`)}
            className="mt-2 text-sm text-green-700 hover:underline"
          >
            View Organization →
          </button>
        </div>
      )}

      {/* Identity Verification */}
      {(app.citizenshipNumber || app.citizenshipFrontUrl || app.citizenshipBackUrl) && (
        <Section title="Identity Verification" icon="badge">
          <div className="space-y-4">
            {app.citizenshipNumber && (
              <div className="text-sm">
                <span className="text-slate-500">Citizenship Number:</span>{" "}
                <span className="font-medium text-slate-900">{app.citizenshipNumber}</span>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {app.citizenshipFrontUrl && (
                <button
                  onClick={() => viewDocument(app.citizenshipFrontUrl, "front")}
                  disabled={docLoading.front}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon name="badge" size={20} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Citizenship Front</p>
                    <p className="text-xs text-slate-500">{docLoading.front ? "Loading…" : "Click to view"}</p>
                  </div>
                  <Icon name="open_in_new" size={16} className="text-slate-400 ml-auto" />
                </button>
              )}
              {app.citizenshipBackUrl && (
                <button
                  onClick={() => viewDocument(app.citizenshipBackUrl, "back")}
                  disabled={docLoading.back}
                  className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon name="badge" size={20} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">Citizenship Back</p>
                    <p className="text-xs text-slate-500">{docLoading.back ? "Loading…" : "Click to view"}</p>
                  </div>
                  <Icon name="open_in_new" size={16} className="text-slate-400 ml-auto" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              <VerificationToggle
                label="Identity"
                status={app.identityStatus || "PENDING"}
                onVerify={() => updateVerification("verify_identity", "VERIFIED")}
                onReject={() => updateVerification("verify_identity", "REJECTED")}
                disabled={updating}
              />
              <VerificationToggle
                label="Business Info"
                status={app.businessInfoStatus || "PENDING"}
                onVerify={() => updateVerification("verify_business", "VERIFIED")}
                onReject={() => updateVerification("verify_business", "REJECTED")}
                disabled={updating}
              />
            </div>
          </div>
        </Section>
      )}

      {/* Business details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Business Information" icon="business">
          <dl className="space-y-3 text-sm">
            <DetailRow label="Company">{app.companyName || app.storeName}</DetailRow>
            <DetailRow label="Type"><AdminStatusBadge status={app.businessType} /></DetailRow>
            <DetailRow label="Country">{app.country}</DetailRow>
            <DetailRow label="Email">{app.businessEmail}</DetailRow>
            <DetailRow label="Phone">{app.phone || app.businessPhone}</DetailRow>
            {app.whatsapp && <DetailRow label="WhatsApp">{app.whatsapp}</DetailRow>}
            {app.businessRegNo && <DetailRow label="Business Reg No.">{app.businessRegNo}</DetailRow>}
            {app.panVatNo && <DetailRow label="PAN/VAT">{app.panVatNo}</DetailRow>}
            {app.estimatedOrderVolume && <DetailRow label="Est. Order Volume">{app.estimatedOrderVolume.replace(/_/g, " ")}</DetailRow>}
          </dl>
        </Section>

        <Section title="Contact Person" icon="person">
          <dl className="space-y-3 text-sm">
            <DetailRow label="Name">{app.contactPersonName}</DetailRow>
            <DetailRow label="User Email">{app.user?.email}</DetailRow>
            {app.user?.phone && <DetailRow label="Phone">{app.user.phone}</DetailRow>}
            <DetailRow label="Registered">{new Date(app.user?.createdAt).toLocaleDateString()}</DetailRow>
          </dl>
        </Section>
      </div>

      {/* Address */}
      {(app.province || app.district || app.city) && (
        <Section title="Business Address" icon="location_on">
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <DetailRow label="Province">{app.province}</DetailRow>
            <DetailRow label="District">{app.district}</DetailRow>
            <DetailRow label="City">{app.city}</DetailRow>
            <DetailRow label="Street">{app.streetAddress}</DetailRow>
            <DetailRow label="Postal Code">{app.postalCode}</DetailRow>
          </dl>
        </Section>
      )}

      {/* Store Info */}
      {app.storeDescription && (
        <Section title="Store Description" icon="store">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{app.storeDescription}</p>
        </Section>
      )}

      {/* Products & Requirements */}
      <Section title="Products & Requirements" icon="inventory_2">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500 mb-2">Product Categories</p>
            <div className="flex flex-wrap gap-2">
              {(app.productCategories?.length ? app.productCategories : app.productsOfInterest)?.map((p) => (
                <span key={p} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{p}</span>
              ))}
            </div>
          </div>
          {app.customProductNote && (
            <div>
              <p className="text-sm text-slate-500 mb-1">Additional Notes</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{app.customProductNote}</p>
            </div>
          )}
        </div>
      </Section>

      {/* Target Market */}
      {(app.targetMarket || app.targetCountry || app.targetProvince || app.targetCity) && (
        <Section title="Target Market" icon="public">
          <div className="flex flex-wrap gap-6 text-sm">
            {app.targetMarket && <div><span className="text-slate-500">Market:</span> {app.targetMarket}</div>}
            {app.targetCountry && <div><span className="text-slate-500">Country:</span> {app.targetCountry}</div>}
            {app.targetProvince && <div><span className="text-slate-500">Province:</span> {app.targetProvince}</div>}
            {app.targetCity && <div><span className="text-slate-500">City:</span> {app.targetCity}</div>}
          </div>
        </Section>
      )}

      {/* Admin Notes */}
      <Section title="Admin Notes" icon="note">
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={3}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="Internal notes about this application…"
        />
      </Section>

      {/* Audit History */}
      {app.auditLogs?.length > 0 && (
        <Section title="Audit History" icon="history">
          <div className="space-y-3">
            {app.auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm border-l-2 border-slate-200 pl-4 py-1">
                <div className="flex-1">
                  <p className="text-slate-900">{log.description}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    by {log.admin?.user ? `${log.admin.user.firstName || ""} ${log.admin.user.lastName || ""}`.trim() || log.admin.user.email : "System"} · {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded shrink-0">{log.action}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <ActionModal
          title="Reject Application"
          onClose={() => setShowRejectModal(false)}
          onSubmit={() => updateStatus("REJECTED", { rejectionReason })}
          submitLabel="Reject Application"
          loading={updating}
        >
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            placeholder="Reason for rejection (will be recorded in audit log)…"
          />
        </ActionModal>
      )}

      {/* More Info Modal */}
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
          <p className="text-sm text-slate-500 mb-3">Describe what additional information or documents are needed from the applicant.</p>
          <textarea
            value={moreInfoMessage}
            onChange={(e) => setMoreInfoMessage(e.target.value)}
            rows={4}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            placeholder="e.g. Please re-upload your citizenship document — the back side is not legible…"
          />
        </ActionModal>
      )}

      {/* Suspend Modal */}
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
          <p className="text-sm text-slate-500 mb-3">This will suspend the approved business. The organization will lose access to B2B features.</p>
          <textarea
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            placeholder="Reason for suspension…"
          />
        </ActionModal>
      )}
    </div>
  );
}
