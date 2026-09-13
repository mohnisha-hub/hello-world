"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = { id: string; body: string; href: string; readAt: string | null };

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const load = async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (response.ok) setItems((await response.json()).notifications);
  };
  useEffect(() => { load(); const timer = window.setInterval(load, 15000); return () => window.clearInterval(timer); }, []);
  const unread = items.filter((item) => !item.readAt).length;
  const markRead = async () => { await fetch("/api/notifications", { method: "POST" }); await load(); };
  return <div className="relative">
    <button className="notification-bell" type="button" onClick={() => { setOpen(!open); if (!open) markRead(); }} aria-label={unread ? `Notifications (${unread} unread)` : "Notifications"} aria-expanded={open}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>
      {unread ? <span className="notification-count">{unread > 9 ? "9+" : unread}</span> : null}
    </button>
    {open ? <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-line bg-paper p-2 shadow-xl"><p className="px-3 py-2 text-xs uppercase tracking-wider text-muted">Activity</p>{items.length ? items.map((item) => <Link key={item.id} href={item.href} className="block rounded-xl px-3 py-3 text-sm hover:bg-bg" onClick={() => setOpen(false)}>{item.body}</Link>) : <p className="px-3 py-4 text-sm text-muted">No activity yet.</p>}</div> : null}
  </div>;
}
