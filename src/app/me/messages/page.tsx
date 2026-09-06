import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/money";

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
    <div className="space-y-4">
      <h1 className="text-4xl">Messages</h1>
      {threads.length === 0 ? <p className="text-muted">Place a bid or buy a perfume to start a chat.</p> : null}
      <ul className="space-y-3">
        {threads.map((t) => (
          <li key={t.id} className="card p-4">
            <Link href={`/me/messages/${t.id}`} className="font-serif text-xl">
              {t.bid.perfume.name}
            </Link>
            <p className="text-sm text-muted">
              {t.bid.kind === "buy" ? "Buy" : "Bid"} {formatMoney(t.bid.amountCents)} · @{t.bid.bidder.username} & @
              {t.bid.seller.username}
            </p>
            <p>{t.messages[0]?.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
