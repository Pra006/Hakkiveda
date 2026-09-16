"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

function EsewaRedirectContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const orderId = sp.get("orderId");
  const formRef = useRef(null);
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let cancelled = false;
    if (!orderId) {
      setState({ loading: false, error: "Missing order reference", data: null });
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/payment/esewa/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not initiate eSewa payment");
        if (cancelled) return;
        setState({ loading: false, error: "", data: json });
      } catch (err) {
        if (!cancelled) setState({ loading: false, error: err.message, data: null });
      }
    })();
    return () => { cancelled = true; };
  }, [orderId]);

  useEffect(() => {
    if (state.data && formRef.current) {
      const t = setTimeout(() => formRef.current?.submit(), 400);
      return () => clearTimeout(t);
    }
  }, [state.data]);

  if (state.error) {
    return (
      <Section className="py-16 text-center max-w-lg mx-auto">
        <Icon name="error" size={40} className="text-terracotta" />
        <h1 className="font-headline text-2xl text-forest-deep mt-3">
          Couldn&apos;t start eSewa payment
        </h1>
        <p className="text-sm text-on-surface-variant mt-2">{state.error}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button as={Link} href="/account/orders" variant="secondary">Back to orders</Button>
          <Button onClick={() => router.push("/checkout")}>Return to checkout</Button>
        </div>
      </Section>
    );
  }

  return (
    <Section className="py-16 text-center max-w-lg mx-auto">
      <Icon name="account_balance_wallet" size={40} className="text-antique-gold" />
      <h1 className="font-headline text-2xl text-forest-deep mt-3">Redirecting to eSewa…</h1>
      <p className="text-sm text-on-surface-variant mt-2">
        You&apos;ll complete payment on eSewa&apos;s secure page and return here
        automatically.
      </p>

      {state.data && (
        <form ref={formRef} method="POST" action={state.data.formUrl} className="mt-8">
          {Object.entries(state.data.fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={String(value)} />
          ))}
          <noscript>
            <button
              type="submit"
              className="mt-4 px-5 py-2.5 rounded bg-forest-base text-antique-gold font-semibold"
            >
              Continue to eSewa
            </button>
          </noscript>
        </form>
      )}
    </Section>
  );
}

export default function EsewaRedirectPage() {
  return (
    <Suspense fallback={
      <Section className="py-16 text-center max-w-lg mx-auto">
        <Icon name="account_balance_wallet" size={40} className="text-antique-gold" />
        <h1 className="font-headline text-2xl text-forest-deep mt-3">Preparing payment…</h1>
      </Section>
    }>
      <EsewaRedirectContent />
    </Suspense>
  );
}
