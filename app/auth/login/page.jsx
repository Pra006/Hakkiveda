"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const registered = searchParams.get("registered");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password.");
        toast.error("Invalid email or password.");
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
  }

  return (
    <div className="min-h-screen bg-surface-container-low relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-forest-base/[0.03] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-antique-gold/[0.04] blur-3xl" />
      </div>

      {/* Top accent bar */}
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

        {/* Main card */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl shadow-charcoal-ink/[0.06] overflow-hidden">
          {/* Card header */}
          <div className="px-6 sm:px-8 pt-8 pb-2">
            <h1 className="font-headline text-2xl sm:text-[28px] text-forest-deep text-center leading-tight">
              Welcome back
            </h1>
            <p className="text-[13px] text-on-surface-variant text-center mt-2">
              Sign in to your Hakkiveda account
            </p>
          </div>

          {/* Form area */}
          <div className="px-6 sm:px-8 py-6">
            {/* Success banner */}
            {registered && (
              <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-forest-base/[0.06] border border-forest-base/20">
                <Icon name="check_circle" size={18} className="text-forest-base shrink-0" filled />
                <p className="text-sm text-forest-deep font-medium">Account created! Sign in to continue.</p>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-terracotta/[0.06] border border-terracotta/20">
                <Icon name="error" size={18} className="text-terracotta shrink-0" />
                <p className="text-sm text-terracotta font-medium">{error}</p>
              </div>
            )}

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="
                w-full flex items-center justify-center gap-3
                bg-surface-container-lowest border border-outline-variant rounded-xl
                py-3.5 text-sm font-medium text-on-surface
                hover:bg-surface-container-low hover:border-outline hover:shadow-sm
                active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              {googleLoading ? (
                <>
                  <Icon name="progress_activity" size={18} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <GoogleIcon size={20} />
                  Continue with Google
                </>
              )}
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <span className="flex-1 h-px bg-outline-variant/50" />
              <span className="text-[11px] font-medium text-on-surface-variant/50 uppercase tracking-widest">
                or sign in with email
              </span>
              <span className="flex-1 h-px bg-outline-variant/50" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="
                    w-full bg-surface-container-lowest border border-outline-variant rounded-xl
                    px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200
                    placeholder:text-on-surface-variant/40
                    focus:ring-2 focus:ring-forest-base/20 focus:border-forest-base
                    hover:border-outline
                  "
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label
                    htmlFor="password"
                    className="text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant"
                  >
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-[11px] font-semibold text-forest-base hover:text-antique-gold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="
                      w-full bg-surface-container-lowest border border-outline-variant rounded-xl
                      px-4 py-3 pr-12 text-sm text-on-surface outline-none transition-all duration-200
                      placeholder:text-on-surface-variant/40
                      focus:ring-2 focus:ring-forest-base/20 focus:border-forest-base
                      hover:border-outline
                    "
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-on-surface-variant/60 hover:text-forest-deep hover:bg-surface-container transition-all"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
                  </button>
                </div>
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
                    Signing in...
                  </>
                ) : (
                  <>
                    <Icon name="login" size={18} />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Card footer */}
          <div className="mx-6 sm:mx-8 h-px bg-outline-variant/40" />
          <div className="px-6 sm:px-8 py-5 text-center bg-surface-container-low/30">
            <p className="text-sm text-on-surface-variant">
              New to Hakkiveda?{" "}
              <Link
                href="/auth/register"
                className="text-forest-base font-semibold hover:text-antique-gold transition-colors"
              >
                Create an account
              </Link>
            </p>
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
