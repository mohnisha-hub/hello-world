"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function MessageNavLink() {
  const [unread, setUnread] = useState(false);
  useEffect(() => {
    const receive = (event: Event) => setUnread(Boolean((event as CustomEvent<{ unreadMessages?: number }>).detail?.unreadMessages));
    window.addEventListener("atelier:notifications", receive);
    return () => window.removeEventListener("atelier:notifications", receive);
  }, []);
  return <Link className="nav-utility nav-utility-text" href="/me/messages" aria-label={unread ? "Messages (unread)" : "Messages"}>
    Messages
    {unread ? <span className="notification-dot" aria-hidden="true" /> : null}
  </Link>;
}
