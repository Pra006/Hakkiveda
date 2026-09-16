"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

/* ══════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════ */

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
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "SOLE_PROPRIETORSHIP", label: "Sole Proprietorship" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "PRIVATE_COMPANY", label: "Private Company" },
  { value: "OTHER", label: "Other" },
];

const ORDER_VOLUMES = [
  { value: "LESS_THAN_100", label: "30–100 units" },
  { value: "FROM_100_TO_500", label: "101–500 units" },
  { value: "FROM_500_TO_1000", label: "501–1,000 units" },
  { value: "FROM_1000_TO_5000", label: "1,001–5,000 units" },
  { value: "MORE_THAN_5000", label: "5,000+ units" },
];

const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { key: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { key: "number", label: "One number", test: (p) => /\d/.test(p) },
];

/* ══════════════════════════════════════════════
   Google SVG Icon
   ══════════════════════════════════════════════ */

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ══════════════════════════════════════════════
   Reusable Form Components
   ══════════════════════════════════════════════ */

function FormField({ label, required, error, children, hint, htmlFor, className = "" }) {
  const id = htmlFor || (label ? label.toLowerCase().replace(/[\s/]+/g, "-") : undefined);
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant mb-1.5"
        >
          {label}
          {required && <span className="text-terracotta ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="mt-1 text-[11px] text-on-surface-variant/70">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-terracotta font-medium" role="alert">
          <Icon name="error" size={12} />
          {error}
        </p>
      )}
    </div>
  );
}

function Input({ type = "text", value, onChange, placeholder, error, disabled, id, name, className = "", ...rest }) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete={rest.autoComplete}
      className={`
        w-full bg-surface-container-lowest border rounded-xl px-4 py-3 text-sm text-on-surface
        outline-none transition-all duration-200
        placeholder:text-on-surface-variant/40
        focus:ring-2 focus:ring-forest-base/20 focus:border-forest-base
        ${error
          ? "border-terracotta/60 focus:border-terracotta focus:ring-terracotta/20"
          : "border-outline-variant hover:border-outline"
        }
        ${disabled ? "opacity-50 cursor-not-allowed bg-surface-container-low" : ""}
        ${className}
      `}
      {...rest}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder, error, disabled, id }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full bg-surface-container-lowest border rounded-xl px-4 py-3 pr-10 text-sm
          outline-none transition-all duration-200 appearance-none cursor-pointer
          focus:ring-2 focus:ring-forest-base/20 focus:border-forest-base
          ${!value ? "text-on-surface-variant/40" : "text-on-surface"}
          ${error
            ? "border-terracotta/60 focus:border-terracotta focus:ring-terracotta/20"
            : "border-outline-variant hover:border-outline"
          }
          ${disabled ? "opacity-50 cursor-not-allowed bg-surface-container-low" : ""}
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
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

function PasswordInput({ value, onChange, placeholder, error, disabled, id }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="new-password"
        className={`
          w-full bg-surface-container-lowest border rounded-xl px-4 py-3 pr-12 text-sm text-on-surface
          outline-none transition-all duration-200
          placeholder:text-on-surface-variant/40
          focus:ring-2 focus:ring-forest-base/20 focus:border-forest-base
          ${error
            ? "border-terracotta/60 focus:border-terracotta focus:ring-terracotta/20"
            : "border-outline-variant hover:border-outline"
          }
          ${disabled ? "opacity-50 cursor-not-allowed bg-surface-container-low" : ""}
        `}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-on-surface-variant/60 hover:text-forest-deep hover:bg-surface-container transition-all"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        <Icon name={show ? "visibility_off" : "visibility"} size={18} />
      </button>
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const results = PASSWORD_RULES.map((r) => ({ ...r, pass: r.test(password) }));
  const passed = results.filter((r) => r.pass).length;
  const strength = passed <= 1 ? "Weak" : passed <= 2 ? "Fair" : passed <= 3 ? "Good" : "Strong";
  const barColor = passed <= 1 ? "bg-terracotta" : passed <= 2 ? "bg-antique-gold" : passed <= 3 ? "bg-herbal-jade" : "bg-forest-base";
  const textColor = passed <= 1 ? "text-terracotta" : passed <= 2 ? "text-antique-gold" : passed <= 3 ? "text-herbal-jade" : "text-forest-base";

  return (
    <div className="mt-3 space-y-2.5 animate-in" role="status" aria-label={`Password strength: ${strength}`}>
      {/* Strength bar */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 flex gap-1 h-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-500 ease-out ${
                i < passed ? barColor : "bg-outline-variant/40"
              }`}
            />
          ))}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${textColor} transition-colors duration-300`}>
          {strength}
        </span>
      </div>
      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {results.map((r) => (
          <div key={r.key} className="flex items-center gap-1.5">
            <Icon
              name={r.pass ? "check_circle" : "radio_button_unchecked"}
              size={14}
              className={`transition-colors duration-300 ${
                r.pass ? "text-forest-base" : "text-outline-variant"
              }`}
              filled={r.pass}
            />
            <span className={`text-[11px] transition-colors duration-300 ${
              r.pass ? "text-forest-deep font-medium" : "text-on-surface-variant/60"
            }`}>
              {r.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormSection({ title, icon, step, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-forest-base/8 flex items-center justify-center shrink-0">
          <Icon name={icon} size={16} className="text-forest-base" />
        </div>
        <div className="flex-1 flex items-center gap-3">
          <h3 className="text-[13px] font-bold text-forest-deep tracking-tight">{title}</h3>
          <div className="flex-1 h-px bg-outline-variant/40" />
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   OTP Verification Step
   ══════════════════════════════════════════════ */

function OtpVerificationStep({ email, purpose, onVerified, onBack }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  function handleOtpChange(e) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(val);
    setError("");
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, purpose }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed.");
        return;
      }
      onVerified(data.verifyToken);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
        return;
      }
      setResendCooldown(60);
      intervalRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="animate-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-forest-base/10 flex items-center justify-center">
          <Icon name="mark_email_unread" size={28} className="text-forest-base" />
        </div>
        <h2 className="font-headline text-xl text-forest-deep mb-2">Verify your email</h2>
        <p className="text-sm text-on-surface-variant">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-on-surface">{email}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-5">
        <div>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={handleOtpChange}
            placeholder="000000"
            maxLength={6}
            className={`
              w-full text-center text-3xl font-mono font-bold tracking-[0.5em]
              bg-surface-container-lowest border rounded-xl px-4 py-4
              outline-none transition-all duration-200
              placeholder:text-on-surface-variant/20 placeholder:tracking-[0.5em]
              focus:ring-2 focus:ring-forest-base/20 focus:border-forest-base
              ${error
                ? "border-terracotta/60 focus:border-terracotta focus:ring-terracotta/20"
                : "border-outline-variant hover:border-outline"
              }
            `}
            autoFocus
          />
          {error && (
            <p className="mt-2 flex items-center justify-center gap-1 text-[12px] text-terracotta font-medium" role="alert">
              <Icon name="error" size={14} />
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="
            w-full flex items-center justify-center gap-2.5
            bg-forest-base text-white font-semibold text-sm
            rounded-xl px-8 py-3.5 shadow-lg shadow-forest-base/20
            hover:bg-forest-deep hover:shadow-xl hover:shadow-forest-base/25
            active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
            disabled:hover:bg-forest-base disabled:hover:shadow-lg disabled:active:scale-100
            transition-all duration-200
          "
        >
          {loading ? (
            <>
              <Icon name="progress_activity" size={18} className="animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Icon name="verified" size={18} />
              Verify Email
            </>
          )}
        </button>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-forest-base transition-colors"
          >
            <Icon name="arrow_back" size={16} />
            Back
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            className={`
              text-sm font-medium transition-colors
              ${resendCooldown > 0 || resending
                ? "text-on-surface-variant/40 cursor-not-allowed"
                : "text-forest-base hover:text-antique-gold cursor-pointer"
              }
            `}
          >
            {resending
              ? "Sending..."
              : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend code"}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-[11px] text-on-surface-variant/50">
        Check your spam folder if you don&apos;t see the email.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Account Type Selector
   ══════════════════════════════════════════════ */

function AccountTypeSelector({ accountType, onChange }) {
  const options = [
    {
      value: "customer",
      icon: "shopping_bag",
      label: "Customer",
      desc: "Shop products, manage your orders, and discover trusted sellers.",
    },
    {
      value: "vendor",
      icon: "storefront",
      label: "B2B Business",
      desc: "Create your store, sell products, and manage your business.",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account type">
      {options.map((opt) => {
        const active = accountType === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            role="radio"
            aria-checked={active}
            className={`
              relative text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 ease-out group
              ${active
                ? "border-forest-base bg-forest-base/[0.04] shadow-md shadow-forest-base/8 scale-[1.01]"
                : "border-outline-variant/50 bg-surface-container-lowest hover:border-outline-variant hover:shadow-sm"
              }
            `}
          >
            {/* Checkmark badge */}
            <div className={`
              absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center
              transition-all duration-300
              ${active
                ? "bg-forest-base scale-100 opacity-100"
                : "bg-outline-variant/30 scale-75 opacity-0"
              }
            `}>
              <Icon name="check" size={13} className="text-white" />
            </div>

            {/* Icon */}
            <div className={`
              w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 transition-all duration-300
              ${active
                ? "bg-forest-base text-antique-gold shadow-sm"
                : "bg-surface-container text-on-surface-variant group-hover:bg-surface-container-high"
              }
            `}>
              <Icon name={opt.icon} size={22} />
            </div>

            {/* Text */}
            <div className={`text-sm font-bold mb-1 transition-colors duration-200 ${
              active ? "text-forest-deep" : "text-on-surface"
            }`}>
              {opt.label}
            </div>
            <p className="text-[11px] leading-relaxed text-on-surface-variant/80">
              {opt.desc}
            </p>
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Vendor Success State
   ══════════════════════════════════════════════ */

function VendorSuccessState({ onGoToLogin }) {
  return (
    <div className="text-center py-10 px-4 animate-in">
      {/* Animated success icon */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-forest-base/10 animate-ping-slow" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-forest-base/15 to-forest-base/5 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-forest-base/10 flex items-center justify-center">
            <Icon name="mark_email_read" size={28} className="text-forest-base" />
          </div>
        </div>
      </div>

      <h2 className="font-headline text-2xl sm:text-[28px] text-forest-deep mb-3">
        Application Submitted
      </h2>
      <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed mb-8">
        Thank you for applying to become a Hakkiveda B2B business. Our team will review
        your application and notify you once your account has been approved.
      </p>

      {/* Status badge */}
      <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-antique-gold/8 border border-antique-gold/25 mb-10">
        <div className="w-2 h-2 rounded-full bg-antique-gold animate-pulse" />
        <span className="text-xs font-bold text-antique-gold uppercase tracking-[0.1em]">
          Pending Review
        </span>
      </div>

      <div>
        <button
          onClick={onGoToLogin}
          className="
            w-full max-w-xs mx-auto flex items-center justify-center gap-2.5
            bg-forest-base text-white font-semibold text-sm
            rounded-xl px-8 py-3.5 shadow-lg shadow-forest-base/20
            hover:bg-forest-deep hover:shadow-xl hover:shadow-forest-base/25
            active:scale-[0.98] transition-all duration-200
          "
        >
          <Icon name="login" size={18} />
          Go to Sign In
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Customer Registration Form
   ══════════════════════════════════════════════ */

function CustomerForm({ globalError, setGlobalError }) {
  const router = useRouter();
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    password: "", confirmPassword: "", agree: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setGlobalError("");
  }, [setGlobalError]);

  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Please enter a valid email address.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 8)
      e.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    if (!form.agree) e.agree = "You must agree to the Terms & Privacy Policy.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setGlobalError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          purpose: "CUSTOMER_REGISTRATION",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setGlobalError(data.error || "Failed to send verification code."); return; }
      setStep("otp");
    } catch {
      setGlobalError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpVerified(verifyToken) {
    setLoading(true);
    setGlobalError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          verifyToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setGlobalError(data.error || "Registration failed."); return; }
      router.push("/auth/login?registered=true");
    } catch {
      setGlobalError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl: "/" });
  }

  if (step === "otp") {
    return (
      <OtpVerificationStep
        email={form.email}
        purpose="CUSTOMER_REGISTRATION"
        onVerified={handleOtpVerified}
        onBack={() => { setStep("form"); setGlobalError(""); }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in">
      <FormSection title="Personal Information" icon="person">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="First Name" required error={errors.firstName}>
            <Input
              id="first-name"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="Prakash"
              error={errors.firstName}
              autoComplete="given-name"
            />
          </FormField>
          <FormField label="Last Name">
            <Input
              id="last-name"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Adhikari"
              autoComplete="family-name"
            />
          </FormField>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Email Address" required error={errors.email}>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              error={errors.email}
              autoComplete="email"
            />
          </FormField>
          <FormField label="Phone Number" hint="Nepal format: +977 98XXXXXXXX">
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+977 98XXXXXXXX"
              autoComplete="tel"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Security" icon="lock">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Password" required error={errors.password}>
            <PasswordInput
              id="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Create a strong password"
              error={errors.password}
            />
          </FormField>
          <FormField label="Confirm Password" required error={errors.confirmPassword}>
            <PasswordInput
              id="confirm-password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="Re-enter your password"
              error={errors.confirmPassword}
            />
          </FormField>
        </div>
        <PasswordStrength password={form.password} />
      </FormSection>

      {/* Terms */}
      <div className="pt-1">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => update("agree", e.target.checked)}
              className="peer sr-only"
            />
            <div className={`
              w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all duration-200
              ${form.agree
                ? "bg-forest-base border-forest-base"
                : "border-outline-variant group-hover:border-outline"
              }
            `}>
              {form.agree && <Icon name="check" size={13} className="text-white" />}
            </div>
          </div>
          <span className="text-[13px] text-on-surface-variant leading-relaxed">
            I agree to Hakkiveda&apos;s{" "}
            <Link href="/policies/terms" className="text-forest-base font-semibold hover:text-antique-gold underline underline-offset-2 decoration-forest-base/30 hover:decoration-antique-gold/50 transition-colors">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link href="/policies/privacy" className="text-forest-base font-semibold hover:text-antique-gold underline underline-offset-2 decoration-forest-base/30 hover:decoration-antique-gold/50 transition-colors">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.agree && (
          <p className="mt-1.5 ml-8 flex items-center gap-1 text-[11px] text-terracotta font-medium" role="alert">
            <Icon name="error" size={12} />
            {errors.agree}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="
          w-full flex items-center justify-center gap-2.5
          bg-forest-base text-white font-semibold text-sm
          rounded-xl px-8 py-3.5 shadow-lg shadow-forest-base/20
          hover:bg-forest-deep hover:shadow-xl hover:shadow-forest-base/25
          active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
          disabled:hover:bg-forest-base disabled:hover:shadow-lg disabled:active:scale-100
          transition-all duration-200
        "
      >
        {loading ? (
          <>
            <Icon name="progress_activity" size={18} className="animate-spin" />
            Sending verification code...
          </>
        ) : (
          <>
            <Icon name="mail" size={18} />
            Continue with Email Verification
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <span className="flex-1 h-px bg-outline-variant/50" />
        <span className="text-[11px] font-medium text-on-surface-variant/50 uppercase tracking-widest">
          or continue with
        </span>
        <span className="flex-1 h-px bg-outline-variant/50" />
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogle}
        className="
          w-full flex items-center justify-center gap-3
          bg-surface-container-lowest border border-outline-variant rounded-xl
          py-3 text-sm font-medium text-on-surface
          hover:bg-surface-container-low hover:border-outline hover:shadow-sm
          active:scale-[0.99] transition-all duration-200
        "
      >
        <GoogleIcon size={18} />
        Continue with Google
      </button>
    </form>
  );
}

/* ══════════════════════════════════════════════
   File Upload Component
   ══════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════
   Vendor Registration Form
   ══════════════════════════════════════════════ */

function VendorForm({ onSuccess, globalError, setGlobalError }) {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "",
    password: "", confirmPassword: "",
    citizenshipNumber: "",
    citizenshipFront: null, citizenshipBack: null,
    storeName: "", businessType: "", estimatedOrderVolume: "",
    businessRegNo: "", panVatNo: "",
    businessEmail: "", businessPhone: "",
    province: "", district: "", city: "",
    streetAddress: "", postalCode: "",
    storeDescription: "", categories: [],
    agreeTerms: false, agreePrivacy: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  const update = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setGlobalError("");
  }, [setGlobalError]);

  function toggleCategory(cat) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
    setErrors((prev) => ({ ...prev, categories: "" }));
  }

  function handleFrontUpload(result, error) {
    if (result === "uploading") { setUploadingFront(true); return; }
    setUploadingFront(false);
    if (error) { setErrors((prev) => ({ ...prev, citizenshipFront: error })); return; }
    update("citizenshipFront", result);
  }

  function handleBackUpload(result, error) {
    if (result === "uploading") { setUploadingBack(true); return; }
    setUploadingBack(false);
    if (error) { setErrors((prev) => ({ ...prev, citizenshipBack: error })); return; }
    update("citizenshipBack", result);
  }

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Please enter a valid email address.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 8)
      e.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    if (!form.citizenshipNumber.trim()) e.citizenshipNumber = "Citizenship number is required.";
    if (!form.citizenshipFront) e.citizenshipFront = "Citizenship front side is required.";
    if (!form.citizenshipBack) e.citizenshipBack = "Citizenship back side is required.";
    if (!form.storeName.trim()) e.storeName = "Store name is required.";
    if (!form.businessType) e.businessType = "Please select a business type.";
    if (!form.estimatedOrderVolume) e.estimatedOrderVolume = "Estimated order volume is required.";
    if (!form.province) e.province = "Province is required.";
    if (!form.district.trim()) e.district = "District is required.";
    if (!form.city.trim()) e.city = "City / Municipality is required.";
    if (form.categories.length === 0) e.categories = "Select at least one category.";
    if (!form.agreeTerms) e.agreeTerms = "You must agree to the B2B Business Terms.";
    if (!form.agreePrivacy) e.agreePrivacy = "You must agree to the Privacy Policy.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setGlobalError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          purpose: "B2B_REGISTRATION",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setGlobalError(data.error || "Failed to send verification code."); return; }
      setStep("otp");
    } catch {
      setGlobalError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpVerified(verifyToken) {
    setLoading(true);
    setGlobalError("");
    try {
      const res = await fetch("/api/auth/register/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          verifyToken,
          citizenshipNumber: form.citizenshipNumber,
          citizenshipFrontUrl: form.citizenshipFront.url,
          citizenshipBackUrl: form.citizenshipBack.url,
          storeName: form.storeName,
          businessType: form.businessType,
          estimatedOrderVolume: form.estimatedOrderVolume,
          businessRegNo: form.businessRegNo || undefined,
          panVatNo: form.panVatNo || undefined,
          businessEmail: form.businessEmail || undefined,
          businessPhone: form.businessPhone || undefined,
          province: form.province,
          district: form.district,
          city: form.city,
          streetAddress: form.streetAddress || undefined,
          postalCode: form.postalCode || undefined,
          storeDescription: form.storeDescription || undefined,
          categories: form.categories,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setGlobalError(data.error || "Submission failed."); return; }
      onSuccess();
    } catch {
      setGlobalError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <OtpVerificationStep
        email={form.email}
        purpose="B2B_REGISTRATION"
        onVerified={handleOtpVerified}
        onBack={() => { setStep("form"); setGlobalError(""); }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in">
      {/* Vendor heading */}
      <div className="text-center pb-2">
        <h2 className="font-headline text-lg text-forest-deep mb-1">
          Become a Hakkiveda B2B Business
        </h2>
        <p className="text-[13px] text-on-surface-variant">
          Create your seller account and start building your store on Hakkiveda.
        </p>
      </div>

      {/* Section A: Personal */}
      <FormSection title="Personal Information" icon="person">
        <FormField label="Full Name" required error={errors.fullName}>
          <Input
            id="vendor-fullname"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="Prakash Adhikari"
            error={errors.fullName}
            autoComplete="name"
          />
        </FormField>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Email Address" required error={errors.email}>
            <Input
              id="vendor-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              error={errors.email}
              autoComplete="email"
            />
          </FormField>
          <FormField label="Phone Number">
            <Input
              id="vendor-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+977 98XXXXXXXX"
              autoComplete="tel"
            />
          </FormField>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Password" required error={errors.password}>
            <PasswordInput
              id="vendor-password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Create a strong password"
              error={errors.password}
            />
          </FormField>
          <FormField label="Confirm Password" required error={errors.confirmPassword}>
            <PasswordInput
              id="vendor-confirm-password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="Re-enter your password"
              error={errors.confirmPassword}
            />
          </FormField>
        </div>
        <PasswordStrength password={form.password} />
      </FormSection>

      {/* Section B: Identity Verification */}
      <FormSection title="Identity Verification" icon="badge">
        <FormField label="Citizenship Number" required error={errors.citizenshipNumber}>
          <Input
            id="citizenship-number"
            value={form.citizenshipNumber}
            onChange={(e) => update("citizenshipNumber", e.target.value)}
            placeholder="e.g. 12-34-56-78901"
            error={errors.citizenshipNumber}
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
            onRemove={() => update("citizenshipFront", null)}
          />
          <FileUploadField
            label="Citizenship Back Side"
            required
            error={errors.citizenshipBack}
            value={form.citizenshipBack}
            uploading={uploadingBack}
            onUpload={handleBackUpload}
            onRemove={() => update("citizenshipBack", null)}
          />
        </div>
        <p className="text-[11px] text-on-surface-variant/60 flex items-center gap-1.5">
          <Icon name="lock" size={12} />
          Your documents are encrypted and only accessible to authorized admin reviewers.
        </p>
      </FormSection>

      {/* Section C: Business */}
      <FormSection title="Business Information" icon="business">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Store / Business Name" required error={errors.storeName}>
            <Input
              id="store-name"
              value={form.storeName}
              onChange={(e) => update("storeName", e.target.value)}
              placeholder="e.g. Himalayan Herbs Co."
              error={errors.storeName}
            />
          </FormField>
          <FormField label="Business Type" required error={errors.businessType}>
            <SelectInput
              id="business-type"
              value={form.businessType}
              onChange={(e) => update("businessType", e.target.value)}
              options={BUSINESS_TYPES}
              placeholder="Select business type"
              error={errors.businessType}
            />
          </FormField>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Business Registration No." hint="Optional — if registered">
            <Input
              id="business-reg"
              value={form.businessRegNo}
              onChange={(e) => update("businessRegNo", e.target.value)}
              placeholder="e.g. 12345/078/079"
            />
          </FormField>
          <FormField label="PAN / VAT Number" hint="Optional">
            <Input
              id="pan-vat"
              value={form.panVatNo}
              onChange={(e) => update("panVatNo", e.target.value)}
              placeholder="e.g. 600123456"
            />
          </FormField>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Business Email" hint="Separate from personal email">
            <Input
              id="business-email"
              type="email"
              value={form.businessEmail}
              onChange={(e) => update("businessEmail", e.target.value)}
              placeholder="contact@yourbusiness.com"
            />
          </FormField>
          <FormField label="Business Phone">
            <Input
              id="business-phone"
              type="tel"
              value={form.businessPhone}
              onChange={(e) => update("businessPhone", e.target.value)}
              placeholder="+977 01-XXXXXXX"
            />
          </FormField>
        </div>
        <FormField label="Estimated Order Volume" required error={errors.estimatedOrderVolume}>
          <SelectInput
            id="order-volume"
            value={form.estimatedOrderVolume}
            onChange={(e) => update("estimatedOrderVolume", e.target.value)}
            options={ORDER_VOLUMES}
            placeholder="Select order volume"
            error={errors.estimatedOrderVolume}
          />
        </FormField>
      </FormSection>

      {/* Section D: Address */}
      <FormSection title="Business Address" icon="location_on">
        <div className="grid sm:grid-cols-3 gap-4">
          <FormField label="Province" required error={errors.province}>
            <SelectInput
              id="province"
              value={form.province}
              onChange={(e) => update("province", e.target.value)}
              options={NEPAL_PROVINCES.map((p) => ({ value: p, label: p }))}
              placeholder="Select province"
              error={errors.province}
            />
          </FormField>
          <FormField label="District" required error={errors.district}>
            <Input
              id="district"
              value={form.district}
              onChange={(e) => update("district", e.target.value)}
              placeholder="e.g. Kathmandu"
              error={errors.district}
            />
          </FormField>
          <FormField label="City / Municipality" required error={errors.city}>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="e.g. Lalitpur"
              error={errors.city}
            />
          </FormField>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Street Address">
            <Input
              id="street"
              value={form.streetAddress}
              onChange={(e) => update("streetAddress", e.target.value)}
              placeholder="Ward No., Tole, Landmark"
            />
          </FormField>
          <FormField label="Postal Code">
            <Input
              id="postal-code"
              value={form.postalCode}
              onChange={(e) => update("postalCode", e.target.value)}
              placeholder="e.g. 44600"
            />
          </FormField>
        </div>
      </FormSection>

      {/* Section E: Store */}
      <FormSection title="Store Information" icon="store">
        <FormField label="Store Description" hint="Tell buyers what makes your store special">
          <textarea
            id="store-desc"
            value={form.storeDescription}
            onChange={(e) => update("storeDescription", e.target.value)}
            rows={3}
            placeholder="We craft traditional Ayurvedic oils using wildcrafted herbs from the Himalayan foothills..."
            className="
              w-full bg-surface-container-lowest border border-outline-variant rounded-xl
              px-4 py-3 text-sm text-on-surface outline-none resize-none
              placeholder:text-on-surface-variant/40 transition-all duration-200
              focus:ring-2 focus:ring-forest-base/20 focus:border-forest-base
              hover:border-outline
            "
          />
        </FormField>

        <FormField label="Product Categories" required error={errors.categories} hint="Select all that apply">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
            {PRODUCT_CATEGORIES.map((cat) => {
              const selected = form.categories.includes(cat.value);
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
      </FormSection>

      {/* Section F: Agreements */}
      <FormSection title="B2B Business Agreement" icon="gavel">
        <div className="space-y-3">
          {/* Terms checkbox */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => update("agreeTerms", e.target.checked)}
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
                <Link href="/policies/b2b-terms" className="text-forest-base font-semibold hover:text-antique-gold underline underline-offset-2 decoration-forest-base/30 transition-colors">
                  B2B Business Terms & Conditions
                </Link>
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="mt-1.5 ml-8 flex items-center gap-1 text-[11px] text-terracotta font-medium" role="alert">
                <Icon name="error" size={12} />
                {errors.agreeTerms}
              </p>
            )}
          </div>

          {/* Privacy checkbox */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={form.agreePrivacy}
                  onChange={(e) => update("agreePrivacy", e.target.checked)}
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
                <Link href="/policies/privacy" className="text-forest-base font-semibold hover:text-antique-gold underline underline-offset-2 decoration-forest-base/30 transition-colors">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.agreePrivacy && (
              <p className="mt-1.5 ml-8 flex items-center gap-1 text-[11px] text-terracotta font-medium" role="alert">
                <Icon name="error" size={12} />
                {errors.agreePrivacy}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Submit */}
      <div className="pt-2 space-y-4">
        <button
          type="submit"
          disabled={loading}
          className="
            w-full flex items-center justify-center gap-2.5
            bg-forest-base text-white font-semibold text-sm
            rounded-xl px-8 py-3.5 shadow-lg shadow-forest-base/20
            hover:bg-forest-deep hover:shadow-xl hover:shadow-forest-base/25
            active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
            disabled:hover:bg-forest-base disabled:hover:shadow-lg disabled:active:scale-100
            transition-all duration-200
          "
        >
          {loading ? (
            <>
              <Icon name="progress_activity" size={18} className="animate-spin" />
              Sending verification code...
            </>
          ) : (
            <>
              <Icon name="mail" size={18} />
              Continue with Email Verification
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-on-surface-variant/60 leading-relaxed">
          Your B2B business application will be reviewed by our admin team
          before your store becomes active.
        </p>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════
   Main Registration Page
   ══════════════════════════════════════════════ */

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState("customer");
  const [globalError, setGlobalError] = useState("");
  const [vendorSubmitted, setVendorSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-surface-container-low relative overflow-hidden">
      {/* Subtle decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-forest-base/[0.03] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-antique-gold/[0.04] blur-3xl" />
      </div>

      {/* Decorative top accent */}
      <div className="h-1 bg-gradient-to-r from-forest-deep via-forest-base to-antique-gold" />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-xl border border-antique-gold/30 bg-forest-base flex items-center justify-center shadow-md shadow-forest-base/15 group-hover:shadow-lg group-hover:shadow-forest-base/20 transition-shadow">
              <span className="font-headline text-antique-gold text-xl font-bold">ह</span>
            </div>
            <div className="flex flex-col leading-none text-left">
              <span className="font-headline text-[22px] font-bold text-forest-deep tracking-tight group-hover:text-forest-base transition-colors">
                Hakkiveda
              </span>
              <span className="text-[9px] text-antique-gold tracking-[0.2em] uppercase mt-0.5 font-bold">
                Nepal Marketplace
              </span>
            </div>
          </Link>
        </div>

        {/* Main card */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl shadow-charcoal-ink/[0.06] overflow-hidden">

          {/* Card header */}
          <div className="px-6 sm:px-8 pt-8 pb-6">
            <h1 className="font-headline text-2xl sm:text-[28px] text-forest-deep text-center leading-tight">
              Create your Hakkiveda account
            </h1>
            <p className="text-[13px] text-on-surface-variant text-center mt-2">
              Choose how you want to use Hakkiveda
            </p>

            {/* Account type selector */}
            {!vendorSubmitted && (
              <div className="mt-7">
                <AccountTypeSelector
                  accountType={accountType}
                  onChange={(type) => {
                    setAccountType(type);
                    setGlobalError("");
                  }}
                />
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-6 sm:mx-8 h-px bg-outline-variant/40" />

          {/* Form area */}
          <div className="px-6 sm:px-8 py-8">
            {/* Global error banner */}
            {globalError && (
              <div className="mb-6 flex items-start gap-3 px-4 py-3.5 rounded-xl bg-terracotta/[0.06] border border-terracotta/20" role="alert">
                <Icon name="error" size={18} className="text-terracotta shrink-0 mt-0.5" />
                <p className="text-sm text-terracotta font-medium">{globalError}</p>
              </div>
            )}

            {vendorSubmitted ? (
              <VendorSuccessState onGoToLogin={() => router.push("/auth/login")} />
            ) : accountType === "customer" ? (
              <CustomerForm
                globalError={globalError}
                setGlobalError={setGlobalError}
              />
            ) : (
              <VendorForm
                onSuccess={() => setVendorSubmitted(true)}
                globalError={globalError}
                setGlobalError={setGlobalError}
              />
            )}
          </div>

          {/* Card footer */}
          {!vendorSubmitted && (
            <>
              <div className="mx-6 sm:mx-8 h-px bg-outline-variant/40" />
              <div className="px-6 sm:px-8 py-5 text-center bg-surface-container-low/30">
                <p className="text-sm text-on-surface-variant">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-forest-base font-semibold hover:text-antique-gold transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex items-center justify-center gap-8 text-on-surface-variant/40">
          {[
            { icon: "lock", label: "Secure" },
            { icon: "verified_user", label: "Verified" },
            { icon: "shield", label: "Encrypted" },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] font-semibold">
              <Icon name={badge.icon} size={13} />
              {badge.label}
            </div>
          ))}
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx global>{`
        .animate-in {
          animation: fadeSlideIn 0.4s ease-out;
        }
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-ping-slow {
          animation: pingSlow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes pingSlow {
          0% { transform: scale(1); opacity: 0.3; }
          75%, 100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
