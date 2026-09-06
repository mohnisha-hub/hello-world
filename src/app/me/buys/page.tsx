import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { archiveBidForm, rateForm } from "@/actions/form-wrappers";
import { Notice } from "@/components/Notice";

export default async function BuysPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; notice?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/me/buys");
  const { tab = "bought", notice } = await searchParams;
  const buyWhere = { kind: "buy" as const };
  const [bought, sold] = await Promise.all([
    prisma.bid.findMany({
      where: { ...buyWhere, bidderId: session.user.id },
      include: { perfume: true, bidder: true, seller: true, conversation: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bid.findMany({
      where: { ...buyWhere, sellerId: session.user.id },
      include: { perfume: true, bidder: true, seller: true, conversation: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const ratings = await prisma.rating.findMany({ where: { raterId: session.user.id } });
  const rated = new Set(ratings.map((r) => r.perfumeId));
  const rows = tab === "sold" ? sold : bought;

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Buys</h1>
      <p className="text-muted">Fixed-price purchases. Bids are under Bids; chats are under Messages.</p>
      <Notice message={notice} />
      <div className="flex gap-3">
        <Link href="/me/buys?tab=bought" className={tab === "sold" ? "btn btn-ghost" : "btn"}>
          Bought
        </Link>
        <Link href="/me/buys?tab=sold" className={tab === "sold" ? "btn" : "btn btn-ghost"}>
          Sold
        </Link>
      </div>
      {rows.length === 0 ? <p className="text-muted">Nothing here yet.</p> : null}
      <ul className="space-y-3">
        {rows.map((b) => (
          <li key={b.id} className="card space-y-2 p-4">
            <Link href={`/p/${b.perfume.id}`} className="font-serif text-xl">
              {b.perfume.name}
            </Link>
            <p>
              {formatMoney(b.amountCents)} · {tab === "sold" ? `@${b.bidder.username}` : `@${b.seller.username}`}
            </p>
            <div className="flex flex-wrap gap-2">
              {b.conversation ? <Link href={`/me/messages/${b.conversation.id}`}>Open chat</Link> : null}
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
              <form action={archiveBidForm}>
                <input type="hidden" name="id" value={b.id} />
                <button className="btn btn-ghost" type="submit">
                  Archive
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
