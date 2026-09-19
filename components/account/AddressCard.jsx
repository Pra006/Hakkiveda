"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import AddressFormModal from "./AddressFormModal";
import { toast } from "react-toastify";

export default function AddressCard({ address }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Remove this address?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/account/addresses/${address.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Address removed");
        router.refresh();
      } else {
        toast.error("Could not remove address");
      }
    } catch {
      toast.error("Could not remove address");
      setDeleting(false);
    }
  }

  async function handleSetDefault() {
    await fetch(`/api/account/addresses/${address.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...address, isDefault: true }),
    });
    toast.success("Default address updated");
    router.refresh();
  }

  return (
    <article className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-forest-base/10 flex items-center justify-center">
            <Icon
              name={address.type === "OFFICE" ? "business" : "home"}
              size={18}
              className="text-forest-base"
            />
          </div>
          <div>
            <h2 className="font-semibold text-forest-deep text-sm">{address.label}</h2>
            <span className="text-xs text-on-surface-variant">{address.type.toLowerCase()}</span>
          </div>
        </div>
        {address.isDefault && (
          <span className="text-[10px] font-bold text-herbal-jade bg-herbal-jade/10 rounded-full px-2.5 py-1 uppercase tracking-wider">
            Default
          </span>
        )}
      </div>

      <div className="text-sm text-on-surface-variant leading-relaxed">
        <div className="font-semibold text-forest-deep">{address.fullName}</div>
        {address.streetAddress && <div>{address.streetAddress}</div>}
        <div>{address.city}{address.district ? `, ${address.district}` : ""}</div>
        <div>{address.province}{address.postalCode ? `, ${address.postalCode}` : ""}</div>
        <div className="mt-1">{address.phone}</div>
      </div>

      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-outline-variant/40">
        <AddressFormModal address={address} />
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-semibold text-terracotta hover:underline disabled:opacity-50"
        >
          {deleting ? "Removing..." : "Remove"}
        </button>
        {!address.isDefault && (
          <button
            onClick={handleSetDefault}
            className="text-xs font-semibold text-forest-base hover:text-antique-gold ml-auto"
          >
            Set as default
          </button>
        )}
      </div>
    </article>
  );
}
