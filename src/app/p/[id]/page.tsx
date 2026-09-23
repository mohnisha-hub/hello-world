import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isCommunityVisiblePerfume } from "@/lib/visibility";
import { formatMoney, formatPricePerMl } from "@/lib/money";
import { perfumeCompletion } from "@/lib/completion";
import { isBidListing, listingAmountCents } from "@/lib/sale";
import { StatusBadge } from "@/components/StatusBadge";
import { SaleBadge } from "@/components/SaleBadge";
import { Notice } from "@/components/Notice";
import { GuestAuthCta } from "@/components/GuestAuthCta";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { WishlistButton } from "@/components/WishlistButton";
import {
  acceptBidForm,
  bidForm,
  buyForm,
  declineBidForm,
  deletePerfumeForm,
  soldForm,
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
  const completion = perfumeCompletion(perfume);
  const amount = listingAmountCents(perfume);
  const bidListing = isBidListing(perfume.saleType);
  const shelfPerfume = perfume.listingIntent === "collection";
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
  const acceptedBid = bids.find((b) => b.status === "accepted") ?? null;
  const bidEnded = Boolean(perfume.bidEndsAt && perfume.bidEndsAt <= new Date());
  const marketplaceWhere = {
    id: { not: perfume.id },
    status: "published",
    listingIntent: "marketplace",
    ownerId: { not: perfume.ownerId },
    unitsAvailable: { gt: 0 },
    owner: { profileStatus: "published" },
  } as const;
  const marketplaceCandidates = await prisma.perfume.findMany({
    where: marketplaceWhere,
    include: { owner: { select: { username: true, location: true, ratingsReceived: { select: { purchaseScore: true, deliveryScore: true } } } } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  const sellerListings = marketplaceCandidates.filter((item) => samePerfume(item, perfume)).slice(0, 4);
  const perfumeNotes = noteSet(perfume);
  const similarListings = perfumeNotes.size === 0
    ? []
    : marketplaceCandidates
        .map((item) => ({ item, sharedNotes: sharedNotes(perfumeNotes, noteSet(item)) }))
        .filter(({ item, sharedNotes }) => sharedNotes.length > 0 && !samePerfume(item, perfume))
        .sort((a, b) => b.sharedNotes.length - a.sharedNotes.length)
        .slice(0, 4);

  return (
    <>
    <article className="grid gap-8 md:grid-cols-2">
      <div className="listing-hero-media card">
        {perfume.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={perfume.imageUrl} alt="" />
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
          <div><p className="eyebrow">{perfume.brand || "Perfume"}</p><h1 className="text-4xl">{perfume.name}</h1></div>
          {shelfPerfume ? <span className="badge">On collector&apos;s shelf</span> : <SaleBadge saleType={perfume.saleType} />}
          <StatusBadge status={perfume.status} />
        </div>
        {!shelfPerfume ? <p className="text-2xl">
          {bidListing ? `Minimum bid ${formatMoney(amount)}` : formatMoney(amount)}
          {perfume.ml ? ` · ${perfume.ml} ml · ${formatPricePerMl(amount, perfume.ml)}` : ""}
        </p> : <p className="text-sm text-muted">Part of @{perfume.owner.username}&apos;s public collection.</p>}
        {!shelfPerfume ? <p className="text-sm text-muted">{perfume.unitsAvailable} unit{perfume.unitsAvailable === 1 ? "" : "s"} available</p> : null}
        {bidListing ? <p className="text-sm">{highest ? `Current highest bid: ${formatMoney(highest.amountCents)}${isOwner ? ` from @${highest.bidder.username}` : ""}` : "No bids yet."} · {openBids.length} bid{openBids.length === 1 ? "" : "s"} received{perfume.bidEndsAt ? ` · ${bidEnded ? "Bidding ended" : `Ends ${perfume.bidEndsAt.toLocaleString()}`}` : ""}</p> : null}
        {perfume.catalogRating != null ? (
          <p className="text-sm">Community rating {perfume.catalogRating.toFixed(1)} / 5</p>
        ) : null}
        {perfume.sourcedFrom ? <p className="text-sm text-muted">Sourced from {perfume.sourcedFrom}</p> : null}
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
        {isOwner ? <p className="text-sm text-muted">Completion {completion.percent}%</p> : null}
        {!shelfPerfume && !session?.user && perfume.status === "published" && !isOwner ? (
          <GuestAuthCta from={`/p/${id}`} action={bidListing ? "wishlist or bid" : "wishlist or buy"} />
        ) : null}
        {session?.user && !isOwner && perfume.status === "published" && !shelfPerfume ? (
          <div className="space-y-3">
            <WishlistButton targetType="perfume" targetId={id} saved={Boolean(wish)} label="Wishlist perfume" />
            {bidListing && !bidEnded ? (
              <form action={bidForm} className="flex flex-wrap gap-2">
                <input type="hidden" name="perfumeId" value={id} />
                <input
                  name="amount"
                  type="number"
                  min={(highest?.amountCents ?? amount) / 100 + 0.01}
                  step="0.01"
                  placeholder={`More than ${formatMoney(highest?.amountCents ?? amount)}`}
                  required
                />
                <button className="btn" type="submit">
                  Place bid
                </button>
              </form>
            ) : bidListing ? <p className="text-sm text-muted">Bidding has ended. The winning bid is being confirmed.</p> : (
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
                  {b.status === "open" && perfume.status === "published" && !bidEnded ? (
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
                  {b.conversation ? <Link href={`/me/messages/${b.conversation.id}`}>{b.status === "accepted" ? "Open chat to mark sold" : "Open chat"}</Link> : null}
                </li>
              ))}
            </ul>
            <Link className="text-sm" href={`/me/bids?tab=received&perfume=${id}`}>
              All bids for this perfume →
            </Link>
          </section>
        ) : null}
        {isOwner ? (
          <div className="listing-owner-actions">
            <Link className="btn btn-ghost" href={`/me/perfumes/${id}/edit`}>
              Edit
            </Link>
            {perfume.status === "published" && !acceptedBid && !shelfPerfume ? (
              <form action={soldForm}>
                <input type="hidden" name="id" value={id} />
                <button className="btn" type="submit">
                  Mark sold
                </button>
              </form>
            ) : null}
            <form action={deletePerfumeForm}>
              <input type="hidden" name="id" value={id} />
              <ConfirmDeleteButton className="btn btn-danger-outline" confirmation="Remove this perfume from your public profile? It will be moved to Drafts & deleted, where you can restore it later.">Delete</ConfirmDeleteButton>
            </form>
          </div>
        ) : null}
      </div>
    </article>
    {sellerListings.length ? <section className="perfume-discovery-section">
      <div className="perfume-discovery-heading"><div><p className="eyebrow">MARKETPLACE</p><h2>Perfume from sellers</h2><p>Other active listings for this scent.</p></div><Link href={`/explore?q=${encodeURIComponent([perfume.brand, perfume.name].filter(Boolean).join(" "))}#marketplace`}>View all →</Link></div>
      <div className="perfume-discovery-grid">{sellerListings.map((item) => <SellerTile key={item.id} perfume={item} />)}</div>
    </section> : null}
    {similarListings.length ? <section className="perfume-discovery-section">
      <div className="perfume-discovery-heading"><div><p className="eyebrow">DISCOVER NEARBY SCENTS</p><h2>Similar perfumes from sellers</h2><p>Available listings with notes in common.</p></div><Link href="/explore#marketplace">Browse marketplace →</Link></div>
      <div className="perfume-discovery-grid">{similarListings.map(({ item, sharedNotes }) => <SellerTile key={item.id} perfume={item} sharedNotes={sharedNotes} />)}</div>
    </section> : null}
    </>
  );
}

type SellerTilePerfume = Awaited<ReturnType<typeof prisma.perfume.findMany>>[number] & { owner: { username: string; location: string | null; ratingsReceived: { purchaseScore: number; deliveryScore: number }[] } };

function SellerTile({ perfume, sharedNotes = [] }: { perfume: SellerTilePerfume; sharedNotes?: string[] }) {
  const amount = listingAmountCents(perfume);
  const ratings = perfume.owner.ratingsReceived;
  const rating = ratings.length ? ratings.reduce((sum, row) => sum + (row.purchaseScore + row.deliveryScore) / 2, 0) / ratings.length : null;
  return <Link href={`/p/${perfume.id}`} className="perfume-seller-tile">
    {perfume.imageUrl ? <img src={perfume.imageUrl} alt="" /> : <span className="perfume-seller-initials">{(perfume.brand || perfume.name).slice(0, 1)}</span>}
    <span className="perfume-seller-copy"><small>{perfume.brand || "Perfume"}</small><strong>{perfume.name}</strong><em>@{perfume.owner.username}{perfume.owner.location ? ` · ${perfume.owner.location}` : ""}</em>{sharedNotes.length ? <i>Shared: {sharedNotes.slice(0, 3).join(" · ")}</i> : null}</span>
    <span className="perfume-seller-price">{isBidListing(perfume.saleType) ? `From ${formatMoney(amount)}` : formatMoney(amount)}<small>{rating ? `${rating.toFixed(1)} ★` : "New seller"}</small></span>
  </Link>;
}

function normal(value: string | null | undefined) { return (value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""); }
function samePerfume(a: { name: string; brand: string | null }, b: { name: string; brand: string | null }) { return normal(a.name) === normal(b.name) && (!a.brand || !b.brand || normal(a.brand) === normal(b.brand)); }
function noteSet(perfume: { topNotes: string | null; middleNotes: string | null; baseNotes: string | null }) { return new Set([perfume.topNotes, perfume.middleNotes, perfume.baseNotes].flatMap((notes) => (notes || "").split(",")).map((note) => note.trim().toLowerCase()).filter(Boolean)); }
function sharedNotes(base: Set<string>, other: Set<string>) { return [...base].filter((note) => other.has(note)); }
