"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Icon from "@/components/ui/Icon";

const links = [
  { label: "Overview", href: "/account", icon: "dashboard" },
  { label: "My Orders", href: "/account/orders", icon: "receipt_long" },
  { label: "Wishlist", href: "/account/wishlist", icon: "favorite" },
  { label: "Addresses", href: "/account/addresses", icon: "location_on" },
  { label: "Settings", href: "/account/settings", icon: "settings" },
];

export default function AccountNav() {
  const pathname = usePathname();

  function isActive(href) {
    if (href === "/account") return pathname === "/account";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-28 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/50 px-3 mb-3">
            My Account
          </div>
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-forest-base/8 text-forest-deep font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-forest-deep"
                }`}
              >
                <Icon name={link.icon} size={18} filled={active} />
                {link.label}
              </Link>
            );
          })}
          <div className="h-px bg-outline-variant/40 my-3" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-terracotta hover:bg-terracotta/5 w-full transition-all"
          >
            <Icon name="logout" size={18} />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Mobile horizontal nav */}
      <nav className="lg:hidden -mx-5 sm:-mx-8 px-5 sm:px-8 mb-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max pb-1">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-forest-base text-white"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <Icon name={link.icon} size={14} filled={active} />
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap text-terracotta bg-terracotta/5 hover:bg-terracotta/10 transition-all"
          >
            <Icon name="logout" size={14} />
            Sign Out
          </button>
        </div>
      </nav>
    </>
  );
}
