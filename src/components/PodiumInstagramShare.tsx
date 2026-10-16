"use client";

import Link from "next/link";
import { useState } from "react";

const CAPTION = "I added my collection to atelierperfumes.in. Add your collection and share your scent podium.";

function InstagramIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.35" cy="6.8" r="1.1" fill="currentColor" /></svg>;
}

export function PodiumInstagramShare({ username, shelfCount, podiumCount }: { username: string; shelfCount: number; podiumCount: number }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardUrl = `/api/podium/${encodeURIComponent(username)}`;

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(CAPTION);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  if (shelfCount === 0) return <Link href="/me/perfumes/new" className="podium-share podium-share--guide"><InstagramIcon /><span><b>Share your scent Podium</b><small>Add your top 3 perfumes to your shelf to create an Instagram-ready card.</small></span><em>Start →</em></Link>;
  if (shelfCount < 3) return <Link href="/me/perfumes/new" className="podium-share podium-share--guide"><InstagramIcon /><span><b>Build your scent Podium</b><small>Add {3 - shelfCount} more perfume{3 - shelfCount === 1 ? "" : "s"} to your shelf, then choose your top 3.</small></span><em>Add →</em></Link>;
  if (podiumCount < 3) return <a href="#scent-profile" className="podium-share podium-share--guide"><InstagramIcon /><span><b>Choose your top 3 for the Podium</b><small>Pick {3 - podiumCount} more favourite{3 - podiumCount === 1 ? "" : "s"} to unlock your share card.</small></span><em>Choose →</em></a>;

  return <>
    <button type="button" className="podium-share podium-share--ready" onClick={() => setOpen(true)}><InstagramIcon /><span><b>Share on Instagram</b><small>Your scent Podium is ready to share.</small></span><em>↗</em></button>
    {open ? <div className="podium-share-modal" role="dialog" aria-modal="true" aria-labelledby="podium-share-title" onMouseDown={() => setOpen(false)}>
      <div className="podium-share-dialog" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="podium-share-close" onClick={() => setOpen(false)} aria-label="Close share dialog">×</button>
        <p className="eyebrow">YOUR SCENT PODIUM</p><h2 id="podium-share-title">Your Instagram post is ready.</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cardUrl} alt="A preview of your Atelier scent Podium card" className="podium-share-preview" />
        <ol className="podium-share-steps"><li><b>1</b><span>Save your generated Podium card.</span></li><li><b>2</b><span>Copy the caption, then open Instagram.</span></li><li><b>3</b><span>Create a post, select the card, and paste the caption.</span></li></ol>
        <div className="podium-share-actions"><a className="btn" href={cardUrl} download={`atelier-${username}-podium.png`}>Save image</a><button type="button" className="btn btn-ghost" onClick={copyCaption}>{copied ? "Caption copied" : "Copy caption"}</button><a className="btn btn-ghost" href="https://www.instagram.com/" target="_blank" rel="noreferrer">Open Instagram</a></div>
        <p className="podium-share-note">The card includes atelierperfumes.in. Instagram does not allow a website to create a personal-account post draft directly; this keeps the final post under your control.</p>
      </div>
    </div> : null}
  </>;
}
