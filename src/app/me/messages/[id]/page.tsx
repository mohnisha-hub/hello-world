import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { messageForm } from "@/actions/form-wrappers";
import { Notice } from "@/components/Notice";
import { formatMoney } from "@/lib/money";

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
  return (
    <div className="space-y-4">
      <Link href="/me/messages">← All messages</Link>
      <h1 className="text-3xl">{convo.bid.perfume.name}</h1>
      <Notice message={notice} />
      <p className="text-muted">
        {convo.bid.kind === "buy" ? "Buy" : "Bid"} {formatMoney(convo.bid.amountCents)} ·{" "}
        <Link href={`/p/${convo.bid.perfume.id}`}>listing</Link>
      </p>
      <ul className="space-y-3">
        {convo.messages.map((m) => (
          <li key={m.id} className="card p-3">
            <p className="text-xs text-muted">@{m.sender.username}</p>
            <p>{m.body}</p>
          </li>
        ))}
      </ul>
      <form action={messageForm} className="flex gap-2">
        <input type="hidden" name="conversationId" value={id} />
        <input name="body" className="flex-1" placeholder="Write a note" required />
        <button className="btn" type="submit">
          Send
        </button>
      </form>
    </div>
  );
}
