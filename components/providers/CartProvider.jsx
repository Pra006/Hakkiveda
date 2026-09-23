"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

const CartContext = createContext(null);

const EMPTY = { items: [], count: 0, subtotal: 0, shipping: 0, tax: 0, total: 0 };

export default function CartProvider({ children }) {
  const { data, status } = useSession();
  const [cart, setCart] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const signedIn = status === "authenticated";
  const isB2B = !!data?.user?.isB2B;

  const request = useCallback(async (method, { body, query } = {}) => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/cart${query || ""}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update your cart");
      setCart(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setPending(false);
    }
  }, []);

  // Load the cart once the user is known to be signed in.
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    fetch("/api/cart")
      .then((res) => (res.ok ? res.json() : EMPTY))
      .catch(() => EMPTY)
      .then((data) => {
        if (!active) return;
        setCart(data);
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [signedIn]);

  const addItem = useCallback(
    (payload) => request("POST", { body: payload }),
    [request]
  );
  const setQuantity = useCallback(
    async (itemId, quantity) => {
      try {
        const data = await request("PATCH", { body: { itemId, quantity } });
        return data;
      } catch (err) {
        toast.error(err.message || "Could not update quantity");
        throw err;
      }
    },
    [request]
  );
  const removeItem = useCallback(
    async (itemId) => {
      try {
        const data = await request("DELETE", { query: `?itemId=${encodeURIComponent(itemId)}` });
        toast.success("Item removed from cart");
        return data;
      } catch (err) {
        toast.error(err.message || "Could not remove item");
        throw err;
      }
    },
    [request]
  );
  const clearCart = useCallback(async () => {
    try {
      const data = await request("DELETE");
      toast.success("Cart cleared");
      return data;
    } catch (err) {
      toast.error(err.message || "Could not clear cart");
      throw err;
    }
  }, [request]);

  /** Re-fetch the cart from the server (e.g. after a successful payment clears it in the DB). */
  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      const data = res.ok ? await res.json() : EMPTY;
      setCart(data);
      return data;
    } catch {
      setCart(EMPTY);
      return EMPTY;
    }
  }, []);

  // Signed-out visitors always see an empty cart.
  const visible = signedIn ? cart : EMPTY;

  return (
    <CartContext.Provider
      value={{
        ...visible,
        loading: status === "loading" || (signedIn && !loaded),
        pending,
        error,
        signedIn,
        isB2B,
        sessionStatus: status,
        addItem,
        setQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
