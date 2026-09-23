"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { key: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { key: "number", label: "One number", test: (p) => /\d/.test(p) },
];

function PasswordStrength({ password }) {
  if (!password) return null;
  const results = PASSWORD_RULES.map((r) => ({ ...r, pass: r.test(password) }));
  const passed = results.filter((r) => r.pass).length;
  const strength = passed <= 1 ? "Weak" : passed <= 2 ? "Fair" : passed <= 3 ? "Good" : "Strong";
  const barColor = passed <= 1 ? "bg-terracotta" : passed <= 2 ? "bg-antique-gold" : passed <= 3 ? "bg-herbal-jade" : "bg-forest-base";
  const textColor = passed <= 1 ? "text-terracotta" : passed <= 2 ? "text-antique-gold" : passed <= 3 ? "text-herbal-jade" : "text-forest-base";

  return (
    <div className="mt-3 space-y-2.5" role="status" aria-label={`Password strength: ${strength}`}>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const invalidLink = !token || !email;

  const allRulesPass = PASSWORD_RULES.every((r) => r.test(password));
  const passwordsMatch = password === confirmPassword;
  const canSubmit = allRulesPass && passwordsMatch && confirmPassword.length > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        toast.error(data.error || "Something went wrong.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-container-low relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-forest-base/[0.03] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-antique-gold/[0.04] blur-3xl" />
      </div>

      <div className="h-1 bg-gradient-to-r from-forest-deep via-forest-base to-antique-gold" />

      <div className="relative max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-xl border border-antique-gold/30 bg-forest-base flex items-center justify-center shadow-md shadow-forest-base/15 group-hover:shadow-lg group-hover:shadow-forest-base/20 transition-shadow">
              <span className="font-headline text-antique-gold text-xl font-bold">{"ह"}</span>
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

        {/* Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl shadow-charcoal-ink/[0.06] overflow-hidden">
          <div className="px-6 sm:px-8 py-8">
            {invalidLink ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-terracotta/10 flex items-center justify-center">
                  <Icon name="link_off" size={28} className="text-terracotta" />
                </div>
                <h1 className="font-headline text-xl text-forest-deep mb-2">Invalid reset link</h1>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  This password reset link is invalid or malformed. Please request a new one.
                </p>
                <Link
                  href="/auth/forgot-password"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-forest-base text-white text-sm font-semibold hover:bg-forest-deep transition-colors"
                >
                  Request new link
                </Link>
              </div>
            ) : success ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-forest-base/10 flex items-center justify-center">
                  <Icon name="check_circle" size={28} className="text-forest-base" filled />
                </div>
                <h1 className="font-headline text-xl text-forest-deep mb-2">Password reset!</h1>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  Your password has been updated successfully. You can now sign in with your new password.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-base text-white text-sm font-semibold shadow-lg shadow-forest-base/20 hover:bg-forest-deep hover:shadow-xl transition-all"
                >
                  <Icon name="login" size={18} />
                  Sign in
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-forest-base/10 flex items-center justify-center">
                    <Icon name="lock_reset" size={26} className="text-forest-base" />
                  </div>
                  <h1 className="font-headline text-2xl sm:text-[28px] text-forest-deep leading-tight">
                    Set new password
                  </h1>
                  <p className="text-[13px] text-on-surface-variant mt-2">
                    Choose a strong password for your account.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-terracotta/[0.06] border border-terracotta/20">
                    <Icon name="error" size={18} className="text-terracotta shrink-0" />
                    <p className="text-sm text-terracotta font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant mb-1.5"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoFocus
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        placeholder="Enter new password"
                        className="
                          w-full bg-surface-container-lowest border border-outline-variant rounded-xl
                          px-4 py-3 pr-11 text-sm text-on-surface outline-none transition-all duration-200
                          placeholder:text-on-surface-variant/40
                          focus:ring-2 focus:ring-forest-base/20 focus:border-forest-base
                          hover:border-outline
                        "
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
                      >
                        <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      placeholder="Re-enter new password"
                      className={`
                        w-full bg-surface-container-lowest border rounded-xl
                        px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200
                        placeholder:text-on-surface-variant/40
                        focus:ring-2 focus:ring-forest-base/20 focus:border-forest-base
                        hover:border-outline
                        ${confirmPassword && !passwordsMatch ? "border-terracotta" : "border-outline-variant"}
                      `}
                    />
                    {confirmPassword && !passwordsMatch && (
                      <p className="mt-1.5 text-xs text-terracotta flex items-center gap-1">
                        <Icon name="error" size={14} />
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !canSubmit}
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
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Icon name="lock" size={18} />
                        Reset password
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-forest-base transition-colors"
                  >
                    <Icon name="arrow_back" size={16} />
                    Back to sign in
                  </Link>
                </div>
              </>
            )}
          </div>
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
    </div>
  );
}
