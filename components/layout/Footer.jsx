import Link from "next/link";

const FACEBOOK_URL = process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/hakkiveda";
const WHATSAPP_DIGITS = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "9779744897448").replace(
  /[^0-9]/g,
  ""
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_DIGITS}`;

const socialLinks = [
  {
    name: "facebook",
    label: "Follow Hakkiveda on Facebook",
    href: FACEBOOK_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
        <path d="M13.5 21.95v-8.05h2.7l.4-3.15h-3.1V8.7c0-.9.25-1.5 1.55-1.5h1.65V4.4c-.3-.05-1.3-.15-2.45-.15-2.4 0-4.05 1.45-4.05 4.15v2.3H7.5v3.15h2.7v8.1h3.3z" />
      </svg>
    ),
  },
  {
    name: "whatsapp",
    label: "Chat with Hakkiveda on WhatsApp",
    href: WHATSAPP_URL,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.695.626.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    ),
  },
];

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
      ["Give Feedback", "/account/feedback"],
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
              <div className="h-12 w-12 rounded-md border border-antique-gold/40 bg-ivory-canvas flex items-center justify-center p-1 shrink-0">
                <img src="/hakkiveda-logo.png" alt="Hakkiveda" className="h-full w-full object-contain" />
              </div>
              <span className="font-headline text-lg">Hakkiveda</span>
            </div>
            <p className="text-xs text-earth-sand/80 leading-relaxed max-w-xs">
              Nepal's marketplace for ancestral goods — direct from the makers.
            </p>
            <div className="flex items-center gap-2 mt-3">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="w-7 h-7 rounded-full border border-antique-gold/30 flex items-center justify-center text-antique-gold hover:bg-antique-gold hover:text-forest-deep transition"
                >
                  {s.icon}
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
