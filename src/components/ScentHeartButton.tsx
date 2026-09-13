"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toggleScentHeartAction } from "@/actions/profile";

type HeartVariant = "podium" | "role";

export function ScentHeartButton({ profileId, perfumeId, slot, count, hearted, canHeart, variant }: { profileId: string; perfumeId: string; slot: string; count: number; hearted: boolean; canHeart: boolean; variant: HeartVariant }) {
  const [active, setActive] = useState(hearted);
  const [heartCount, setHeartCount] = useState(count);
  const [celebrating, setCelebrating] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const addingHeart = !active;
    startTransition(async () => {
      await toggleScentHeartAction(formData);
      setActive(addingHeart);
      setHeartCount((current) => Math.max(0, current + (addingHeart ? 1 : -1)));
      if (addingHeart) {
        setCelebrating(true);
        window.setTimeout(() => setCelebrating(false), 550);
      }
    });
  };

  return <form onSubmit={submit} className={`scent-heart scent-heart--${variant}${active ? " is-hearted" : ""}${celebrating ? " is-celebrating" : ""}`}>
    <input type="hidden" name="profileId" value={profileId} />
    <input type="hidden" name="perfumeId" value={perfumeId} />
    <input type="hidden" name="slot" value={slot} />
    <button type="submit" disabled={!canHeart || pending} aria-label={active ? "Remove heart" : "Heart this pick"} aria-pressed={active}>
      <span className="scent-heart-symbol" aria-hidden="true">♥</span>
      {heartCount > 0 ? <span className="scent-heart-count">{heartCount}</span> : null}
    </button>
    <span className="sr-only" aria-live="polite">{celebrating ? "Heart added" : ""}</span>
  </form>;
}
