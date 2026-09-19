"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Icon from "@/components/ui/Icon";

const mainNav = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Hero Banners", href: "/admin/hero-banners", icon: "view_carousel" },
];

const customerNav = [
  { label: "Customers", href: "/admin/customers", icon: "people" },
  { label: "Reviews", href: "/admin/reviews", icon: "reviews" },
];

const ordersNav = [
  { label: "Orders", href: "/admin/customer-orders", icon: "receipt_long" },
];

const b2bNav = [
  { label: "Overview", href: "/admin/b2b", icon: "monitoring" },
  { label: "Applications", href: "/admin/b2b/applications", icon: "description" },
  { label: "Organizations", href: "/admin/b2b/organizations", icon: "corporate_fare" },
  { label: "Members", href: "/admin/b2b/members", icon: "badge" },
  { label: "RFQs", href: "/admin/b2b/rfqs", icon: "request_quote" },
  { label: "Quotations", href: "/admin/b2b/quotations", icon: "calculate" },
  { label: "Purchase Orders", href: "/admin/b2b/purchase-orders", icon: "assignment" },
  { label: "Orders", href: "/admin/b2b/orders", icon: "local_shipping" },
  { label: "Invoices", href: "/admin/b2b/invoices", icon: "receipt" },
  { label: "Payments", href: "/admin/b2b/payments", icon: "payments" },
];

const productNav = [
  { label: "All Products", href: "/admin/products", icon: "inventory_2" },
  { label: "Categories", href: "/admin/categories", icon: "category" },
];

// Supporting tools — kept out of the five main areas.
const systemNav = [
  { label: "Reports", href: "/admin/reports", icon: "assessment" },
  { label: "Admins", href: "/admin/admins", icon: "admin_panel_settings" },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: "history" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

function NavItem({ item, pathname, onClick }) {
  const isActive = item.href === "/admin" || item.href === "/admin/b2b"
    ? pathname === item.href
    : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-slate-700/60 text-white font-medium"
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      }`}
    >
      <Icon name={item.icon} size={18} />
      <span>{item.label}</span>
    </Link>
  );
}

function NavSection({ title, children }) {
  return (
    <div className="mb-4">
      <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export default function AdminShell({ admin, children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [b2bOpen, setB2bOpen] = useState(
    pathname.startsWith("/admin/b2b")
  );

  const closeSidebar = () => setSidebarOpen(false);

  const sidebar = (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-700/50">
        <Link href="/admin" className="flex items-center gap-2.5" onClick={closeSidebar}>
          <div className="h-8 w-8 rounded bg-amber-500 flex items-center justify-center">
            <span className="font-bold text-slate-900 text-sm">H</span>
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">Hakkiveda</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Admin Panel</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Main */}
        {mainNav.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} onClick={closeSidebar} />
        ))}

        <NavSection title="Customers">
          {customerNav.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} onClick={closeSidebar} />
          ))}
        </NavSection>

        <NavSection title="Products">
          {productNav.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} onClick={closeSidebar} />
          ))}
        </NavSection>

        <NavSection title="Orders">
          {ordersNav.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} onClick={closeSidebar} />
          ))}
        </NavSection>

        <NavSection title="B2B Business">
          <button
            onClick={() => setB2bOpen((v) => !v)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-3">
              <Icon name="business" size={18} />
              <span>B2B Management</span>
            </span>
            <Icon name={b2bOpen ? "expand_less" : "expand_more"} size={18} />
          </button>
          {b2bOpen && (
            <div className="ml-4 pl-3 border-l border-slate-700/50 space-y-0.5 mt-1">
              {b2bNav.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} onClick={closeSidebar} />
              ))}
            </div>
          )}
        </NavSection>

        <NavSection title="System">
          {systemNav.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} onClick={closeSidebar} />
          ))}
        </NavSection>
      </nav>

      {/* Admin Profile */}
      <div className="px-4 py-3 border-t border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
            {admin.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{admin.name}</div>
            <div className="text-[10px] text-amber-400 uppercase tracking-wider">{admin.role.replace(/_/g, " ")}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-slate-500 hover:text-red-400 transition-colors"
            title="Sign out"
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 w-[260px] h-screen z-30">
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={closeSidebar}>
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className="absolute top-0 left-0 w-[280px] h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:ml-[260px] min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-14 flex items-center px-4 lg:px-6 gap-4">
          <button
            className="lg:hidden text-slate-600 hover:text-slate-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="menu" size={22} />
          </button>

          <div className="flex-1" />

          <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <Icon name="storefront" size={14} />
            <span className="hidden sm:inline">View Store</span>
          </Link>

          <div className="text-xs text-slate-500">
            {admin.name}
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
