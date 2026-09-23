"use client";
import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Icon from "@/components/ui/Icon";
import { useCart } from "@/components/providers/CartProvider";

const nav = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/shop" },
  { label: "Collections", href: "/categories" },
  { label: "Stores", href: "/stores" },
  { label: "Blog", href: "/blogs" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { data: session, status } = useSession();
  const { count: cartCount } = useCart();
  const user = session?.user ?? null;

  return (
    <>
      <header className="sticky top-0 w-full z-40 bg-surface/95 backdrop-blur-md border-b border-forest-base/5 shadow-[0_2px_12px_rgba(15,38,24,0.04)]">
        <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3.5 shrink-0">
            <button className="lg:hidden text-forest-deep -ml-2 p-2" onClick={() => setMenuOpen(true)} aria-label="Menu">
              <Icon name="menu" size={24} />
            </button>
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-md border border-antique-gold/40 bg-forest-base flex items-center justify-center shadow-sm">
                <span className="font-headline text-antique-gold text-lg font-bold">आ</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-headline text-[22px] font-semibold text-forest-deep tracking-tight group-hover:text-forest-base">
                  Hakkiveda
                </span>
                <span className="text-xs text-antique-gold tracking-wider mt-1 font-bold">
                  Nepal Marketplace
                </span>
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-sm text-on-surface-variant hover:text-forest-deep transition-colors py-1"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen((v) => !v)}
              className="p-2 text-forest-deep hover:text-antique-gold"
            >
              <Icon name="search" size={22} />
            </button>

            {!user?.isB2B && (
              <Link
                href="/b2b/apply"
                className="hidden md:inline-flex text-xs font-semibold uppercase tracking-widest text-forest-deep hover:text-antique-gold px-3 py-2 border border-forest-base/20 rounded"
              >
                B2B Exp/Imp
              </Link>
            )}

            {/* AUTH */}
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-surface-container animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-outline-variant hover:border-antique-gold bg-surface-container-lowest transition"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                >
                  <span className="w-7 h-7 rounded-full bg-forest-base text-antique-gold flex items-center justify-center text-xs font-bold">
                    {user.name?.[0] || "A"}
                  </span>
                  <span className="hidden md:inline text-sm font-semibold text-forest-deep">
                    {user.name?.split(" ")[0] || "Account"}
                  </span>
                  <Icon name="expand_more" size={16} className="text-on-surface-variant" />
                </button>
                {accountOpen && (
                  <div
                    role="menu"
                    onMouseLeave={() => setAccountOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-forest-base/5 border-b border-outline-variant">
                      <div className="text-sm font-semibold text-forest-deep">{user.name}</div>
                      <div className="text-xs text-on-surface-variant truncate">{user.email}</div>
                    </div>
                    {[
                      ["My Orders", "/account/orders", "receipt_long"],
                      ["Wishlist", "/wishlist", "favorite"],
                      ["Addresses", "/account/addresses", "location_on"],
                      ["Settings", "/account/settings", "settings"],
                    ].map(([label, href, icon]) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-forest-deep hover:bg-forest-base/5"
                      >
                        <Icon name={icon} size={16} className="text-antique-gold" />
                        {label}
                      </Link>
                    ))}
                    <div className="border-t border-outline-variant">
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: "/" });
                          setAccountOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-terracotta hover:bg-terracotta/5 text-left"
                      >
                        <Icon name="logout" size={16} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold uppercase tracking-widest text-forest-deep hover:text-antique-gold"
                >
                  <Icon name="login" size={16} />
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold uppercase tracking-widest bg-antique-gold text-forest-deep hover:brightness-95 shadow-sm"
                >
                  <Icon name="person_add" size={16} />
                  Register
                </Link>
                <Link
                  href="/auth/login"
                  aria-label="Sign in"
                  className="sm:hidden p-2 text-forest-deep hover:text-antique-gold"
                >
                  <Icon name="account_circle" size={24} />
                </Link>
              </>
            )}

            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="relative hidden sm:inline-flex p-2 text-forest-deep hover:text-antique-gold"
            >
              <Icon name="favorite" size={22} />
            </Link>
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative flex items-center gap-2.5 bg-forest-base text-ivory-canvas px-3.5 py-2 rounded-lg shadow-sm hover:bg-forest-deep"
            >
              <Icon name="shopping_bag" size={20} className="text-antique-gold" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-antique-gold text-forest-deep text-[10px] font-bold flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
              <span className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-xs uppercase text-earth-sand tracking-wider font-semibold">Bag</span>
                <span className="text-xs font-semibold text-ivory-canvas">
                  {cartCount > 0 ? `${cartCount} item${cartCount === 1 ? "" : "s"}` : "Cart"}
                </span>
              </span>
            </Link>
          </div>
        </div>

        {/* Search dropdown */}
        {searchOpen && (
          <div className="border-t border-forest-base/10 bg-surface">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
              <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3">
                <Icon name="search" size={20} className="text-forest-base" />
                <input
                  autoFocus
                  placeholder="Search Ayurvedic oils, honey, handloom, brass ..."
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-on-surface-variant"
                />
                <button onClick={() => setSearchOpen(false)} className="text-on-surface-variant hover:text-forest-deep">
                  <Icon name="close" size={20} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {["Bhringraj oil", "Raw honey", "Dhaka shawl", "Copper bottle", "Handloom", "Silver earrings"].map((s) => (
                  <button
                    key={s}
                    className="px-3 py-1 rounded-full border border-outline-variant text-forest-deep hover:bg-forest-base/5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-forest-deep/40 backdrop-blur-sm" />
          <aside
            className="absolute top-0 left-0 h-full w-72 bg-surface shadow-2xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-headline text-xl text-forest-deep">Menu</span>
              <button onClick={() => setMenuOpen(false)}>
                <Icon name="close" size={22} />
              </button>
            </div>

            {user ? (
              <div className="mb-5 p-4 rounded-lg bg-forest-base/5 border border-outline-variant flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-forest-base text-antique-gold flex items-center justify-center font-bold">
                  {user.name?.[0] || "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-forest-deep truncate">{user.name}</div>
                  <div className="text-xs text-on-surface-variant truncate">{user.email}</div>
                </div>
              </div>
            ) : (
              <div className="mb-5 grid grid-cols-2 gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded text-xs font-semibold uppercase tracking-widest border border-forest-base/20 text-forest-deep hover:bg-forest-base/5"
                >
                  <Icon name="login" size={14} />
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded text-xs font-semibold uppercase tracking-widest bg-antique-gold text-forest-deep hover:brightness-95"
                >
                  <Icon name="person_add" size={14} />
                  Register
                </Link>
              </div>
            )}

            <nav className="flex flex-col gap-1">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-3 rounded-lg text-forest-deep hover:bg-forest-base/5 font-medium"
                >
                  {n.label}
                </Link>
              ))}
              <div className="border-t border-outline-variant my-3" />
              {user && (
                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-3 rounded-lg text-forest-deep hover:bg-forest-base/5"
                >
                  My Account
                </Link>
              )}
              {!user?.isB2B && (
                <Link
                  href="/b2b/apply"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-3 rounded-lg text-forest-deep hover:bg-forest-base/5"
                >
                  B2B Exp/Imp
                </Link>
              )}
              {user && (
                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                    setMenuOpen(false);
                  }}
                  className="px-3 py-3 rounded-lg text-terracotta hover:bg-terracotta/5 text-left"
                >
                  Sign out
                </button>
              )}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
