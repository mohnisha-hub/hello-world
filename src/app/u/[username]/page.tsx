import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPublicProfile } from "@/lib/visibility";
import { buildFeed } from "@/lib/feed";
import { FeedSections } from "@/components/FeedSections";
import { CollectionCard, PerfumeCard } from "@/components/Cards";
import { sellerRating } from "@/lib/listings";
import { StatusBadge } from "@/components/StatusBadge";
import { wishlistForm } from "@/actions/form-wrappers";

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      pins: true,
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

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.photoUrl || `https://api.dicebear.com/9.x/lorelei/svg?seed=${user.username}`}
          alt=""
          className="h-20 w-20 rounded-full object-cover"
        />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl">@{user.username}</h1>
            {isOwner ? <StatusBadge status={user.profileStatus} /> : null}
          </div>
          {user.bio ? <p className="max-w-xl">{user.bio}</p> : null}
          <p className="text-sm text-muted">
            {user.location || "Somewhere scented"}
          </p>
          {rating ? (
            <p>
              {rating.average.toFixed(1)} / 10 · {rating.count} rating{rating.count === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      </div>
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
      <FeedSections live={live} sold={sold} username={user.username} owner={isOwner} pinIds={pinIds} />
    </div>
  );
}
