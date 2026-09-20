import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { markDealSoldForm } from "@/actions/form-wrappers";
import { Notice } from "@/components/Notice";
import { formatMoney } from "@/lib/money";
import { MessageComposer } from "@/components/MessageComposer";

function shortTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(date);
}

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const { notice } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?from=/me/messages/${id}`);
  const convo = await prisma.conversation.findUnique({
    where: { id },
    include: {
      bid: { include: { perfume: true, bidder: true, seller: true } },
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!convo) notFound();
  if (convo.bid.bidderId !== session.user.id && convo.bid.sellerId !== session.user.id) notFound();
  // Closing a completed deal marks the bid as archived, but the buyer and
  // seller should still be able to coordinate delivery asynchronously.
  const chatEnabled = convo.bid.kind === "buy" || ["accepted", "archived"].includes(convo.bid.status);
  const counterpart = convo.bid.bidderId === session.user.id ? convo.bid.seller : convo.bid.bidder;
  const closedDeal = convo.bid.status === "archived";
  return (
    <div className="chat-page">
      <header className="chat-header">
        <Link href="/me/messages" className="chat-back" aria-label="Back to all messages">←</Link>
        <span className="chat-avatar" aria-hidden="true">{counterpart.username.slice(0, 2).toUpperCase()}</span>
        <div className="min-w-0"><h1>@{counterpart.username}</h1><p>{closedDeal ? "Deal closed · keep coordinating here" : chatEnabled ? "Deal chat open" : "Waiting for seller acceptance"}</p></div>
      </header>
      <Notice message={notice} />
      <Link href={`/p/${convo.bid.perfume.id}`} className="chat-deal-card">
        <span><strong>{convo.bid.perfume.name}</strong><small>{convo.bid.kind === "buy" ? "Purchase request" : "Accepted bid"} · {formatMoney(convo.bid.amountCents)} · {convo.bid.perfume.unitsAvailable} unit{convo.bid.perfume.unitsAvailable === 1 ? "" : "s"} available</small></span>
        <span aria-hidden="true">↗</span>
      </Link>
      <ul className="chat-transcript" aria-label="Conversation">
        {convo.messages.map((m) => (
          <li key={m.id} className={`chat-message ${m.senderId === session.user.id ? "chat-message-own" : "chat-message-other"}`}>
            <div className="chat-bubble">
              <p className="chat-message-sender">@{m.sender.username}{m.senderId === session.user.id ? " · you" : ""}</p>
              <p>{m.body}</p>
              <time>{shortTime(m.createdAt)}</time>
            </div>
          </li>
        ))}
      </ul>
      {convo.bid.sellerId === session.user.id && chatEnabled && !closedDeal ? <form action={markDealSoldForm} className="chat-fulfilment"><input type="hidden" name="conversationId" value={id} /><span><strong>Fulfil this deal</strong><small>Marks one unit sold. {convo.bid.perfume.unitsAvailable} available before confirmation.</small></span><button className="btn btn-compact" type="submit">Mark one sold</button></form> : null}
      {chatEnabled ? (
        <MessageComposer conversationId={id} />
      ) : (
        <div className="chat-pending">
          {convo.bid.status === "declined" ? "This bid was declined. The deal chat is closed." : "This deal thread is ready. The seller must accept the bid before messages can be exchanged."}
        </div>
      )}
    </div>
  );
}
