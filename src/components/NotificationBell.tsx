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
    <button className="theme-toggle" type="button" onClick={() => { setOpen(!open); if (!open) markRead(); }} aria-label="Notifications">♢{unread ? <span className="rounded-full bg-accent px-1.5 text-xs text-on-accent">{unread}</span> : null}</button>
    {open ? <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-line bg-paper p-2 shadow-xl"><p className="px-3 py-2 text-xs uppercase tracking-wider text-muted">Activity</p>{items.length ? items.map((item) => <Link key={item.id} href={item.href} className="block rounded-xl px-3 py-3 text-sm hover:bg-bg" onClick={() => setOpen(false)}>{item.body}</Link>) : <p className="px-3 py-4 text-sm text-muted">No activity yet.</p>}</div> : null}
  </div>;
}
