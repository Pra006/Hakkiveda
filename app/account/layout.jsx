import StorefrontShell from "@/components/layout/StorefrontShell";
import AccountNav from "@/components/account/AccountNav";

export const metadata = { title: { template: "%s | My Account", default: "My Account" } };

export default function AccountLayout({ children }) {
  return (
    <StorefrontShell>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-8 lg:py-12">
        <div className="flex gap-10">
          <AccountNav />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </StorefrontShell>
  );
}
