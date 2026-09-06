import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isCommunityVisiblePerfume } from "@/lib/visibility";
import { formatMoney, formatPricePerMl } from "@/lib/money";
import { parseLinks, perfumeCompletion } from "@/lib/completion";
import { isBidListing, listingAmountCents } from "@/lib/sale";
import { StatusBadge } from "@/components/StatusBadge";
import { SaleBadge } from "@/components/SaleBadge";
import { Notice } from "@/components/Notice";
import { GuestAuthCta } from "@/components/GuestAuthCta";
import {
  acceptBidForm,
  bidForm,
  buyForm,
  declineBidForm,
  deletePerfumeForm,
  soldForm,
  wishlistForm,
} from "@/actions/form-wrappers";

export default async function PerfumePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const { notice } = await searchParams;
  const session = await auth();
  const perfume = await prisma.perfume.findUnique({
    where: { id },
    include: { owner: true, collection: true },
  });
  if (!perfume) notFound();
  const isOwner = session?.user?.id === perfume.ownerId;
  if (!isOwner) {
    if (!isCommunityVisiblePerfume(perfume)) notFound();
  }
  const links = parseLinks(perfume.links);
  const completion = perfumeCompletion(perfume);
  const amount = listingAmountCents(perfume);
  const bidListing = isBidListing(perfume.saleType);
  const wish = session?.user?.id
    ? await prisma.wishlistItem.findUnique({
        where: {
          userId_targetType_targetId: { userId: session.user.id, targetType: "perfume", targetId: id },
        },
      })
    : null;

  const bids = bidListing
    ? await prisma.bid.findMany({
        where: { perfumeId: id, kind: "bid" },
        include: { bidder: true, conversation: true },
        orderBy: { amountCents: "desc" },
      })
    : [];
  const openBids = bids.filter((b) => b.status === "open");
  const highest = openBids[0] ?? null;

  return (
    <article className="grid gap-8 md:grid-cols-2">
      <div className="card">
        {perfume.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={perfume.imageUrl} alt="" className="w-full object-cover" />
        ) : (
          <div className="flex h-80 items-center justify-center font-serif text-4xl">{perfume.name}</div>
        )}
      </div>
      <div className="space-y-4">
        <Notice message={notice} />
        <Link href={`/u/${perfume.owner.username}`} className="text-sm">
          ← @{perfume.owner.username} feed
        </Link>
        {perfume.collection ? (
          <p className="text-sm">
            In{" "}
            <Link href={`/u/${perfume.owner.username}/c/${perfume.collection.id}`}>{perfume.collection.name}</Link>
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl">{perfume.name}</h1>
          <SaleBadge saleType={perfume.saleType} />
          <StatusBadge status={perfume.status} />
        </div>
        <p className="text-2xl">
          {bidListing ? `Minimum bid ${formatMoney(amount)}` : formatMoney(amount)}
          {perfume.ml ? ` · ${perfume.ml} ml · ${formatPricePerMl(amount, perfume.ml)}` : ""}
        </p>
        {bidListing && highest && perfume.status === "published" ? (
          <p className="text-sm">Highest bid: {formatMoney(highest.amountCents)} from @{highest.bidder.username}</p>
        ) : null}
        {perfume.catalogRating != null ? (
          <p className="text-sm">Community rating {perfume.catalogRating.toFixed(1)} / 5</p>
        ) : null}
        {perfume.topNotes || perfume.middleNotes || perfume.baseNotes ? (
          <div className="grid gap-3 text-sm md:grid-cols-3">
            {perfume.topNotes ? (
              <div>
                <p className="text-muted">Top notes</p>
                <p>{perfume.topNotes}</p>
              </div>
            ) : null}
            {perfume.middleNotes ? (
              <div>
                <p className="text-muted">Middle notes</p>
                <p>{perfume.middleNotes}</p>
              </div>
            ) : null}
            {perfume.baseNotes ? (
              <div>
                <p className="text-muted">Base notes</p>
                <p>{perfume.baseNotes}</p>
              </div>
            ) : null}
          </div>
        ) : null}
        <ul className="text-sm text-muted">
          {perfume.kind ? <li>Type: {perfume.kind}{perfume.fill ? ` · ${perfume.fill}` : ""}</li> : null}
          {perfume.shippingIncluded != null ? (
            <li>Shipping {perfume.shippingIncluded ? "included" : "not included"}</li>
          ) : null}
        </ul>
        {perfume.description ? <p>{perfume.description}</p> : null}
        {links.length > 0 ? (
          <ul className="text-sm">
            {links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        {isOwner ? <p className="text-sm text-muted">Completion {completion.percent}%</p> : null}
        {!session?.user && perfume.status === "published" && !isOwner ? (
          <GuestAuthCta from={`/p/${id}`} action={bidListing ? "wishlist or bid" : "wishlist or buy"} />
        ) : null}
        {session?.user && !isOwner && perfume.status === "published" ? (
          <div className="space-y-3">
            <form action={wishlistForm}>
              <input type="hidden" name="targetType" value="perfume" />
              <input type="hidden" name="targetId" value={id} />
              <button className="btn btn-ghost" type="submit">
                {wish ? "Remove from wishlist" : "Wishlist perfume"}
              </button>
            </form>
            {bidListing ? (
              <form action={bidForm} className="flex flex-wrap gap-2">
                <input type="hidden" name="perfumeId" value={id} />
                <input
                  name="amount"
                  type="number"
                  min={amount / 100 + 0.01}
                  step="0.01"
                  placeholder={`More than ${formatMoney(amount)}`}
                  required
                />
                <button className="btn" type="submit">
                  Place bid
                </button>
              </form>
            ) : (
              <form action={buyForm}>
                <input type="hidden" name="perfumeId" value={id} />
                <button className="btn" type="submit">
                  Buy for {formatMoney(amount)}
                </button>
              </form>
            )}
          </div>
        ) : null}
        {isOwner && bidListing ? (
          <section className="space-y-3 rounded-2xl border border-line p-4">
            <h2 className="text-xl">Bids</h2>
            {openBids.length === 0 ? <p className="text-sm text-muted">No open bids yet.</p> : null}
            <ul className="space-y-3">
              {bids.map((b) => (
                <li key={b.id} className="space-y-2 border-b border-line/60 pb-3 last:border-0 last:pb-0">
                  <p>
                    @{b.bidder.username} · {formatMoney(b.amountCents)} · {b.status}
                  </p>
                  {b.status === "open" && perfume.status === "published" ? (
                    <div className="flex flex-wrap gap-2">
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
                    </div>
                  ) : null}
                  {b.conversation ? <Link href={`/me/messages/${b.conversation.id}`}>Open chat</Link> : null}
                </li>
              ))}
            </ul>
            <Link className="text-sm" href="/me/bids">
              All bids →
            </Link>
          </section>
        ) : null}
        {isOwner ? (
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-ghost" href={`/me/perfumes/${id}/edit`}>
              Edit
            </Link>
            {perfume.status === "published" ? (
              <form action={soldForm}>
                <input type="hidden" name="id" value={id} />
                <button className="btn" type="submit">
                  Mark sold
                </button>
              </form>
            ) : null}
            <form action={deletePerfumeForm}>
              <input type="hidden" name="id" value={id} />
              <button className="btn-ghost" type="submit">
                Delete
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </article>
  );
}
