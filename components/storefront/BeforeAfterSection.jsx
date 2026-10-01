"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Icon from "@/components/ui/Icon";

const TRANSFORMATIONS = [
  {
    before: "/images/transformations/crown-density.jpg",
    after: "/images/transformations/crown-density.jpg",
    combined: true,
    duration: "90 Days",
    location: "Kathmandu, Nepal",
    title: "Crown Density Restored in 90 Days",
    concern: "Visible Scalp & Thinning Crown Area",
    quote:
      "I could see my scalp through my hair for years. Within 90 days of applying Hakkiveda Tribal Gold Oil regularly, thick new growth filled in my crown — people started asking what I changed.",
    name: "Suresh T.",
    badge: "Verified Buyer",
  },
];

function ImageSlider({ before, after, durationLabel, combined }) {
  const containerRef = useRef(null);
  const [pos, setPos] = useState(50);
  const [width, setWidth] = useState(0);
  const dragging = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const updatePos = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPos((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    function onMove(e) {
      if (!dragging.current) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      updatePos(clientX);
    }
    function onUp() { dragging.current = false; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [updatePos]);

  function handleDown(e) {
    dragging.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    updatePos(clientX);
  }

  return (
    <div
      ref={containerRef}
      className="relative block w-full max-w-full aspect-square sm:aspect-[4/5] lg:aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden cursor-col-resize select-none bg-slate-200 touch-pan-y"
      onMouseDown={handleDown}
      onTouchStart={handleDown}
    >
      {/* After (full, behind) */}
      <img
        src={after}
        alt="After"
        className="absolute inset-0 w-full h-full object-cover"
        style={combined ? { objectPosition: "right center" } : undefined}
        draggable={false}
      />

      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img
          src={before}
          alt="Before"
          className="absolute inset-0 h-full object-cover"
          style={{
            width: width > 0 ? `${width}px` : "100%",
            maxWidth: "none",
            ...(combined ? { objectPosition: "left center" } : {}),
          }}
          draggable={false}
        />
      </div>

      {/* Labels */}
      <span className="absolute top-4 left-4 bg-forest-deep text-ivory-canvas text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-md z-10">
        Before
      </span>
      <span className="absolute top-4 right-4 bg-antique-gold text-forest-deep text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-md z-10">
        After ({durationLabel})
      </span>

      {/* Slider line + handle */}
      <div className="absolute top-0 bottom-0 z-20 pointer-events-none" style={{ left: `${pos}%` }}>
        <div className="absolute top-0 bottom-0 -translate-x-1/2 w-0.5 bg-antique-gold shadow-lg" />
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-antique-gold border-2 border-ivory-canvas shadow-xl flex items-center justify-center pointer-events-auto">
          <Icon name="chevron_left" size={14} className="text-forest-deep -mr-1" />
          <Icon name="chevron_right" size={14} className="text-forest-deep -ml-1" />
        </div>
      </div>
    </div>
  );
}

export default function BeforeAfterSection() {
  const [active, setActive] = useState(0);
  const t = TRANSFORMATIONS[active];

  return (
    <section className="w-full max-w-full py-12 sm:py-16 lg:py-20 bg-ivory-canvas/60 relative overflow-x-clip">
      {/* Decorative leaves */}
      <div className="absolute top-16 -left-4 text-herbal-jade/15 rotate-12 pointer-events-none hidden lg:block">
        <Icon name="eco" size={80} />
      </div>
      <div className="absolute bottom-20 -right-4 text-herbal-jade/15 -rotate-12 pointer-events-none hidden lg:block">
        <Icon name="spa" size={80} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-2 text-antique-gold text-xs font-bold uppercase tracking-[0.2em] mb-3">
            <Icon name="auto_awesome" size={16} />
            Real Verified Transformations
          </div>
          <h2 className="font-headline text-2xl sm:text-4xl lg:text-5xl text-forest-deep leading-tight">
            Before &amp; After Results
          </h2>
          <p className="mt-3 text-sm sm:text-base text-on-surface-variant max-w-xl mx-auto">
            Drag the gold slider left and right to compare verified hair density and crown coverage.
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-5xl mx-auto bg-surface-container-lowest border border-outline-variant/60 rounded-2xl sm:rounded-3xl shadow-lg overflow-hidden">
          <div className="grid lg:grid-cols-2 min-w-0">
            {/* Image slider */}
            <div className="p-3 sm:p-6 min-w-0">
              <ImageSlider before={t.before} after={t.after} durationLabel={`${t.duration.replace(" Days", "")}D`} combined={t.combined} />
              <p className="text-xs text-on-surface-variant mt-2 text-center italic">
                *Drag handle to inspect follicle density
              </p>
            </div>

            {/* Details */}
            <div className="p-5 sm:p-8 lg:py-10 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-antique-gold/15 border border-antique-gold/40 text-xs font-bold uppercase tracking-wider text-antique-gold">
                  <Icon name="calendar_today" size={14} />
                  {t.duration} Transformation
                </span>
                <span className="inline-flex items-center gap-1 text-sm text-on-surface-variant">
                  <Icon name="location_on" size={14} />
                  {t.location}
                </span>
              </div>

              <h3 className="font-headline text-xl sm:text-2xl text-forest-deep leading-snug mb-3">
                {t.title}
              </h3>

              <p className="text-xs font-bold uppercase tracking-wider text-terracotta mb-4">
                Concern: {t.concern}
              </p>

              <div className="relative pl-5 border-l-2 border-antique-gold/40 mb-6">
                <Icon name="format_quote" size={24} className="absolute -left-3 -top-1 text-antique-gold/40" />
                <p className="text-sm sm:text-base text-forest-deep/80 italic leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div>
                <p className="font-headline text-base font-bold text-forest-deep tracking-wide">
                  {t.name}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {t.badge} &bull; {t.location}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dots */}
        {TRANSFORMATIONS.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {TRANSFORMATIONS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Transformation ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === active ? "w-8 bg-antique-gold" : "w-2 bg-forest-base/20 hover:bg-forest-base/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
