import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { listingAmountCents } from "@/lib/sale";
import { acceptBidForm, archiveBidForm, declineBidForm, rateForm } from "@/actions/form-wrappers";
import { Notice } from "@/components/Notice";

export default async function BidsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; notice?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/me/bids");
  const { tab = "received", notice } = await searchParams;
  const bidWhere = { kind: "bid" as const };
  const [sent, received, archived] = await Promise.all([
    prisma.bid.findMany({
      where: { ...bidWhere, bidderId: session.user.id, status: { in: ["open", "accepted", "declined"] } },
      include: { perfume: true, seller: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bid.findMany({
      where: { ...bidWhere, sellerId: session.user.id, status: { in: ["open", "accepted"] } },
      include: { perfume: true, bidder: true, conversation: true },
      orderBy: [{ amountCents: "desc" }, { createdAt: "desc" }],
    }),
    prisma.bid.findMany({
      where: {
        ...bidWhere,
        status: "archived",
        OR: [{ bidderId: session.user.id }, { sellerId: session.user.id }],
      },
      include: { perfume: true, bidder: true, seller: true, conversation: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const ratings = await prisma.rating.findMany({
    where: { raterId: session.user.id },
  });
  const rated = new Set(ratings.map((r) => r.perfumeId));
  const highestByPerfume = new Map<string, number>();
  for (const b of received.filter((row) => row.status === "open")) {
    const current = highestByPerfume.get(b.perfumeId) ?? 0;
    if (b.amountCents > current) highestByPerfume.set(b.perfumeId, b.amountCents);
  }

  const tabs = [
    ["received", "Received"],
    ["sent", "Sent"],
    ["archives", "Archives"],
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Bids</h1>
      <p className="text-muted">Offers on bid listings. Buys are under Buys; chats are under Messages.</p>
      <Notice message={notice} />
      <div className="flex gap-3">
        {tabs.map(([id, label]) => (
          <Link key={id} href={`/me/bids?tab=${id}`} className={tab === id ? "btn" : "btn btn-ghost"}>
            {label}
          </Link>
        ))}
      </div>
      {tab === "sent" ? (
        <ul className="space-y-3">
          {sent.length === 0 ? <p className="text-muted">You have not placed any bids.</p> : null}
          {sent.map((b) => (
            <li key={b.id} className="card p-4">
              <Link href={`/p/${b.perfume.id}`} className="font-serif text-xl">
                {b.perfume.name}
              </Link>
              <p>
                You bid {formatMoney(b.amountCents)} · min {formatMoney(listingAmountCents(b.perfume))} · @
                {b.seller.username}
              </p>
              <p className="text-sm text-muted">{b.status}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {tab === "received" ? (
        <ul className="space-y-3">
          {received.length === 0 ? <p className="text-muted">No bids on your listings yet.</p> : null}
          {received.map((b) => (
            <li key={b.id} className="card space-y-2 p-4">
              <Link href={`/p/${b.perfume.id}`} className="font-serif text-xl">
                {b.perfume.name}
              </Link>
              <p>
                @{b.bidder.username} offers {formatMoney(b.amountCents)} · min{" "}
                {formatMoney(listingAmountCents(b.perfume))}
                {highestByPerfume.get(b.perfumeId) === b.amountCents && b.status === "open" ? " · highest" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {b.status === "open" ? (
                  <>
                    <form action={acceptBidForm}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="btn" type="submit">
                        Accept (opens chat)
                      </button>
                    </form>
                    <form action={declineBidForm}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="btn btn-ghost" type="submit">
                        Decline
                      </button>
                    </form>
                    <Link className="btn btn-ghost" href={`/p/${b.perfume.id}`}>
                      All bids
                    </Link>
                  </>
                ) : null}
                {b.conversation ? <Link href={`/me/messages/${b.conversation.id}`}>Open chat</Link> : null}
                <form action={archiveBidForm}>
                  <input type="hidden" name="id" value={b.id} />
                  <button className="btn btn-ghost" type="submit">
                    Close / sold
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {tab === "archives" ? (
        <ul className="space-y-3">
          {archived.map((b) => (
            <li key={b.id} className="card space-y-2 p-4">
              <Link href={`/p/${b.perfume.id}`} className="font-serif text-xl">
                {b.perfume.name}
              </Link>
              <p>
                {formatMoney(b.amountCents)} · @{b.bidder.username} → @{b.seller.username}
              </p>
              {b.bidderId === session.user.id && !rated.has(b.perfumeId) ? (
                <form action={rateForm} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="perfumeId" value={b.perfumeId} />
                  <label className="field">
                    Purchase
                    <input name="purchaseScore" type="number" min={1} max={10} required />
                  </label>
                  <label className="field">
                    Delivery
                    <input name="deliveryScore" type="number" min={1} max={10} required />
                  </label>
                  <button className="btn" type="submit">
                    Rate seller
                  </button>
                </form>
              ) : null}
              {b.conversation ? <Link href={`/me/messages/${b.conversation.id}`}>Chat</Link> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
