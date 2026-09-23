import Icon from "@/components/ui/Icon";

const items = [
  { icon: "history_edu", title: "Ancient Wisdom", sub: "Traditional preparations" },
  { icon: "nature", title: "Wildcrafted", sub: "Hand-harvested botanicals" },
  { icon: "sanitizer", title: "Carefully Crafted", sub: "Zero mineral oils or toxins" },
  { icon: "cruelty_free", title: "Ahimsa & Ethical", sub: "Fair pay to makers" },
  { icon: "local_shipping", title: "Nepal-wide Delivery", sub: "Free above NPR 2,999" },
];

export default function TrustStrip() {
  return (
    <section className="w-full bg-surface-container-low border-y border-forest-base/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {items.map((it) => (
            <div key={it.title} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-surface flex items-center justify-center shrink-0 text-herbal-jade shadow-sm border border-forest-base/10">
                <Icon name={it.icon} size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-forest-deep leading-tight">{it.title}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{it.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
