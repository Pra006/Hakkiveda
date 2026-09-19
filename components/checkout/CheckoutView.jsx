"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Section } from "@/components/ui/Section";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { formatNPR } from "@/lib/utils";
import { useCart } from "@/components/providers/CartProvider";
import { toast } from "react-toastify";

const steps = ["Address", "Delivery", "Review", "Payment"];

const PAYMENT_METHODS = [
  ["COD", "Cash on Delivery", "payments"],
  ["ESEWA", "eSewa", "account_balance_wallet"],
];

const NEPAL_PROVINCES = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
];

function Field({ label, required, error, ...rest }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
        {label} {required && <span className="text-terracotta">*</span>}
      </span>
      <input
        {...rest}
        className={`bg-surface-container-lowest border rounded px-3 py-2.5 text-sm outline-none focus:border-antique-gold ${
          error ? "border-terracotta" : "border-outline-variant"
        }`}
      />
    </label>
  );
}

export default function CheckoutView() {
  const router = useRouter();
  const { items, subtotal, shipping, tax, total, count, loading, signedIn, refreshCart } = useCart();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    province: "",
    city: "",
    postalCode: "",
    street: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const required = ["fullName", "phone", "province", "city", "street"];
  const missing = required.filter((f) => !form[f].trim());

  async function placeOrder() {
    setTouched(true);
    if (missing.length) {
      setError("Please complete the required shipping fields.");
      toast.error("Please complete all required shipping fields.");
      return;
    }
    setPlacing(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, paymentMethod }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not place your order");

      if (paymentMethod === "ESEWA") {
        // eSewa: hand off to the redirect page which POSTs the signed form.
        // Cart will be refreshed on the result page after payment confirmation.
        router.push(`/payment/esewa/redirect?orderId=${encodeURIComponent(json.order.id)}`);
      } else {
        // COD etc.: cart was already cleared in the DB during order creation.
        // Refresh the frontend cart state so the header count updates immediately.
        await refreshCart();
        router.push(`/account/orders?placed=${json.order.orderNumber}`);
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Could not place your order");
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <Section className="py-16 text-center text-sm text-on-surface-variant">Loading your checkout…</Section>
    );
  }

  if (!signedIn) {
    return (
      <Section className="py-16 text-center">
        <Icon name="lock" size={40} className="text-outline-variant" />
        <h1 className="font-headline text-2xl text-forest-deep mt-3">Sign in to check out</h1>
        <Button as={Link} href="/auth/login?callbackUrl=%2Fcheckout" size="lg" className="mt-5">
          Sign in
        </Button>
      </Section>
    );
  }

  if (count === 0) {
    return (
      <Section className="py-16 text-center">
        <Icon name="shopping_bag" size={40} className="text-outline-variant" />
        <h1 className="font-headline text-2xl text-forest-deep mt-3">Your bag is empty</h1>
        <p className="text-sm text-on-surface-variant mt-1">Add something before checking out.</p>
        <Button as={Link} href="/shop" size="lg" className="mt-5">Browse products</Button>
      </Section>
    );
  }

  return (
    <Section className="py-8">
      <ol className="flex items-center gap-2 sm:gap-4 justify-center flex-wrap">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2 sm:gap-4">
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-forest-base text-antique-gold border-forest-base">
              {i + 1}
            </span>
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-forest-deep">{s}</span>
            {i < steps.length - 1 && <span className="w-6 h-px bg-outline-variant" />}
          </li>
        ))}
      </ol>

      {error && (
        <p className="mt-6 flex items-center gap-2 text-sm text-terracotta font-semibold">
          <Icon name="error" size={16} /> {error}
        </p>
      )}

      <div className="mt-8 grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-6">
          {/* Address */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6">
            <h2 className="font-headline text-xl text-forest-deep">Shipping Address</h2>
            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              <Field label="Full Name" required placeholder="Prakash Adhikari"
                value={form.fullName} error={touched && !form.fullName.trim()}
                onChange={(e) => update("fullName", e.target.value)} />
              <Field label="Phone" required placeholder="98XXXXXXXX"
                value={form.phone} error={touched && !form.phone.trim()}
                onChange={(e) => update("phone", e.target.value)} />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                  Province <span className="text-terracotta">*</span>
                </span>
                <select
                  value={form.province}
                  onChange={(e) => update("province", e.target.value)}
                  className={`bg-surface-container-lowest border rounded px-3 py-2.5 text-sm outline-none focus:border-antique-gold ${
                    touched && !form.province.trim() ? "border-terracotta" : "border-outline-variant"
                  }`}
                >
                  <option value="">Select province</option>
                  {NEPAL_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <Field label="City" required placeholder="Kathmandu"
                value={form.city} error={touched && !form.city.trim()}
                onChange={(e) => update("city", e.target.value)} />
              <Field label="Postal Code" placeholder="44600"
                value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
              <div className="sm:col-span-2">
                <Field label="Street Address" required placeholder="Ward 5, Baluwatar"
                  value={form.street} error={touched && !form.street.trim()}
                  onChange={(e) => update("street", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Delivery Instructions (optional)" placeholder="Landmark, gate colour…"
                  value={form.notes} onChange={(e) => update("notes", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6">
            <h2 className="font-headline text-xl text-forest-deep">Delivery Method</h2>
            <div className="mt-4 flex items-center gap-3 p-4 rounded-lg border border-antique-gold bg-antique-gold/5">
              <Icon name="local_shipping" size={20} className="text-antique-gold" />
              <div className="flex-1">
                <div className="font-semibold text-forest-deep">Standard Delivery (3–5 days)</div>
                <div className="text-xs text-on-surface-variant">
                  {shipping === 0 ? "Free delivery on this order" : `${formatNPR(shipping)} — free above NPR 2,999`}
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6">
            <h2 className="font-headline text-xl text-forest-deep">Payment</h2>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(([value, label, icon]) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer ${
                    paymentMethod === value ? "border-antique-gold bg-antique-gold/5" : "border-outline-variant hover:border-antique-gold"
                  }`}
                >
                  <input
                    type="radio"
                    name="pay"
                    value={value}
                    checked={paymentMethod === value}
                    onChange={() => setPaymentMethod(value)}
                  />
                  <Icon name={icon} size={20} className="text-antique-gold" />
                  <span className="font-semibold text-forest-deep">{label}</span>
                </label>
              ))}
            </div>
            {paymentMethod === "ESEWA" ? (
              <p className="mt-3 text-[11px] text-on-surface-variant">
                You&apos;ll be redirected to eSewa&apos;s secure sandbox to complete the payment.
                Test account details are available from{" "}
                <a
                  href="https://developer.esewa.com.np/pages/Epay-V2"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  eSewa&apos;s ePay V2 documentation
                </a>
                .
              </p>
            ) : (
              <p className="mt-3 text-[11px] text-on-surface-variant">
                Payment is recorded as pending and confirmed by our team.
              </p>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 self-start bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6">
          <h2 className="font-headline text-xl text-forest-deep">Order Review</h2>
          <ul className="mt-4 divide-y divide-outline-variant/60">
            {items.map((it) => (
              <li key={it.id} className="py-3 flex gap-3">
                <img src={it.image || it.product.images?.[0]} alt="" className="w-14 h-14 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-forest-deep line-clamp-1">{it.product.name}</div>
                  <div className="text-xs text-on-surface-variant">{it.variantName ? it.variantName + " · " : ""}Qty {it.quantity}</div>
                </div>
                <div className="text-sm font-semibold text-forest-deep">{formatNPR(it.lineTotal)}</div>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatNPR(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatNPR(shipping)}</dd></div>
            <div className="flex justify-between"><dt>VAT (13%)</dt><dd>{formatNPR(tax)}</dd></div>
            <div className="border-t border-outline-variant pt-2 mt-2 flex justify-between items-baseline">
              <dt className="font-semibold text-forest-deep">Total</dt>
              <dd className="font-headline text-2xl text-forest-deep">{formatNPR(total)}</dd>
            </div>
          </dl>
          <Button size="lg" className="w-full mt-6" onClick={placeOrder} disabled={placing}>
            {placing
              ? paymentMethod === "ESEWA" ? "Redirecting to eSewa…" : "Placing order…"
              : paymentMethod === "ESEWA" ? "Pay with eSewa" : "Place Order"}
          </Button>
          <p className="mt-3 text-[11px] text-on-surface-variant text-center">
            By placing your order, you agree to Hakkiveda&apos;s Terms and acknowledge the Privacy Policy.
          </p>
        </aside>
      </div>
    </Section>
  );
}
