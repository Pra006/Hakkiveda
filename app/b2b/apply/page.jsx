"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import B2BApplicationSuccess from "@/components/b2b/B2BApplicationSuccess";
import { toast } from "react-toastify";

// ─── Constants ──────────────────────────────────────────────────────────────

const NEPAL_PROVINCES = [
  "Koshi Province",
  "Madhesh Province",
  "Bagmati Province",
  "Gandaki Province",
  "Lumbini Province",
  "Karnali Province",
  "Sudurpashchim Province",
];

const BUSINESS_TYPES = [
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "WHOLESALER", label: "Wholesaler" },
  { value: "RETAILER", label: "Retailer" },
  { value: "IMPORTER", label: "Importer" },
  { value: "ONLINE_SELLER", label: "Online Seller" },
  { value: "PRIVATE_LABEL_BUYER", label: "Private Label Buyer" },
  { value: "CORPORATE_BUYER", label: "Corporate Buyer" },
  { value: "INSTITUTIONAL_BUYER", label: "Institutional Buyer" },
  { value: "SALON_SPA", label: "Salon / Spa" },
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "SOLE_PROPRIETORSHIP", label: "Sole Proprietorship" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "PRIVATE_COMPANY", label: "Private Company" },
  { value: "OTHER", label: "Other" },
];

const ORDER_VOLUMES = [
  { value: "LESS_THAN_100", label: "Less than 100 units / month" },
  { value: "FROM_100_TO_500", label: "100–500 units / month" },
  { value: "FROM_500_TO_1000", label: "500–1,000 units / month" },
  { value: "FROM_1000_TO_5000", label: "1,000–5,000 units / month" },
  { value: "MORE_THAN_5000", label: "5,000+ units / month" },
  { value: "CUSTOM_PROJECT", label: "Custom / Project-Based Order" },
];

const MONTHLY_VALUES = [
  "Under NPR 50,000",
  "NPR 50,000 – 1,00,000",
  "NPR 1,00,000 – 5,00,000",
  "NPR 5,00,000 – 10,00,000",
  "NPR 10,00,000+",
  "Not sure yet",
];

const PRODUCT_CATEGORIES = [
  { value: "ayurvedic-oils", label: "Ayurvedic Oils & Wellness", icon: "spa" },
  { value: "herbal-teas", label: "Herbal Teas & Infusions", icon: "emoji_food_beverage" },
  { value: "handloom-textiles", label: "Handloom Textiles", icon: "checkroom" },
  { value: "wildcrafted-honey", label: "Wildcrafted Honey", icon: "local_florist" },
  { value: "tribal-jewelry", label: "Tribal Jewelry", icon: "diamond" },
  { value: "brass-copperware", label: "Brass & Copperware", icon: "stockpot" },
  { value: "incense-resins", label: "Incense & Resins", icon: "air" },
  { value: "ceramic-pottery", label: "Ceramic & Pottery", icon: "vase" },
  { value: "organic-foods", label: "Organic Foods & Spices", icon: "nutrition" },
  { value: "natural-beauty", label: "Natural Beauty & Skincare", icon: "face_retouching_natural" },
  { value: "handicrafts", label: "Handicrafts & Decor", icon: "palette" },
  { value: "other", label: "Other", icon: "category" },
];

const COMMUNICATION_CHANNELS = [
  { value: "WHATSAPP", label: "WhatsApp", icon: "chat" },
  { value: "PHONE", label: "Phone Call", icon: "phone" },
  { value: "EMAIL", label: "Email", icon: "mail" },
  { value: "WHATSAPP_EMAIL", label: "WhatsApp + Email", icon: "forum" },
];

const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ─── Reusable Form Components ───────────────────────────────────────────────

function FormSection({ icon, title, subtitle, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-forest-base/10 flex items-center justify-center">
          <Icon name={icon} size={20} className="text-forest-base" />
        </div>
        <div>
          <h2 className="text-lg font-headline text-forest-deep">{title}</h2>
          {subtitle && <p className="text-xs text-on-surface-variant">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function FormField({ label, required, error, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-forest-deep mb-1.5">
        {label}
        {required && <span className="text-terracotta ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-on-surface-variant mt-1">{hint}</p>}
      {error && (
        <p className="text-xs text-error mt-1 flex items-center gap-1">
          <Icon name="error" size={12} />
          {error}
        </p>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-forest-base/20 focus:border-forest-base/40 transition-shadow"
      {...rest}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-forest-base/20 focus:border-forest-base/40 transition-shadow appearance-none pr-10"
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
      <Icon
        name="expand_more"
        size={18}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
      />
    </div>
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-forest-base/20 focus:border-forest-base/40 transition-shadow resize-y"
    />
  );
}

function FileUploadField({ label, required, error, value, onUpload, onRemove, uploading }) {
  const inputRef = useRef(null);
  const isImage = value && !value.url?.endsWith(".pdf");

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
    <FormField label={label} required={required} error={error}>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        onChange={handleFile}
        className="hidden"
      />
      {!value || value === "uploading" ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={`
            w-full border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center gap-2
            transition-all duration-200
            ${error
              ? "border-terracotta/40 bg-terracotta/[0.02]"
              : "border-outline-variant/50 bg-surface-container-lowest hover:border-forest-base/40 hover:bg-forest-base/[0.02]"
            }
            ${uploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
          `}
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
              <span className="text-[10px] text-on-surface-variant/50">JPG, PNG, WebP, PDF — max 5MB</span>
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-3 border border-outline-variant/50 rounded-xl px-4 py-3 bg-surface-container-lowest">
          {isImage ? (
            <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden shrink-0">
              <img src={value.url} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-terracotta/10 flex items-center justify-center shrink-0">
              <Icon name="picture_as_pdf" size={24} className="text-terracotta" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-on-surface font-medium truncate">{value.name || "Document"}</p>
            <p className="text-[10px] text-on-surface-variant/60">Uploaded</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-1.5 rounded-lg text-on-surface-variant/50 hover:text-forest-base hover:bg-forest-base/5 transition-colors"
              title="Replace"
            >
              <Icon name="swap_horiz" size={16} />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-lg text-on-surface-variant/50 hover:text-terracotta hover:bg-terracotta/5 transition-colors"
              title="Remove"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
      )}
    </FormField>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function B2BApplicationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [existingApp, setExistingApp] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [errors, setErrors] = useState({});
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  const [form, setForm] = useState({
    contactPerson: "",
    companyName: "",
    countryOfOp: "Nepal",
    businessType: "",
    phone: "",
    businessEmail: "",
    // Identity verification
    citizenshipNumber: "",
    citizenshipFront: null,
    citizenshipBack: null,
    // Business details
    storeName: "",
    businessRegNo: "",
    panVatNo: "",
    businessPhone: "",
    estimatedVolume: "",
    estimatedMonthlyValue: "",
    // Address
    province: "",
    district: "",
    city: "",
    streetAddress: "",
    postalCode: "",
    // Store info
    storeDescription: "",
    productCategories: [],
    // Products & requirements
    productsOfInterest: [],
    customProductNote: "",
    // Target market
    targetCountry: "Nepal",
    targetProvince: "",
    targetCity: "",
    targetTerritory: "",
    customMessage: "",
    // Communication
    preferredChannel: "EMAIL",
    // Agreements
    agreeTerms: false,
    agreePrivacy: false,
  });

  useEffect(() => {
    if (session?.user) {
      setForm((prev) => ({
        ...prev,
        contactPerson: prev.contactPerson || session.user.name || "",
        businessEmail: prev.businessEmail || session.user.email || "",
      }));
    }
  }, [session]);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/b2b/application");
        const data = await res.json();
        if (data.application) setExistingApp(data.application);
      } catch {}
      setCheckingExisting(false);
    }
    if (status === "authenticated") check();
    else if (status !== "loading") setCheckingExisting(false);
  }, [status]);

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  function toggleProduct(product) {
    setForm((prev) => {
      const list = prev.productsOfInterest.includes(product)
        ? prev.productsOfInterest.filter((p) => p !== product)
        : [...prev.productsOfInterest, product];
      return { ...prev, productsOfInterest: list };
    });
  }

  function toggleCategory(cat) {
    setForm((prev) => ({
      ...prev,
      productCategories: prev.productCategories.includes(cat)
        ? prev.productCategories.filter((c) => c !== cat)
        : [...prev.productCategories, cat],
    }));
    setErrors((prev) => ({ ...prev, productCategories: undefined }));
  }

  function handleFrontUpload(result, error) {
    if (result === "uploading") { setUploadingFront(true); return; }
    setUploadingFront(false);
    if (error) { setErrors((prev) => ({ ...prev, citizenshipFront: error })); return; }
    setField("citizenshipFront", result);
  }

  function handleBackUpload(result, error) {
    if (result === "uploading") { setUploadingBack(true); return; }
    setUploadingBack(false);
    if (error) { setErrors((prev) => ({ ...prev, citizenshipBack: error })); return; }
    setField("citizenshipBack", result);
  }

  function validate() {
    const e = {};
    if (!form.contactPerson.trim()) e.contactPerson = "Required";
    if (!form.companyName.trim()) e.companyName = "Required";
    if (!form.countryOfOp.trim()) e.countryOfOp = "Required";
    if (!form.businessType) e.businessType = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    else if (!/^[\d+\-\s()]{7,20}$/.test(form.phone)) e.phone = "Invalid phone number";
    if (!form.businessEmail.trim()) e.businessEmail = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.businessEmail)) e.businessEmail = "Invalid email";
    if (!form.citizenshipNumber.trim()) e.citizenshipNumber = "Required";
    if (!form.citizenshipFront) e.citizenshipFront = "Citizenship front side is required";
    if (!form.citizenshipBack) e.citizenshipBack = "Citizenship back side is required";
    if (!form.storeName.trim()) e.storeName = "Required";
    if (!form.estimatedVolume) e.estimatedVolume = "Required";
    if (!form.province) e.province = "Required";
    if (!form.district.trim()) e.district = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (form.productCategories.length === 0) e.productCategories = "Select at least one category";
    if (!form.agreeTerms) e.agreeTerms = "You must agree to the B2B Terms";
    if (!form.agreePrivacy) e.agreePrivacy = "You must agree to the Privacy Policy";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/b2b/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          citizenshipFrontUrl: form.citizenshipFront?.url || null,
          citizenshipBackUrl: form.citizenshipBack?.url || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        else { setErrors({ _form: data.error || "Something went wrong" }); toast.error(data.error || "Something went wrong"); }
        return;
      }

      setReferenceNumber(data.referenceNumber);
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch {
      setErrors({ _form: "Network error. Please try again." });
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Loading / Auth states ────────────────────────────────────────────────

  if (status === "loading" || checkingExisting) {
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
    router.push("/auth/login?callbackUrl=/b2b/apply");
    return null;
  }

  if (submitted) {
    return <B2BApplicationSuccess referenceNumber={referenceNumber} />;
  }

  if (existingApp) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-antique-gold/10 flex items-center justify-center mb-4">
            <Icon name="info" size={32} className="text-antique-gold" />
          </div>
          <h1 className="font-headline text-2xl text-forest-deep mb-2">
            Application Already Submitted
          </h1>
          <p className="text-sm text-on-surface-variant mb-4">
            You have already submitted a B2B application.
          </p>
          <div className="inline-flex items-center gap-2 bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-2.5 mb-6">
            <Icon name="tag" size={16} className="text-antique-gold" />
            <span className="text-sm font-bold text-forest-deep">
              {existingApp.referenceNumber}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-antique-gold px-2 py-0.5 bg-antique-gold/10 rounded">
              {existingApp.status}
            </span>
          </div>
          {existingApp.organization && (
            <div className="mb-4">
              <a
                href="/b2b"
                className="inline-flex items-center gap-2 px-6 py-3 bg-forest-base text-ivory-canvas border border-antique-gold/40 rounded font-semibold text-sm hover:bg-forest-deep transition-colors"
              >
                <Icon name="dashboard" size={16} />
                Go to B2B Portal
              </a>
            </div>
          )}
          <a href="/" className="text-sm text-forest-deep hover:text-antique-gold font-semibold">
            ← Back to Store
          </a>
        </div>
      </div>
    );
  }

  // ─── Main Form ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-forest-deep text-ivory-canvas py-12 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold tracking-widest uppercase text-antique-gold mb-4">
            <Icon name="handshake" size={14} />
            B2B Partnership
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl mb-3">
            Commercial Partnership Application
          </h1>
          <p className="text-ivory-canvas/70 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Please submit your business profile. Commercial pricing, minimum order
            quantities, and B2B terms will be shared after verification.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {errors._form && (
          <div className="mb-6 px-4 py-3 bg-error/10 border border-error/20 rounded-xl flex items-center gap-2 text-sm text-error" role="alert">
            <Icon name="error" size={18} />
            {errors._form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Section 1: Business Identification */}
          <FormSection icon="business" title="Business Identification" subtitle="Tell us about your company">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Full Name / Contact Person" required error={errors.contactPerson}>
                <TextInput
                  value={form.contactPerson}
                  onChange={(e) => setField("contactPerson", e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </FormField>

              <FormField label="Company / Enterprise Name" required error={errors.companyName}>
                <TextInput
                  value={form.companyName}
                  onChange={(e) => setField("companyName", e.target.value)}
                  placeholder="Company name"
                  autoComplete="organization"
                />
              </FormField>

              <FormField label="Country of Operation" required error={errors.countryOfOp}>
                <TextInput
                  value={form.countryOfOp}
                  onChange={(e) => setField("countryOfOp", e.target.value)}
                  placeholder="Nepal"
                  autoComplete="country-name"
                />
              </FormField>

              <FormField label="Business Type" required error={errors.businessType}>
                <SelectInput
                  value={form.businessType}
                  onChange={(e) => setField("businessType", e.target.value)}
                  options={BUSINESS_TYPES}
                  placeholder="Select business type"
                />
              </FormField>

              <FormField label="Phone / WhatsApp Number" required error={errors.phone}>
                <TextInput
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="+977 98XXXXXXXX"
                  autoComplete="tel"
                />
              </FormField>

              <FormField label="Business Email Address" required error={errors.businessEmail}>
                <TextInput
                  type="email"
                  value={form.businessEmail}
                  onChange={(e) => setField("businessEmail", e.target.value)}
                  placeholder="business@company.com"
                  autoComplete="email"
                />
              </FormField>
            </div>
          </FormSection>

          {/* Section 2: Identity Verification */}
          <FormSection icon="badge" title="Identity Verification" subtitle="Upload your citizenship documents for verification">
            <div className="space-y-4">
              <FormField label="Citizenship Number" required error={errors.citizenshipNumber}>
                <TextInput
                  value={form.citizenshipNumber}
                  onChange={(e) => setField("citizenshipNumber", e.target.value)}
                  placeholder="e.g. 12-34-56-78901"
                />
              </FormField>
              <div className="grid sm:grid-cols-2 gap-4">
                <FileUploadField
                  label="Citizenship Front Side"
                  required
                  error={errors.citizenshipFront}
                  value={form.citizenshipFront}
                  uploading={uploadingFront}
                  onUpload={handleFrontUpload}
                  onRemove={() => setField("citizenshipFront", null)}
                />
                <FileUploadField
                  label="Citizenship Back Side"
                  required
                  error={errors.citizenshipBack}
                  value={form.citizenshipBack}
                  uploading={uploadingBack}
                  onUpload={handleBackUpload}
                  onRemove={() => setField("citizenshipBack", null)}
                />
              </div>
              <p className="text-[11px] text-on-surface-variant/60 flex items-center gap-1.5">
                <Icon name="lock" size={12} />
                Your documents are encrypted and only accessible to authorized admin reviewers.
              </p>
            </div>
          </FormSection>

          {/* Section 3: Business Details */}
          <FormSection icon="store" title="Business Details" subtitle="Additional business information">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Store / Business Name" required error={errors.storeName}>
                <TextInput
                  value={form.storeName}
                  onChange={(e) => setField("storeName", e.target.value)}
                  placeholder="e.g. Himalayan Herbs Co."
                />
              </FormField>

              <FormField label="Estimated Order Volume" required error={errors.estimatedVolume}>
                <SelectInput
                  value={form.estimatedVolume}
                  onChange={(e) => setField("estimatedVolume", e.target.value)}
                  options={ORDER_VOLUMES}
                  placeholder="Select volume range"
                />
              </FormField>

              <FormField label="Estimated Monthly Purchase Value">
                <SelectInput
                  value={form.estimatedMonthlyValue}
                  onChange={(e) => setField("estimatedMonthlyValue", e.target.value)}
                  options={MONTHLY_VALUES.map((v) => ({ value: v, label: v }))}
                  placeholder="Select value range"
                />
              </FormField>

              <FormField label="Business Phone">
                <TextInput
                  type="tel"
                  value={form.businessPhone}
                  onChange={(e) => setField("businessPhone", e.target.value)}
                  placeholder="+977 01-XXXXXXX"
                />
              </FormField>

              <FormField label="Business Registration No." hint="Optional — if registered">
                <TextInput
                  value={form.businessRegNo}
                  onChange={(e) => setField("businessRegNo", e.target.value)}
                  placeholder="e.g. 12345/078/079"
                />
              </FormField>

              <FormField label="PAN / VAT Number" hint="Optional">
                <TextInput
                  value={form.panVatNo}
                  onChange={(e) => setField("panVatNo", e.target.value)}
                  placeholder="e.g. 600123456"
                />
              </FormField>
            </div>

            <div className="mt-4">
              <FormField label="Store Description" hint="Tell buyers what makes your business special">
                <TextArea
                  value={form.storeDescription}
                  onChange={(e) => setField("storeDescription", e.target.value)}
                  placeholder="We craft traditional Ayurvedic oils using wildcrafted herbs from the Himalayan foothills..."
                  rows={3}
                />
              </FormField>
            </div>
          </FormSection>

          {/* Section 4: Business Address */}
          <FormSection icon="location_on" title="Business Address">
            <div className="grid sm:grid-cols-3 gap-4">
              <FormField label="Province" required error={errors.province}>
                <SelectInput
                  value={form.province}
                  onChange={(e) => setField("province", e.target.value)}
                  options={NEPAL_PROVINCES.map((p) => ({ value: p, label: p }))}
                  placeholder="Select province"
                />
              </FormField>

              <FormField label="District" required error={errors.district}>
                <TextInput
                  value={form.district}
                  onChange={(e) => setField("district", e.target.value)}
                  placeholder="e.g. Kathmandu"
                />
              </FormField>

              <FormField label="City / Municipality" required error={errors.city}>
                <TextInput
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  placeholder="e.g. Lalitpur"
                />
              </FormField>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <FormField label="Street Address">
                <TextInput
                  value={form.streetAddress}
                  onChange={(e) => setField("streetAddress", e.target.value)}
                  placeholder="Ward No., Tole, Landmark"
                />
              </FormField>

              <FormField label="Postal Code">
                <TextInput
                  value={form.postalCode}
                  onChange={(e) => setField("postalCode", e.target.value)}
                  placeholder="e.g. 44600"
                />
              </FormField>
            </div>
          </FormSection>

          {/* Section 5: Product Categories */}
          <FormSection icon="inventory_2" title="Product Categories" subtitle="Select categories you are interested in">
            <FormField label="Categories" required error={errors.productCategories} hint="Select all that apply">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                {PRODUCT_CATEGORIES.map((cat) => {
                  const selected = form.productCategories.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => toggleCategory(cat.value)}
                      className={`
                        flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-medium text-left
                        transition-all duration-200 group/cat
                        ${selected
                          ? "border-forest-base bg-forest-base/[0.06] text-forest-deep shadow-sm"
                          : "border-outline-variant/50 text-on-surface-variant hover:border-outline hover:bg-surface-container-low"
                        }
                      `}
                    >
                      <Icon
                        name={cat.icon}
                        size={15}
                        className={`shrink-0 transition-colors ${
                          selected ? "text-forest-base" : "text-on-surface-variant/50 group-hover/cat:text-on-surface-variant"
                        }`}
                      />
                      <span className="flex-1 leading-tight">{cat.label}</span>
                      {selected && (
                        <Icon name="check_circle" size={14} className="text-forest-base shrink-0" filled />
                      )}
                    </button>
                  );
                })}
              </div>
            </FormField>

            <div className="mt-4">
              <FormField label="Additional Product Notes" hint="Describe specific products, private label requirements, or custom needs">
                <TextArea
                  value={form.customProductNote}
                  onChange={(e) => setField("customProductNote", e.target.value)}
                  placeholder="e.g., Looking for private label organic hair oil in 100ml bottles..."
                  rows={3}
                />
              </FormField>
            </div>
          </FormSection>

          {/* Section 6: Target Market */}
          <FormSection icon="public" title="Target Market / Distribution Territory">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <FormField label="Country">
                <TextInput
                  value={form.targetCountry}
                  onChange={(e) => setField("targetCountry", e.target.value)}
                  placeholder="Nepal"
                />
              </FormField>

              <FormField label="Province / State">
                <TextInput
                  value={form.targetProvince}
                  onChange={(e) => setField("targetProvince", e.target.value)}
                  placeholder="e.g., Bagmati"
                />
              </FormField>

              <FormField label="City">
                <TextInput
                  value={form.targetCity}
                  onChange={(e) => setField("targetCity", e.target.value)}
                  placeholder="e.g., Kathmandu"
                />
              </FormField>

              <FormField label="Distribution Territory">
                <TextInput
                  value={form.targetTerritory}
                  onChange={(e) => setField("targetTerritory", e.target.value)}
                  placeholder="e.g., Entire Nepal, South Asia"
                />
              </FormField>
            </div>

            <FormField label="Specific Requirements / Custom Message" hint="Bulk, private label, packaging, distribution, or any other commercial requirements">
              <TextArea
                value={form.customMessage}
                onChange={(e) => setField("customMessage", e.target.value)}
                placeholder="Describe your business requirements, expected order details, special packaging needs, or anything else relevant..."
                rows={5}
              />
            </FormField>
          </FormSection>

          {/* Section 7: Preferred Communication */}
          <FormSection icon="forum" title="Preferred Communication Channel">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COMMUNICATION_CHANNELS.map((ch) => {
                const selected = form.preferredChannel === ch.value;
                return (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => setField("preferredChannel", ch.value)}
                    className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border text-sm font-medium transition-all ${
                      selected
                        ? "bg-forest-base/5 border-forest-base text-forest-deep ring-2 ring-forest-base/20"
                        : "bg-surface-container-lowest border-outline-variant/60 text-on-surface-variant hover:border-forest-base/30"
                    }`}
                  >
                    <Icon name={ch.icon} size={22} className={selected ? "text-forest-base" : ""} />
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </FormSection>

          {/* Section 8: Agreements */}
          <FormSection icon="gavel" title="B2B Business Agreement">
            <div className="space-y-3">
              <div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.agreeTerms}
                      onChange={(e) => setField("agreeTerms", e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className={`
                      w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all duration-200
                      ${form.agreeTerms
                        ? "bg-forest-base border-forest-base"
                        : "border-outline-variant group-hover:border-outline"
                      }
                    `}>
                      {form.agreeTerms && <Icon name="check" size={13} className="text-white" />}
                    </div>
                  </div>
                  <span className="text-[13px] text-on-surface-variant leading-relaxed">
                    I agree to the{" "}
                    <a href="/policies/b2b-terms" className="text-forest-base font-semibold hover:text-antique-gold underline underline-offset-2 decoration-forest-base/30 transition-colors">
                      B2B Business Terms & Conditions
                    </a>
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="mt-1.5 ml-8 flex items-center gap-1 text-[11px] text-terracotta font-medium">
                    <Icon name="error" size={12} />
                    {errors.agreeTerms}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.agreePrivacy}
                      onChange={(e) => setField("agreePrivacy", e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className={`
                      w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all duration-200
                      ${form.agreePrivacy
                        ? "bg-forest-base border-forest-base"
                        : "border-outline-variant group-hover:border-outline"
                      }
                    `}>
                      {form.agreePrivacy && <Icon name="check" size={13} className="text-white" />}
                    </div>
                  </div>
                  <span className="text-[13px] text-on-surface-variant leading-relaxed">
                    I agree to Hakkiveda&apos;s{" "}
                    <a href="/policies/privacy" className="text-forest-base font-semibold hover:text-antique-gold underline underline-offset-2 decoration-forest-base/30 transition-colors">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {errors.agreePrivacy && (
                  <p className="mt-1.5 ml-8 flex items-center gap-1 text-[11px] text-terracotta font-medium">
                    <Icon name="error" size={12} />
                    {errors.agreePrivacy}
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          {/* Submit */}
          <div className="border-t border-outline-variant/40 pt-6 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-forest-base text-ivory-canvas border border-antique-gold/40 rounded-xl font-semibold text-sm hover:bg-forest-deep active:scale-[0.98] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Icon name="hourglass_empty" size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Icon name="send" size={18} />
                  Submit B2B Application
                </>
              )}
            </button>

            <p className="text-xs text-on-surface-variant mt-3">
              Your application will be reviewed by our admin team. We will contact you
              once your business profile has been verified.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
