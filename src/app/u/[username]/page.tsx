import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPublicProfile } from "@/lib/visibility";
import { buildFeed } from "@/lib/feed";
import { FeedSections } from "@/components/FeedSections";
import { CollectionCard, PerfumeCard } from "@/components/Cards";
import { sellerRating } from "@/lib/listings";
import { StatusBadge } from "@/components/StatusBadge";
import { wishlistForm } from "@/actions/form-wrappers";
import { bidForm } from "@/actions/form-wrappers";
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

  const dir = user.feedSort === "publishedAtAsc" ? "asc" : "desc";
  const liveCollections = user.collections.filter((c) => c.status === "published" || c.status === "sold");
  const standalone = user.perfumes.filter(
    (p) => !p.collectionId && (p.status === "published" || p.status === "sold"),
  );
  const pinIds = new Set(user.pins.map((p) => p.targetId));
  const rating = await sellerRating(user.id);
  const pinnedCollections = liveCollections.filter((c) => pinIds.has(c.id));
  const pinnedPerfumes = standalone.filter((p) => pinIds.has(p.id));
  const feedCollections = liveCollections.filter((c) => !pinIds.has(c.id));
  const feedStandalone = standalone.filter((p) => !pinIds.has(p.id));
  const { live, sold } = buildFeed(feedCollections, feedStandalone, dir);
  const wishlisted = session?.user?.id
    ? await prisma.wishlistItem.findMany({ where: { userId: session.user.id } })
    : [];
  const wishSet = new Set(wishlisted.map((w) => `${w.targetType}:${w.targetId}`));
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
  const openBidListings = standalone.filter((perfume) => perfume.status === "published" && isBidListing(perfume.saleType));
  const availableListings = user.perfumes.filter((perfume) => perfume.status === "published");

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-line bg-paper">
        <div className="h-24 bg-gradient-to-r from-accent/40 via-paper to-line" />
        <div className="flex flex-wrap items-end justify-between gap-5 px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.photoUrl || `https://api.dicebear.com/9.x/lorelei/svg?seed=${user.username}`}
          alt=""
          className="h-24 w-24 rounded-full border-4 border-paper object-cover"
        />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl">@{user.username}</h1>
            {isOwner ? <StatusBadge status={user.profileStatus} /> : null}
          </div>
          <p className="mt-1 text-sm text-muted">{user.location || "Somewhere scented"} · Collector storefront</p>
          {rating ? (
            <p className="text-sm">
              {rating.average.toFixed(1)} / 10 · {rating.count} rating{rating.count === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOwner ? <Link className="btn btn-ghost" href="/me/profile">Edit profile</Link> : null}
            {isOwner ? <Link className="btn" href="/me/create">Add to collection</Link> : null}
            {!isOwner ? <Link className="btn btn-ghost" href="/explore">Explore scents</Link> : null}
          </div>
        </div>
        <div className="grid gap-4 border-t border-line px-6 py-4 text-center sm:grid-cols-3">
          <div><p className="font-serif text-2xl">{liveCollections.length}</p><p className="text-xs uppercase tracking-wider text-muted">Collections</p></div>
          <div><p className="font-serif text-2xl">{availableListings.length}</p><p className="text-xs uppercase tracking-wider text-muted">Available listings</p></div>
          <div><p className="font-serif text-2xl">{publicWishlistCollections.length + publicWishlistPerfumes.length}</p><p className="text-xs uppercase tracking-wider text-muted">Wishlist</p></div>
        </div>
        {user.bio ? <p className="border-t border-line px-6 py-4 text-sm leading-6">{user.bio}</p> : null}
      </section>
      {pinnedCollections.length + pinnedPerfumes.length > 0 ? (
        <section>
          <h2 className="mb-3 text-2xl">Pinned</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {pinnedCollections.map((c) => (
              <div key={c.id}>
                <CollectionCard
                  collection={c}
                  perfumeCount={c.perfumes.filter((p) => p.status === "published" || p.status === "sold").length}
                  href={`/u/${user.username}/c/${c.id}`}
                />
                {!isOwner && session?.user ? (
                  <form action={wishlistForm} className="p-2">
                    <input type="hidden" name="targetType" value="collection" />
                    <input type="hidden" name="targetId" value={c.id} />
                    <button className="btn-ghost text-sm" type="submit">
                      {wishSet.has(`collection:${c.id}`) ? "Remove from wishlist" : "Wishlist collection"}
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
            {pinnedPerfumes.map((p) => (
              <PerfumeCard key={p.id} perfume={p} href={`/p/${p.id}`} />
            ))}
          </div>
        </section>
      ) : null}
      {liveCollections.length > 0 ? (
        <section>
          <div className="mb-3 flex items-baseline justify-between"><h2 className="text-2xl">Collection cabinets</h2><p className="text-sm text-muted">Curated sets from @{user.username}</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {liveCollections.map((collection) => <CollectionCard key={collection.id} collection={collection} perfumeCount={collection.perfumes.filter((perfume) => perfume.status === "published").length} href={`/u/${user.username}/c/${collection.id}`} />)}
          </div>
        </section>
      ) : null}
      {!isOwner && session?.user && openBidListings.length > 0 ? (
        <section>
          <h2 className="mb-1 text-2xl">Open bids</h2>
          <p className="mb-3 text-sm text-muted">Place an offer directly, or open a listing to review its details first.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {openBidListings.map((perfume) => {
              const minimum = listingAmountCents(perfume);
              return (
                <div key={perfume.id} className="card space-y-3 p-4">
                  <Link href={`/p/${perfume.id}`} className="font-serif text-xl">{perfume.name}</Link>
                  <p className="text-sm text-muted">Minimum bid {formatMoney(minimum)}</p>
                  <form action={bidForm} className="flex flex-wrap gap-2">
                    <input type="hidden" name="perfumeId" value={perfume.id} />
                    <input name="amount" type="number" min={minimum / 100 + 0.01} step="0.01" placeholder="Your INR bid" required />
                    <button className="btn" type="submit">Place bid</button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
      {publicWishlistCollections.length + publicWishlistPerfumes.length > 0 ? (
        <section>
          <h2 className="mb-1 text-2xl">{isOwner ? "My wishlist" : `@${user.username}'s wishlist`}</h2>
          <p className="mb-3 text-sm text-muted">Saved public finds from the Atelier community.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {publicWishlistCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} perfumeCount={collection.perfumes.length} href={`/u/${collection.owner.username}/c/${collection.id}`} />
            ))}
            {publicWishlistPerfumes.map((perfume) => (
              <PerfumeCard key={perfume.id} perfume={perfume} href={`/p/${perfume.id}`} username={perfume.owner.username} />
            ))}
          </div>
        </section>
      ) : null}
      <FeedSections live={live} sold={isOwner ? sold : []} username={user.username} owner={isOwner} pinIds={pinIds} />
    </div>
  );
}
