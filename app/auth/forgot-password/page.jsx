"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      toast.error("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        toast.error(data.error || "Something went wrong.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
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
            {submitted ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-forest-base/10 flex items-center justify-center">
                  <Icon name="mark_email_read" size={28} className="text-forest-base" />
                </div>
                <h1 className="font-headline text-xl text-forest-deep mb-2">Check your email</h1>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  If an account exists with <span className="font-semibold text-on-surface">{email}</span>,
                  we&apos;ve sent a password reset link. The link expires in 30 minutes.
                </p>
                <p className="text-xs text-on-surface-variant/60 mb-6">
                  Don&apos;t see the email? Check your spam folder.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-forest-base hover:text-antique-gold transition-colors"
                >
                  <Icon name="arrow_back" size={16} />
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-forest-base/10 flex items-center justify-center">
                    <Icon name="lock_reset" size={26} className="text-forest-base" />
                  </div>
                  <h1 className="font-headline text-2xl sm:text-[28px] text-forest-deep leading-tight">
                    Forgot password?
                  </h1>
                  <p className="text-[13px] text-on-surface-variant mt-2">
                    Enter your email and we&apos;ll send you a reset link.
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
                      htmlFor="email"
                      className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="you@example.com"
                      className="
                        w-full bg-surface-container-lowest border border-outline-variant rounded-xl
                        px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200
                        placeholder:text-on-surface-variant/40
                        focus:ring-2 focus:ring-forest-base/20 focus:border-forest-base
                        hover:border-outline
                      "
                    />
                  </div>

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
                        Sending...
                      </>
                    ) : (
                      <>
                        <Icon name="mail" size={18} />
                        Send reset link
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
