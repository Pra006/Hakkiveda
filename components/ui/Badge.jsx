import { cn } from "@/lib/utils";

const tones = {
  gold: "bg-antique-gold/15 text-forest-deep border-antique-gold/40",
  forest: "bg-forest-base text-ivory-canvas border-forest-base",
  terracotta: "bg-terracotta/15 text-terracotta border-terracotta/40",
  jade: "bg-herbal-jade/15 text-herbal-jade border-herbal-jade/40",
  neutral: "bg-surface-container-high text-on-surface-variant border-outline-variant",
  sale: "bg-terracotta text-white border-terracotta",
  new: "bg-forest-base text-ivory-canvas border-forest-base",
};

export default function Badge({ children, tone = "gold", className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold uppercase tracking-wider",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
