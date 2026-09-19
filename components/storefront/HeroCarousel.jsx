"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

/* ─── Fallback slides (shown only when no banners exist in the DB) ───── */
const FALLBACK_SLIDES = [
  {
    title: "Ancient Wisdom. Rooted in Nature.",
    subtitle:
      "Discover ancestral Ayurvedic formulations, handloom textiles, wildcrafted honey, and heirloom craft — direct from Nepal's most respected artisan cooperatives.",
    buttonText: "Shop the Collection",
    buttonLink: "/shop",
    image:
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=80",
    badgeIcon: "spa",
    badgeLabel: "Nepal's Heritage Marketplace",
  },
];

const AUTOPLAY_MS = 5500;

export default function HeroCarousel() {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Fetch banners from the public API
  useEffect(() => {
    let cancelled = false;
    fetch("/api/hero-banners")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        // Map API fields to slide shape
        const mapped = (data || []).map((b) => ({
          title: b.title,
          subtitle: b.subtitle,
          buttonText: b.buttonText,
          buttonLink: b.buttonLink,
          image: b.imageUrl,
          badgeIcon: b.badgeIcon,
          badgeLabel: b.badgeLabel,
        }));
        setSlides(mapped.length > 0 ? mapped : FALLBACK_SLIDES);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setSlides(FALLBACK_SLIDES);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = slides.length;
  const go = useCallback((n) => setIndex(((n % total) + total) % total), [total]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  // Autoplay
  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, total]);

  // Don't render anything until we know what to show
  if (!loaded) {
    return (
      <section className="relative w-full h-[520px] sm:h-[560px] lg:h-[620px] bg-forest-deep" />
    );
  }

  return (
    <section
      className="relative w-full overflow-hidden bg-forest-deep text-ivory-canvas"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Hakkiveda featured collections"
    >
      {/* Slides */}
      <div className="relative h-[520px] sm:h-[560px] lg:h-[620px]">
        {slides.map((s, i) => {
          const active = i === index;
          return (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                active ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
              aria-hidden={!active}
            >
              {/* Image */}
              <img
                src={s.image}
                alt=""
                className={`absolute inset-0 w-full h-full object-cover ${
                  active ? "animate-slow-zoom" : ""
                }`}
              />
              {/* Overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/85 via-forest-deep/55 to-forest-deep/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/70 via-transparent to-transparent" />

              {/* Content */}
              <div className="relative h-full max-w-7xl mx-auto px-6 lg:px-12 flex items-center">
                <div className="max-w-2xl">
                  {/* Badge / eyebrow */}
                  {s.badgeLabel && (
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ivory-canvas/10 border border-antique-gold/40 backdrop-blur-sm mb-5 transition-all duration-700 delay-100 ${
                        active ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                      }`}
                    >
                      {s.badgeIcon && (
                        <Icon name={s.badgeIcon} size={16} className="text-antique-gold" />
                      )}
                      <span className="text-[11px] uppercase tracking-widest font-semibold text-earth-sand">
                        {s.badgeLabel}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h1
                    className={`font-headline text-4xl sm:text-5xl lg:text-[62px] leading-[1.05] tracking-tight text-ivory-canvas transition-all duration-700 delay-200 ${
                      active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                  >
                    {s.title}
                  </h1>

                  {/* Subtitle */}
                  {s.subtitle && (
                    <p
                      className={`mt-5 text-base sm:text-lg text-earth-sand/90 leading-relaxed max-w-xl transition-all duration-700 delay-300 ${
                        active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                      }`}
                    >
                      {s.subtitle}
                    </p>
                  )}

                  {/* CTA */}
                  {s.buttonText && s.buttonLink && (
                    <div
                      className={`mt-8 transition-all duration-700 delay-500 ${
                        active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                      }`}
                    >
                      <Link
                        href={s.buttonLink}
                        className="inline-flex items-center gap-2 bg-antique-gold text-forest-deep px-7 py-3.5 rounded font-semibold text-sm sm:text-base shadow-lg hover:brightness-95 transition"
                      >
                        {s.buttonText}
                        <Icon name="arrow_forward" size={18} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Arrows (only when multiple slides) */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="hidden sm:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-ivory-canvas/15 hover:bg-ivory-canvas/30 border border-ivory-canvas/30 backdrop-blur items-center justify-center text-ivory-canvas transition"
          >
            <Icon name="chevron_left" size={22} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="hidden sm:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-ivory-canvas/15 hover:bg-ivory-canvas/30 border border-ivory-canvas/30 backdrop-blur items-center justify-center text-ivory-canvas transition"
          >
            <Icon name="chevron_right" size={22} />
          </button>
        </>
      )}

      {/* Dots + progress */}
      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {slides.map((_, i) => {
            const active = i === index;
            return (
              <button
                key={i}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="group flex items-center"
              >
                <span
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    active
                      ? "w-10 bg-antique-gold"
                      : "w-4 bg-ivory-canvas/40 group-hover:bg-ivory-canvas/70"
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Slide counter */}
      {total > 1 && (
        <div className="absolute top-6 right-6 z-20 text-[11px] font-semibold uppercase tracking-widest text-earth-sand/80 bg-forest-deep/50 backdrop-blur px-3 py-1.5 rounded-full border border-antique-gold/20">
          {String(index + 1).padStart(2, "0")}{" "}
          <span className="text-antique-gold/70">/</span>{" "}
          {String(total).padStart(2, "0")}
        </div>
      )}
    </section>
  );
}
