"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { toast } from "react-toastify";

function EsewaResultContent() {
  const sp = useSearchParams();
  const status = sp.get("status") || "invalid";
  const orderNumber = sp.get("order");

  // After a successful eSewa payment the DB cart is already cleared by
  // markPaymentPaid — refresh the frontend state so the header updates.
  useEffect(() => {
    if (status === "success") {
      // Cart was already cleared in the DB by markPaymentPaid.
      // Trigger a revalidation so CartProvider picks up the empty cart
      // when the user navigates to a storefront page.
      fetch("/api/cart").catch(() => {});
      toast.success("Payment successful! Your order is confirmed.");
    } else if (status === "failed") {
      toast.error("Payment was not completed.");
    } else if (status === "pending") {
      toast.info("Payment is pending confirmation.");
    }
  }, [status]);

  const copy = {
    success: {
      icon: "check_circle",
      colour: "text-herbal-jade",
      title: "Payment successful",
      body: "Your eSewa payment has been confirmed and your order is now being prepared.",
    },
    failed: {
      icon: "cancel",
      colour: "text-terracotta",
      title: "Payment not completed",
      body: "eSewa didn't confirm this payment. Your order has been cancelled and no amount will be charged.",
    },
    pending: {
      icon: "hourglass_top",
      colour: "text-antique-gold",
      title: "Payment pending confirmation",
      body: "eSewa hasn't finalised this transaction yet. We'll update your order as soon as it does — no need to pay again.",
    },
    invalid: {
      icon: "error",
      colour: "text-terracotta",
      title: "We couldn't verify this payment",
      body: "The response from eSewa was missing or invalid. If money was taken from your account, contact support with your order number.",
    },
  }[status] || {
    icon: "info",
    colour: "text-on-surface-variant",
    title: "Payment status",
    body: "See your order details for the latest payment status.",
  };

  return (
    <Section className="py-16 text-center max-w-lg mx-auto">
      <Icon name={copy.icon} size={48} className={copy.colour} />
      <h1 className="font-headline text-2xl text-forest-deep mt-3">{copy.title}</h1>
      <p className="text-sm text-on-surface-variant mt-2">{copy.body}</p>
      {orderNumber && (
        <p className="text-xs uppercase tracking-widest text-on-surface-variant mt-4">
          Order <span className="font-semibold text-forest-deep">{orderNumber}</span>
        </p>
      )}
      <div className="mt-6 flex justify-center gap-3 flex-wrap">
        <Button as={Link} href="/account/orders" variant="secondary">
          <Icon name="receipt_long" size={17} /> My orders
        </Button>
        <Button as={Link} href="/shop">Continue shopping</Button>
      </div>
    </Section>
  );
}

export default function EsewaResultPage() {
  return (
    <Suspense fallback={
      <Section className="py-16 text-center max-w-lg mx-auto">
        <Icon name="hourglass_top" size={48} className="text-antique-gold" />
        <h1 className="font-headline text-2xl text-forest-deep mt-3">Loading payment result…</h1>
      </Section>
    }>
      <EsewaResultContent />
    </Suspense>
  );
}
