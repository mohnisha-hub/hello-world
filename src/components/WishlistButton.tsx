"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleWishlistAction } from "@/actions/wishlist";

export function WishlistButton({ targetId, targetType, saved, label }: { targetId: string; targetType: "perfume" | "collection"; saved: boolean; label: string }) {
  const router = useRouter();
  const [active, setActive] = useState(saved);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const wasSaved = active;
    startTransition(async () => {
      const data = new FormData();
      data.set("targetType", targetType);
      data.set("targetId", targetId);
      const result = await toggleWishlistAction(data);
      if (!result) return;
      setActive(result.saved);
      if (result.saved && !wasSaved) window.setTimeout(() => router.push("/me/wishlist?notice=Added%20to%20your%20wishlist."), 500);
    });
  }

  return <button className={`btn btn-ghost wishlist-button${active ? " is-saved" : ""}`} type="button" disabled={pending} onClick={toggle} aria-pressed={active}>{pending ? "Saving…" : active ? "✓ Saved to wishlist" : label}</button>;
}
