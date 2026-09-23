"use client";
import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function AnnouncementBar() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="relative w-full bg-forest-base text-ivory-canvas px-4 py-2.5 text-center text-xs font-semibold tracking-widest uppercase z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="w-6 hidden md:block" />
        <div className="flex-1 flex flex-wrap items-center justify-center gap-2">
          <Icon name="eco" size={15} className="text-antique-gold" />
          <span>Rooted in Tradition · Crafted with Nature</span>
          <span className="text-antique-gold/70 mx-1 hidden sm:inline">|</span>
          <span className="text-earth-sand normal-case tracking-normal">
            Free delivery across Nepal on orders above NPR 2,999
          </span>
        </div>
        <button
          aria-label="Dismiss announcement"
          onClick={() => setOpen(false)}
          className="text-ivory-canvas/70 hover:text-ivory-canvas p-1 rounded"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
}
