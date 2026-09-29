"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

const WishlistContext = createContext(null);

export default function WishlistProvider({ children }) {
  const { status } = useSession();
  const [ids, setIds] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);

  const signedIn = status === "authenticated";

  useEffect(() => {
    if (!signedIn) {
      setIds(new Set());
      setLoaded(false);
      return;
    }
    let active = true;
    fetch("/api/account/wishlist")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .catch(() => ({ items: [] }))
      .then((data) => {
        if (!active) return;
        setIds(new Set((data.items || []).map((i) => i.product?.id).filter(Boolean)));
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [signedIn]);

  const add = useCallback(async (productId) => {
    setPending(true);
    try {
      const res = await fetch("/api/account/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add to wishlist");
      setIds((prev) => {
        const next = new Set(prev);
        next.add(productId);
        return next;
      });
      return true;
    } finally {
      setPending(false);
    }
  }, []);

  const remove = useCallback(async (productId) => {
    setPending(true);
    try {
      const res = await fetch("/api/account/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not remove from wishlist");
      }
      setIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      return true;
    } finally {
      setPending(false);
    }
  }, []);

  const toggle = useCallback(
    async (productId) => {
      if (!signedIn) return { requireLogin: true };
      try {
        if (ids.has(productId)) {
          await remove(productId);
          toast.info("Removed from wishlist");
          return { added: false };
        }
        await add(productId);
        toast.success("Added to wishlist");
        return { added: true };
      } catch (err) {
        toast.error(err.message || "Wishlist update failed");
        return { error: true };
      }
    },
    [signedIn, ids, add, remove]
  );

  const has = useCallback((productId) => ids.has(productId), [ids]);

  return (
    <WishlistContext.Provider
      value={{
        ids,
        count: ids.size,
        has,
        toggle,
        pending,
        loaded,
        signedIn,
        sessionStatus: status,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
