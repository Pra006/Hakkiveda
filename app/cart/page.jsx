import StorefrontShell from "@/components/layout/StorefrontShell";
import CartView from "@/components/cart/CartView";

export const metadata = { title: "Shopping Cart" };

export default function CartPage() {
  return (
    <StorefrontShell>
      <CartView />
    </StorefrontShell>
  );
}
