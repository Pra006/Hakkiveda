import AnnouncementBar from "./AnnouncementBar";
import Header from "./Header";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import CartProvider from "@/components/providers/CartProvider";

export default function StorefrontShell({ children }) {
  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen">
        <AnnouncementBar />
        <Header />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
      </div>
    </CartProvider>
  );
}
