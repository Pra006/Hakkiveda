import Link from "next/link";
import Icon from "@/components/ui/Icon";

const groups = [
  {
    title: "Hakkiveda",
    links: [
      ["Our Story", "/about"],
      ["Blogs", "/blogs"],
      ["Sustainability", "/sustainability"],
      ["Careers", "/careers"],
    ],
  },
  {
    title: "Customer Care",
    links: [
      ["Shipping", "/help/shipping"],
      ["Returns & Refunds", "/help/returns"],
      ["Order Tracking", "/account/orders"],
      ["Contact Us", "/contact"],
    ],
  },
  {
    title: "For Sellers",
    links: [
      ["Sell on Hakkiveda", "/b2b/apply"],
      ["B2B Business Central", "/b2b"],
      ["Commission & Fees", "/help/fees"],
      ["B2B Business Handbook", "/help/b2b"],
    ],
  },
  {
    title: "Policies",
    links: [
      ["Privacy", "/policies/privacy"],
      ["Terms of Use", "/policies/terms"],
      ["Refund Policy", "/policies/refund"],
      ["Cookies", "/policies/cookies"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-forest-deep text-ivory-canvas mt-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        {/* Newsletter */}
        <div className="grid lg:grid-cols-2 gap-6 border-b border-antique-gold/20 pb-6 mb-6 items-center">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-antique-gold mb-1">Newsletter</div>
            <h3 className="font-headline text-xl leading-tight">Slow letters from the hills.</h3>
            <p className="mt-1 text-xs text-earth-sand/80 max-w-md">
              One thoughtful email a month — new B2B business stories and seasonal drops.
            </p>
          </div>
          <form className="flex items-center gap-2">
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 bg-transparent border-b border-antique-gold/50 py-2 outline-none placeholder:text-earth-sand/40 text-ivory-canvas text-sm"
            />
            <button className="bg-antique-gold text-forest-deep px-4 py-2 rounded font-semibold text-xs">
              Subscribe
            </button>
          </form>
        </div>

        {/* Groups */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-md border border-antique-gold/40 bg-antique-gold/10 flex items-center justify-center">
                <span className="font-headline text-antique-gold text-base font-bold">आ</span>
              </div>
              <span className="font-headline text-lg">Hakkiveda</span>
            </div>
            <p className="text-xs text-earth-sand/80 leading-relaxed max-w-xs">
              Nepal's marketplace for ancestral goods — direct from the makers.
            </p>
            <div className="flex items-center gap-2 mt-3">
              {["public", "camera", "chat", "podcasts"].map((n) => (
                <a
                  key={n}
                  href="#"
                  className="w-7 h-7 rounded-full border border-antique-gold/30 flex items-center justify-center text-antique-gold hover:bg-antique-gold hover:text-forest-deep transition"
                >
                  <Icon name={n} size={14} />
                </a>
              ))}
            </div>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h4 className="text-antique-gold text-[10px] font-semibold uppercase tracking-widest mb-2">{g.title}</h4>
              <ul className="space-y-1 text-xs text-earth-sand/85">
                {g.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-antique-gold">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-antique-gold/20 flex flex-wrap items-center justify-between gap-3 text-[11px] text-earth-sand/70">
          <span>© {new Date().getFullYear()} Hakkiveda Marketplace Pvt. Ltd. — All rights reserved.</span>
          <div className="flex items-center gap-2">
            <span>Payments:</span>
            <span className="px-1.5 py-0.5 rounded bg-antique-gold/10 border border-antique-gold/20">eSewa</span>
            <span className="px-1.5 py-0.5 rounded bg-antique-gold/10 border border-antique-gold/20">Khalti</span>
            <span className="px-1.5 py-0.5 rounded bg-antique-gold/10 border border-antique-gold/20">COD</span>
            <span className="px-1.5 py-0.5 rounded bg-antique-gold/10 border border-antique-gold/20">Bank</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
