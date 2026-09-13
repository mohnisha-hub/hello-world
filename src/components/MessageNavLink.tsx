"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function MessageNavLink() {
  const [unread, setUnread] = useState(false);
  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (response.ok) setUnread((await response.json()).unreadMessages > 0);
    };
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, []);
  return <Link className="nav-utility" href="/me/messages" aria-label={unread ? "Messages (unread)" : "Messages"} title="Messages">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20 15a3 3 0 0 1-3 3H8l-4 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3z" /><path d="M8 9h8M8 13h5" /></svg>
    {unread ? <span className="notification-dot" aria-hidden="true" /> : null}
  </Link>;
}
