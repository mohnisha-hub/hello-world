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
  return <Link className="nav-utility nav-utility-text" href="/me/messages" aria-label={unread ? "Messages (unread)" : "Messages"}>
    Messages
    {unread ? <span className="notification-dot" aria-hidden="true" /> : null}
  </Link>;
}
