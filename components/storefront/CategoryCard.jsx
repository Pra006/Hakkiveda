import Link from "next/link";
import Icon from "@/components/ui/Icon";

/**
 * Variants:
 *  - "default"  — standard square tile used in grid
 *  - "hero"     — large 3:2 tile used for featured collections
 *  - "wide"     — 16:9 landscape tile
 *  - "compact"  — small 5:4 tile used inside dense rows
 */
export default function CategoryCard({ category, variant = "default", eyebrow, description }) {
  const aspect = {
    default: "aspect-square",
    hero: "aspect-[3/2]",
    wide: "aspect-[16/9]",
    compact: "aspect-[5/4]",
  }[variant];

  const titleSize = {
    default: "text-lg",
    hero: "text-3xl sm:text-4xl",
    wide: "text-2xl",
    compact: "text-base",
  }[variant];

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={`group relative ${aspect} rounded-2xl overflow-hidden bg-forest-deep border border-outline-variant/60 hover:border-antique-gold/60 shadow-sm hover:shadow-xl transition-all`}
    >
      <img
        src={category.image}
        alt={category.name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-[900ms] ease-out"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/25 to-transparent" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-antique-gold/10 via-transparent to-transparent" />

      {eyebrow && (
        <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-forest-deep/70 backdrop-blur border border-antique-gold/40 text-xs uppercase tracking-wider font-semibold text-antique-gold">
          <Icon name="auto_awesome" size={12} />
          {eyebrow}
        </div>
      )}

      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-ivory-canvas/90 backdrop-blur text-xs uppercase tracking-wider font-bold text-forest-deep">
        {category.productCount} items
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-2">
        <h3 className={`font-headline ${titleSize} text-ivory-canvas leading-tight`}>
          {category.name}
        </h3>
        {description && variant !== "compact" && (
          <p className="text-sm text-earth-sand/85 line-clamp-2 max-w-md">{description}</p>
        )}
        <div className="mt-1 inline-flex items-center gap-1 text-antique-gold text-xs font-semibold uppercase tracking-widest">
          Explore
          <Icon name="arrow_forward" size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
