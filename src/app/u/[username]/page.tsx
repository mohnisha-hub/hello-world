import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPublicProfile } from "@/lib/visibility";
import { CollectionCard, PerfumeCard } from "@/components/Cards";
import { sellerRating } from "@/lib/listings";
import { StatusBadge } from "@/components/StatusBadge";
import { bidForm, deletePerfumeForm, pinForm, soldForm } from "@/actions/form-wrappers";
import { isBidListing, listingAmountCents } from "@/lib/sale";
import { formatMoney } from "@/lib/money";

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      pins: true,
      wishlist: true,
      collections: { include: { perfumes: true } },
      perfumes: true,
    },
  });
  if (!user) notFound();
  const isOwner = session?.user?.id === user.id;
  if (!isPublicProfile(user.profileStatus) && !isOwner) notFound();

  const liveCollections = user.collections.filter((c) => c.status === "published" || c.status === "sold");
  const pinIds = new Set(user.pins.map((p) => p.targetId));
  const rating = await sellerRating(user.id);
  const wishlistPerfumeIds = user.wishlist.filter((item) => item.targetType === "perfume").map((item) => item.targetId);
  const wishlistCollectionIds = user.wishlist.filter((item) => item.targetType === "collection").map((item) => item.targetId);
  const [publicWishlistPerfumes, publicWishlistCollections] = await Promise.all([
    prisma.perfume.findMany({
      where: { id: { in: wishlistPerfumeIds }, status: "published", owner: { profileStatus: "published" } },
      include: { owner: true },
    }),
    prisma.collection.findMany({
      where: { id: { in: wishlistCollectionIds }, status: "published", owner: { profileStatus: "published" } },
      include: { owner: true, perfumes: { where: { status: "published" } } },
    }),
  ]);
  const acceptedBidRows = await prisma.bid.findMany({
    where: { sellerId: user.id, kind: "bid", status: "accepted" },
    select: { perfumeId: true, id: true },
  });
  const acceptedBidByPerfume = new Map(acceptedBidRows.map((bid) => [bid.perfumeId, bid.id]));
  const openBidListings = user.perfumes.filter((perfume) => perfume.status === "published" && isBidListing(perfume.saleType) && !acceptedBidByPerfume.has(perfume.id));
  const acceptedBidListings = user.perfumes.filter((perfume) => perfume.status === "published" && acceptedBidByPerfume.has(perfume.id));
  const availablePerfumes = user.perfumes.filter((perfume) => perfume.status === "published" && !isBidListing(perfume.saleType));
  const soldPerfumes = user.perfumes.filter((perfume) => perfume.status === "sold");
  const bidHighs = openBidListings.length
    ? await prisma.bid.groupBy({
        by: ["perfumeId"],
        where: { perfumeId: { in: openBidListings.map((perfume) => perfume.id) }, kind: "bid", status: "open" },
        _max: { amountCents: true },
      })
    : [];
  const bidHighByPerfume = Object.fromEntries(bidHighs.map((bid) => [bid.perfumeId, bid._max.amountCents]));
  const availableListings = user.perfumes.filter((perfume) => perfume.status === "published");

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-2xl border border-line bg-paper">
        <div className="h-20 bg-[linear-gradient(115deg,color-mix(in_srgb,var(--accent)_48%,transparent),transparent_58%)]" />
        <div className="flex flex-wrap items-end justify-between gap-5 px-5 pb-5 sm:px-7 sm:pb-7">
          <div className="-mt-9 flex items-end gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.photoUrl || `https://api.dicebear.com/9.x/lorelei/svg?seed=${user.username}`}
          alt=""
          className="h-20 w-20 rounded-full border-4 border-paper object-cover sm:h-24 sm:w-24"
        />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl">@{user.username}</h1>
            {isOwner ? <StatusBadge status={user.profileStatus} /> : null}
          </div>
          <p className="mt-1 text-sm text-muted">{user.location || "Somewhere scented"}</p>
          {rating ? (
            <p className="text-sm">
              {rating.average.toFixed(1)} / 10 · {rating.count} rating{rating.count === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOwner ? <Link className="btn btn-ghost" href="/me/profile">Edit profile</Link> : null}
            {!isOwner ? <Link className="btn btn-ghost" href="/explore">Explore scents</Link> : null}
          </div>
        </div>
        <div className="grid gap-4 border-t border-line px-5 py-4 text-center sm:grid-cols-3 sm:px-7">
          <div><p className="font-serif text-2xl">{liveCollections.length}</p><p className="text-xs uppercase tracking-wider text-muted">Collections</p></div>
          <div><p className="font-serif text-2xl">{availableListings.length}</p><p className="text-xs uppercase tracking-wider text-muted">Available listings</p></div>
          <div><p className="font-serif text-2xl">{publicWishlistCollections.length + publicWishlistPerfumes.length}</p><p className="text-xs uppercase tracking-wider text-muted">Wishlist</p></div>
        </div>
        {user.bio ? <p className="border-t border-line px-5 py-4 text-sm leading-6 sm:px-7">{user.bio}</p> : null}
      </section>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <main className="space-y-10">
          <ProfileSection title="Collections" detail={`Curated by @${user.username}`} tools={isOwner ? <SectionTools addHref="/me/collections/new" editHref="/me/collections" addLabel="Add collection" editLabel="Edit collections" /> : null}>
            {liveCollections.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {liveCollections.map((collection) => (
                  <div key={collection.id}>
                    <CollectionCard collection={collection} perfumeCount={collection.perfumes.filter((perfume) => perfume.status === "published").length} href={`/u/${user.username}/c/${collection.id}`} />
                    {isOwner ? <OwnerActions targetType="collection" targetId={collection.id} pinned={pinIds.has(collection.id)} editHref={`/me/collections/${collection.id}`} /> : null}
                  </div>
                ))}
              </div>
            ) : <EmptyState text="No published collections yet." />}
          </ProfileSection>

          <ProfileSection title="Available perfumes" detail="Ready to buy" tools={isOwner ? <SectionTools addHref="/me/perfumes/new" editHref="/me/perfumes" addLabel="Add perfume" editLabel="Edit perfumes" /> : null}>
            {availablePerfumes.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {availablePerfumes.map((perfume) => (
                  <div key={perfume.id}>
                    <PerfumeCard perfume={perfume} href={`/p/${perfume.id}`} showStatus={isOwner} />
                    {isOwner ? <OwnerActions targetType="perfume" targetId={perfume.id} pinned={pinIds.has(perfume.id)} editHref={`/me/perfumes/${perfume.id}/edit`} canSell /> : null}
                  </div>
                ))}
              </div>
            ) : <EmptyState text="No buy-now perfumes at the moment." />}
          </ProfileSection>

          <ProfileSection title="Open bids" detail={isOwner ? "Offers on your perfumes" : "Make an offer"}>
            {openBidListings.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {openBidListings.map((perfume) => {
                  const minimum = listingAmountCents(perfume);
                  const highest = bidHighByPerfume[perfume.id] ?? null;
                  return (
                    <div key={perfume.id} className="space-y-2">
                      <PerfumeCard perfume={perfume} href={`/p/${perfume.id}`} showStatus={isOwner} />
                      <div className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm">
                        <p className="text-muted">{highest ? `Current high ${formatMoney(highest)}` : `Minimum bid ${formatMoney(minimum)}`}</p>
                        {!isOwner && session?.user ? (
                          <form action={bidForm} className="mt-2 flex gap-2">
                            <input type="hidden" name="perfumeId" value={perfume.id} />
                            <input className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm" name="amount" type="number" min={(highest ?? minimum) / 100 + 0.01} step="0.01" placeholder="Your INR bid" required />
                            <button className="btn btn-compact" type="submit">Bid</button>
                          </form>
                        ) : null}
                      </div>
                      {isOwner ? <OwnerActions targetType="perfume" targetId={perfume.id} pinned={pinIds.has(perfume.id)} editHref={`/me/perfumes/${perfume.id}/edit`} canSell /> : null}
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState text="No active bid listings right now." />}
          </ProfileSection>

          {isOwner && acceptedBidListings.length ? (
            <ProfileSection title="Accepted deals" detail="Ready to close">
              <div className="grid gap-3 sm:grid-cols-2">{acceptedBidListings.map((perfume) => <PerfumeCard key={perfume.id} perfume={perfume} href={`/p/${perfume.id}`} showStatus />)}</div>
            </ProfileSection>
          ) : null}

          {isOwner && soldPerfumes.length ? (
            <details className="rounded-xl border border-line bg-paper p-4">
              <summary className="cursor-pointer text-sm text-muted">Sold listings ({soldPerfumes.length})</summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">{soldPerfumes.map((perfume) => <PerfumeCard key={perfume.id} perfume={perfume} href={`/p/${perfume.id}`} showStatus />)}</div>
            </details>
          ) : null}
        </main>

        <aside className="lg:sticky lg:top-20">
          <section className="rounded-2xl border border-line bg-paper p-4">
            <div className="mb-3"><p className="eyebrow">Saved finds</p><h2 className="mt-1 font-serif text-xl">{isOwner ? "My wishlist" : `@${user.username}'s wishlist`}</h2></div>
            <div className="space-y-2">
              {publicWishlistCollections.map((collection) => <WishlistMiniCard key={collection.id} href={`/u/${collection.owner.username}/c/${collection.id}`} title={collection.name} meta={`${collection.perfumes.length} perfumes`} />)}
              {publicWishlistPerfumes.map((perfume) => <WishlistMiniCard key={perfume.id} href={`/p/${perfume.id}`} title={perfume.name} meta={`@${perfume.owner.username}`} />)}
              {publicWishlistCollections.length + publicWishlistPerfumes.length === 0 ? <p className="text-sm leading-6 text-muted">No saved finds to show yet.</p> : null}
            </div>
            {isOwner ? <Link className="mt-4 inline-block text-sm text-muted hover:text-ink" href="/me/wishlist">Open wishlist →</Link> : null}
          </section>
        </aside>
      </div>
    </div>
  );
}

function ProfileSection({ title, detail, tools, children }: { title: string; detail: string; tools?: React.ReactNode; children: React.ReactNode }) {
  return <section><div className="mb-4 flex items-baseline justify-between gap-4"><h2 className="section-heading">{title}</h2><div className="flex items-center gap-2"><p className="text-right text-xs text-muted">{detail}</p>{tools}</div></div>{children}</section>;
}

function SectionTools({ addHref, editHref, addLabel, editLabel }: { addHref: string; editHref: string; addLabel: string; editLabel: string }) {
  return <div className="flex gap-1"><Link className="section-tool" href={addHref} aria-label={addLabel} title={addLabel}>+</Link><Link className="section-tool" href={editHref} aria-label={editLabel} title={editLabel}>✎</Link></div>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-line px-4 py-5 text-sm text-muted">{text}</p>;
}

function WishlistMiniCard({ href, title, meta }: { href: string; title: string; meta: string }) {
  return <Link href={href} className="block rounded-lg border border-line px-3 py-2.5 transition-colors hover:border-line-strong hover:bg-bg"><p className="line-clamp-1 text-sm font-medium">{title}</p><p className="mt-0.5 text-xs text-muted">{meta}</p></Link>;
}

function OwnerActions({ targetType, targetId, pinned, editHref, canSell }: { targetType: "collection" | "perfume"; targetId: string; pinned: boolean; editHref: string; canSell?: boolean }) {
  return <div className="flex flex-wrap gap-2 px-1 pt-2 text-xs"><Link className="card-action" href={editHref}>Edit</Link><form action={pinForm}><input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetId" value={targetId} /><button className="card-action" type="submit">{pinned ? "Unpin" : "Pin"}</button></form>{canSell ? <><form action={soldForm}><input type="hidden" name="id" value={targetId} /><button className="card-action" type="submit">Mark sold</button></form><form action={deletePerfumeForm}><input type="hidden" name="id" value={targetId} /><button className="card-action" type="submit">Delete</button></form></> : null}</div>;
}
