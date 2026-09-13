"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const links = [
  ["Create", "/me/create"],
  ["Drafts", "/me/drafts"],
  ["Activity", "/me/activity"],
  ["Bids", "/me/bids"],
  ["Buys", "/me/buys"],
  ["Wishlist", "/me/wishlist"],
] as const;

export function NavMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div className="nav-menu" ref={menuRef}>
      <button type="button" className="nav-menu-trigger" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
        My Atelier <span aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div className="nav-menu-panel" role="menu">
          {links.map(([label, href]) => <Link key={href} href={href} role="menuitem" onClick={() => setOpen(false)}>{label}</Link>)}
        </div>
      ) : null}
    </div>
  );
}
