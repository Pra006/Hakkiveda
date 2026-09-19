"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";

export default function WishlistRemoveButton({ productId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    try {
      await fetch("/api/account/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      router.refresh();
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Could not remove from wishlist");
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
