"use client";
import { useEffect, useState } from "react";
import ProductCard from "@/components/storefront/ProductCard";
import Icon from "@/components/ui/Icon";

function pad(n) {
  return String(n).padStart(2, "0");
}

function Countdown({ endDate }) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = new Date(endDate).getTime();
  const diff = now == null ? 0 : Math.max(0, target - now);
  const expired = now != null && diff === 0;

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const cells = [
    [pad(d), "Days"],
    [pad(h), "Hours"],
    [pad(m), "Min"],
    [pad(s), "Sec"],
  ];

  if (expired) {
    return (
      <p className="text-sm font-semibold text-terracotta">This offer has ended</p>
    );
  }

  return (
    <div className="flex items-center gap-2" suppressHydrationWarning>
      {cells.map(([v, l], i) => (
        <div key={l} className="flex items-center gap-2">
          <div className="flex flex-col items-center bg-forest-deep text-antique-gold rounded-lg px-3 py-2 min-w-[52px] shadow">
            <span
              className="font-headline text-xl sm:text-2xl leading-none font-bold"
              suppressHydrationWarning
            >
              {now == null ? "--" : v}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-earth-sand mt-1">
              {l}
            </span>
          </div>
          {i < cells.length - 1 && (
            <span className="text-forest-deep font-headline text-xl sm:text-2xl">:</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SaleBanner({ promotion }) {
  const [visible, setVisible] = useState(true);

  // Auto-hide when the promotion expires
  useEffect(() => {
    const end = new Date(promotion.endDate).getTime();
    const remaining = end - Date.now();
    if (remaining <= 0) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(t);
  }, [promotion.endDate]);

  if (!visible) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-terracotta/10 via-ivory-canvas to-antique-gold/10 border border-terracotta/20">
      {/* Banner image background (optional) */}
      {promotion.bannerImage && (
        <div className="absolute inset-0">
          <img
            src={promotion.bannerImage}
            alt=""
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ivory-canvas/80 via-ivory-canvas/90 to-ivory-canvas" />
        </div>
      )}

      <div className="relative z-10 px-6 py-10 lg:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-terracotta text-xs font-bold uppercase tracking-widest mb-2">
              <Icon name="local_fire_department" size={16} />
              Limited-Time Offer
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl text-forest-deep leading-tight">
              {promotion.title}
            </h2>
            {promotion.subtitle && (
              <p className="text-sm text-on-surface-variant mt-1 max-w-lg">
                {promotion.subtitle}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5">
              Ends in
            </p>
            <Countdown endDate={promotion.endDate} />
          </div>
        </div>

        {/* Product cards */}
        {promotion.products?.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {promotion.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
