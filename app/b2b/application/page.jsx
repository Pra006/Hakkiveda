"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";

const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function FileUploadField({ label, currentUrl, value, onUpload, onRemove, uploading, error }) {
  const inputRef = useRef(null);
  const displayValue = value || (currentUrl ? { url: currentUrl, name: "Current document" } : null);
  const isImage = displayValue && !displayValue.url?.endsWith(".pdf");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      onUpload(null, "Invalid file type. Accepted: JPG, PNG, WebP, PDF.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      onUpload(null, "File too large. Maximum size is 5MB.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    onUpload("uploading", null);
    try {
      const res = await fetch("/api/upload/private", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { onUpload(null, data.error || "Upload failed."); return; }
      onUpload({ url: data.url, publicId: data.publicId, name: file.name }, null);
    } catch {
      onUpload(null, "Upload failed. Please try again.");
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-forest-deep mb-1.5">{label}</label>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFile} className="hidden" />
      {!displayValue || displayValue === "uploading" ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center gap-2 transition-all duration-200 ${
            error ? "border-terracotta/40" : "border-outline-variant/50 hover:border-forest-base/40"
          } ${uploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {uploading ? (
            <>
              <Icon name="progress_activity" size={24} className="text-forest-base animate-spin" />
              <span className="text-xs text-on-surface-variant">Uploading...</span>
            </>
          ) : (
            <>
              <Icon name="cloud_upload" size={24} className="text-on-surface-variant/50" />
              <span className="text-xs text-on-surface-variant">Click to upload</span>
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-3 border border-outline-variant/50 rounded-xl px-4 py-3">
          {isImage ? (
            <div className="w-10 h-10 rounded-lg bg-surface-container overflow-hidden shrink-0">
              <img src={displayValue.url} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center shrink-0">
              <Icon name="picture_as_pdf" size={20} className="text-terracotta" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-on-surface font-medium truncate">{displayValue.name}</p>
            <p className="text-[10px] text-on-surface-variant/60">{value ? "New upload" : "Current"}</p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="p-1.5 rounded-lg text-on-surface-variant/50 hover:text-forest-base hover:bg-forest-base/5 transition-colors"
            title="Replace"
          >
            <Icon name="swap_horiz" size={16} />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-terracotta mt-1">{error}</p>}
    </div>
  );
}

export default function B2BApplicationStatusPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploadErrors, setUploadErrors] = useState({});

  const [citizenshipNumber, setCitizenshipNumber] = useState("");
  const [citizenshipFront, setCitizenshipFront] = useState(null);
  const [citizenshipBack, setCitizenshipBack] = useState(null);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  const fetchApp = useCallback(() => {
    fetch("/api/b2b/application")
      .then((r) => r.json())
      .then((data) => {
        if (data.application) {
          setApp(data.application);
          setCitizenshipNumber(data.application.citizenshipNumber || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchApp();
    else if (status !== "loading") setLoading(false);
  }, [status, fetchApp]);

  function handleFrontUpload(result, err) {
    if (result === "uploading") { setUploadingFront(true); return; }
    setUploadingFront(false);
    if (err) { setUploadErrors((p) => ({ ...p, front: err })); return; }
    setCitizenshipFront(result);
    setUploadErrors((p) => ({ ...p, front: "" }));
  }

  function handleBackUpload(result, err) {
    if (result === "uploading") { setUploadingBack(true); return; }
    setUploadingBack(false);
    if (err) { setUploadErrors((p) => ({ ...p, back: err })); return; }
    setCitizenshipBack(result);
    setUploadErrors((p) => ({ ...p, back: "" }));
  }

  async function handleResubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const body = {};
      if (citizenshipNumber !== app.citizenshipNumber) body.citizenshipNumber = citizenshipNumber;
      if (citizenshipFront) body.citizenshipFrontUrl = citizenshipFront.url;
      if (citizenshipBack) body.citizenshipBackUrl = citizenshipBack.url;

      const res = await fetch("/api/b2b/application/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update."); return; }
      setSuccess(true);
      fetchApp();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <Icon name="hourglass_empty" size={24} className="animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/login?callbackUrl=/b2b/application");
    return null;
  }

  if (!app) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <Icon name="description" size={48} className="text-slate-300 mx-auto mb-3" />
          <h1 className="font-headline text-xl text-forest-deep mb-2">No Application Found</h1>
          <p className="text-sm text-on-surface-variant mb-4">
            You haven&apos;t submitted a B2B registration yet.
          </p>
          <a href="/auth/register" className="text-sm text-forest-base hover:text-antique-gold font-semibold">
            Register as B2B Business →
          </a>
        </div>
      </div>
    );
  }

  const statusConfig = {
    PENDING: { icon: "hourglass_empty", color: "text-amber-600 bg-amber-50 border-amber-200", label: "Pending Review" },
    UNDER_REVIEW: { icon: "rate_review", color: "text-blue-600 bg-blue-50 border-blue-200", label: "Under Review" },
    MORE_INFORMATION_REQUIRED: { icon: "help", color: "text-orange-600 bg-orange-50 border-orange-200", label: "More Information Required" },
    APPROVED: { icon: "check_circle", color: "text-green-600 bg-green-50 border-green-200", label: "Approved" },
    REJECTED: { icon: "cancel", color: "text-red-600 bg-red-50 border-red-200", label: "Rejected" },
    SUSPENDED: { icon: "block", color: "text-red-800 bg-red-50 border-red-200", label: "Suspended" },
  };

  const sc = statusConfig[app.status] || statusConfig.PENDING;
  const needsMoreInfo = app.status === "MORE_INFORMATION_REQUIRED";

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-forest-deep text-ivory-canvas py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-headline text-2xl sm:text-3xl mb-2">Your B2B Application</h1>
          <p className="text-ivory-canvas/70 text-sm">Track the status of your business application</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Status Card */}
        <div className={`rounded-xl border p-6 ${sc.color}`}>
          <div className="flex items-center gap-3 mb-2">
            <Icon name={sc.icon} size={24} />
            <h2 className="font-semibold text-lg">{sc.label}</h2>
          </div>
          <p className="text-sm opacity-80">
            Application: {app.applicationNumber}
            {app.createdAt && ` · Submitted ${new Date(app.createdAt).toLocaleDateString()}`}
          </p>
        </div>

        {/* More Info Message + Resubmission Form */}
        {needsMoreInfo && (
          <>
            {app.moreInfoMessage && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                <div className="flex items-start gap-2 mb-2">
                  <Icon name="info" size={18} className="text-orange-600 mt-0.5" />
                  <h3 className="font-semibold text-orange-800">Information Requested by Admin</h3>
                </div>
                <p className="text-sm text-orange-700 ml-6">{app.moreInfoMessage}</p>
              </div>
            )}

            {success ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <Icon name="check_circle" size={32} className="text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800 mb-1">Application Updated</h3>
                <p className="text-sm text-green-700">Your application has been resubmitted for review.</p>
              </div>
            ) : (
              <form onSubmit={handleResubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                <h3 className="font-semibold text-forest-deep flex items-center gap-2">
                  <Icon name="edit" size={18} />
                  Update Your Information
                </h3>

                {error && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                    <Icon name="error" size={16} />
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-forest-deep mb-1.5">Citizenship Number</label>
                  <input
                    type="text"
                    value={citizenshipNumber}
                    onChange={(e) => setCitizenshipNumber(e.target.value)}
                    placeholder="e.g. 12-34-56-78901"
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-forest-base/20 focus:border-forest-base/40"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FileUploadField
                    label="Citizenship Front Side"
                    currentUrl={app.citizenshipFrontUrl}
                    value={citizenshipFront}
                    uploading={uploadingFront}
                    onUpload={handleFrontUpload}
                    onRemove={() => setCitizenshipFront(null)}
                    error={uploadErrors.front}
                  />
                  <FileUploadField
                    label="Citizenship Back Side"
                    currentUrl={app.citizenshipBackUrl}
                    value={citizenshipBack}
                    uploading={uploadingBack}
                    onUpload={handleBackUpload}
                    onRemove={() => setCitizenshipBack(null)}
                    error={uploadErrors.back}
                  />
                </div>

                <p className="text-[11px] text-on-surface-variant/60 flex items-center gap-1.5">
                  <Icon name="lock" size={12} />
                  Your documents are encrypted and only accessible to authorized reviewers.
                </p>

                <button
                  type="submit"
                  disabled={submitting || uploadingFront || uploadingBack}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-forest-base text-ivory-canvas rounded-xl font-semibold text-sm hover:bg-forest-deep active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Icon name="hourglass_empty" size={18} className="animate-spin" />
                      Resubmitting...
                    </>
                  ) : (
                    <>
                      <Icon name="send" size={18} />
                      Resubmit Application
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* Application Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-forest-deep mb-4">Application Details</h3>
          <dl className="space-y-3 text-sm">
            {app.storeName && (
              <div className="flex justify-between"><dt className="text-slate-500">Store Name</dt><dd className="font-medium">{app.storeName}</dd></div>
            )}
            {app.companyName && (
              <div className="flex justify-between"><dt className="text-slate-500">Company</dt><dd className="font-medium">{app.companyName}</dd></div>
            )}
            {app.businessType && (
              <div className="flex justify-between"><dt className="text-slate-500">Business Type</dt><dd>{app.businessType.replace(/_/g, " ")}</dd></div>
            )}
            {app.province && (
              <div className="flex justify-between"><dt className="text-slate-500">Location</dt><dd>{[app.city, app.district, app.province].filter(Boolean).join(", ")}</dd></div>
            )}
          </dl>
        </div>

        {/* Approved → link to portal */}
        {app.status === "APPROVED" && app.organization && (
          <div className="text-center">
            <a
              href="/b2b"
              className="inline-flex items-center gap-2 px-6 py-3 bg-forest-base text-ivory-canvas rounded-xl font-semibold text-sm hover:bg-forest-deep transition-colors"
            >
              <Icon name="dashboard" size={16} />
              Go to B2B Portal
            </a>
          </div>
        )}

        <div className="text-center">
          <a href="/" className="text-sm text-forest-deep hover:text-antique-gold font-semibold">
            ← Back to Store
          </a>
        </div>
      </div>
    </div>
  );
}
