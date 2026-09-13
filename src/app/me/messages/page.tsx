import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

function shortTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(date);
}

function threadState(kind: string, status: string) {
  if (kind === "buy") return "Purchase chat";
  if (status === "open") return "Awaiting acceptance";
  if (status === "declined") return "Bid declined";
  if (status === "archived") return "Deal closed";
  return "Deal accepted";
}

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/me/messages");
  const threads = await prisma.conversation.findMany({
    where: {
      bid: { OR: [{ bidderId: session.user.id }, { sellerId: session.user.id }] },
    },
    include: {
      bid: { include: { perfume: true, bidder: true, seller: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="chat-index">
      <div className="chat-index-heading">
        <div>
          <p className="eyebrow">DEAL INBOX</p>
          <h1 className="text-4xl">Messages</h1>
        </div>
        <p className="text-sm text-muted">Private, deal-specific conversations.</p>
      </div>
      {threads.length === 0 ? <p className="chat-empty">Place a bid or buy a perfume to start a private conversation.</p> : null}
      <ul className="chat-thread-list">
        {threads.map((t) => {
          const counterpart = t.bid.bidderId === session.user.id ? t.bid.seller : t.bid.bidder;
          const lastMessage = t.messages[0];
          return (
            <li key={t.id}>
              <Link href={`/me/messages/${t.id}`} className="chat-thread">
                <span className="chat-avatar" aria-hidden="true">{counterpart.username.slice(0, 2).toUpperCase()}</span>
                <span className="chat-thread-copy">
                  <span className="chat-thread-topline"><strong>@{counterpart.username}</strong><time>{lastMessage ? shortTime(lastMessage.createdAt) : ""}</time></span>
                  <span className="chat-thread-listing">{t.bid.perfume.name}</span>
                  <span className="chat-thread-preview">{lastMessage?.body || "Offer created — waiting for an update."}</span>
                </span>
                <span className={`chat-state chat-state-${t.bid.status}`}>{threadState(t.bid.kind, t.bid.status)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
