"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import { useWishlist } from "@/components/providers/WishlistProvider";

export default function WishlistRemoveButton({ productId }) {
  const router = useRouter();
  const wishlist = useWishlist();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    try {
      const result = await wishlist.toggle(productId);
      if (result?.error) throw new Error();
      router.refresh();
    } catch {
      toast.error("Could not remove from wishlist");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-terracotta hover:text-terracotta/80 disabled:opacity-50 transition-colors"
    >
      <Icon name={loading ? "progress_activity" : "delete"} size={14} className={loading ? "animate-spin" : ""} />
      {loading ? "Removing..." : "Remove"}
    </button>
  );
}
