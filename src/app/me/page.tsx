import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { buildFeed } from "@/lib/feed";
import { FeedSections } from "@/components/FeedSections";
import { CollectionCard, PerfumeCard } from "@/components/Cards";
import { sellerRating } from "@/lib/listings";
import { StatusBadge } from "@/components/StatusBadge";
import { getActingUser } from "@/lib/acting";

export default async function MePage() {
  const acting = await getActingUser();
  if (!acting?.id) redirect("/login?from=/me");
  const user = await prisma.user.findUnique({
    where: { id: acting.id },
    include: {
      pins: true,
      collections: { include: { perfumes: true } },
      perfumes: true,
    },
  });
  if (!user) redirect("/");

  const dir = user.feedSort === "publishedAtAsc" ? "asc" : "desc";
  const liveCollections = user.collections.filter((c) => c.status === "published" || c.status === "sold");
  const draftCollections = user.collections.filter((c) => c.status === "draft");
  const standalone = user.perfumes.filter(
    (p) => !p.collectionId && (p.status === "published" || p.status === "sold"),
  );
  const draftStandalone = user.perfumes.filter((p) => !p.collectionId && p.status === "draft");
  const { live, sold } = buildFeed(liveCollections, standalone, dir);
  const pinIds = new Set(user.pins.map((p) => p.targetId));
  const rating = await sellerRating(user.id);

  const pinnedCollections = user.collections.filter((c) => pinIds.has(c.id));
  const pinnedPerfumes = user.perfumes.filter((p) => pinIds.has(p.id));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl">@{user.username} feed</h1>
            <StatusBadge status={user.profileStatus} />
          </div>
          <p className="text-muted">
            @{user.username}
            {rating ? ` · ${rating.average.toFixed(1)}/10 (${rating.count})` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link className="btn btn-ghost" href="/me/collections/new">
            Add collection
          </Link>
          <Link className="btn" href="/me/perfumes/new">
            Add perfume
          </Link>
        </div>
      </div>
      {draftCollections.length + draftStandalone.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl">Drafts</h2>
            <Link className="text-sm text-muted" href="/me/drafts">
              All drafts →
            </Link>
          </div>
          <p className="mb-3 text-sm text-muted">Only you can see these until you publish them.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {draftCollections.map((c) => (
              <CollectionCard
                key={c.id}
                collection={c}
                perfumeCount={c.perfumes.filter((p) => p.status !== "deleted").length}
                href={`/me/collections/${c.id}`}
                showStatus
              />
            ))}
            {draftStandalone.map((p) => (
              <PerfumeCard key={p.id} perfume={p} href={`/me/perfumes/${p.id}/edit`} showStatus />
            ))}
          </div>
        </section>
      ) : null}
      {pinnedCollections.length + pinnedPerfumes.length > 0 ? (
        <section>
          <h2 className="mb-3 text-2xl">Pinned</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {pinnedCollections.map((c) => (
              <CollectionCard
                key={c.id}
                collection={c}
                perfumeCount={c.perfumes.filter((p) => p.status === "published" || p.status === "sold").length}
                href={`/u/${user.username}/c/${c.id}`}
                showStatus
              />
            ))}
            {pinnedPerfumes.map((p) => (
              <PerfumeCard key={p.id} perfume={p} href={`/p/${p.id}`} showStatus />
            ))}
          </div>
        </section>
      ) : null}
      <FeedSections
        live={live}
        sold={sold}
        username={user.username}
        owner
        pinIds={pinIds}
        showSort
        feedSort={user.feedSort}
      />
    </div>
  );
}
