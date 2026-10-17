import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { SearchFilter } from "@/components/SearchFilter";
import { auth } from "@/auth";
import { DeferredPerfumeFinder } from "@/components/DeferredPerfumeFinder";
import { ActivityFeed } from "@/components/ActivityFeed";
import { getPublicActivity } from "@/lib/public-activity";

const publicOwner = { select: { id: true, username: true, photoUrl: true, location: true, bio: true, profileStatus: true } } as const;

async function ExploreActivity() {
  const activities = await getPublicActivity(6);
  return <ActivityFeed activities={activities} mode="explore" />;
}

export default async function ExplorePage() {
  const [perfumes, collections, allUsers, session] = await Promise.all([
    prisma.perfume.findMany({
      where: {
        status: "published",
        listingIntent: "marketplace",
        owner: { profileStatus: "published" },
        OR: [{ collectionId: null }, { collection: { status: { in: ["published", "sold"] } } }],
      },
      select: { id: true, brand: true, name: true, saleType: true, minBidCents: true, priceCents: true, ml: true, kind: true, fill: true, imageUrl: true, description: true, topNotes: true, middleNotes: true, baseNotes: true, status: true, owner: publicOwner },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.collection.findMany({
      where: { status: "published", owner: { profileStatus: "published" } },
      select: { id: true, name: true, photoUrl: true, status: true, owner: publicOwner, _count: { select: { perfumes: { where: { status: "published" } } } } },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.user.findMany({
      where: { profileStatus: "published" },
      select: { id: true, username: true, photoUrl: true, location: true, bio: true, profileStatus: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    auth(),
  ]);
  const marketplaceUsers = Array.from(new Map(perfumes.map((p) => [p.owner.id, p.owner])).values());
  const ratings = marketplaceUsers.length ? await prisma.rating.groupBy({ by: ["sellerId"], where: { sellerId: { in: marketplaceUsers.map((user) => user.id) } }, _avg: { purchaseScore: true, deliveryScore: true }, _count: { _all: true } }) : [];
  const ratingMap = Object.fromEntries(ratings.map((rating) => [rating.sellerId, { average: ((rating._avg.purchaseScore ?? 0) + (rating._avg.deliveryScore ?? 0)) / 2, count: rating._count._all }]));

  return (
    <div className="explore-page">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-line pb-7">
        <div>
          <p className="eyebrow">Atelier explore</p>
          <h1 className="mt-2 text-5xl sm:text-6xl">Find your next scent.</h1>
          <p className="mt-3 max-w-xl text-muted">Explore a local perfume catalogue for your collection, or browse live bottles, decants, and bids from collectors.</p>
        </div>
        <Link className="btn" href="/me/create">List something</Link>
      </div>
      <nav className="explore-jump-nav" aria-label="Explore sections">
        <a href="#marketplace"><span>01</span>Marketplace</a>
        <a href="#activity"><span>02</span>Community activity</a>
        <a href="#perfume-explorer"><span>03</span>Perfume explorer</a>
      </nav>
      <section id="marketplace" className="explore-zone explore-marketplace">
        <div className="explore-zone-heading">
          <div>
            <p className="eyebrow">BUY · BID · DISCOVER</p>
            <h2>Marketplace</h2>
            <p>Browse live bottles, decants, and active bids from collectors. Filter by house, note, type, size, price, or location.</p>
          </div>
        </div>
        <SearchFilter perfumes={perfumes} collections={collections.map(({ _count, ...collection }) => ({ ...collection, perfumeCount: _count.perfumes }))} allUsers={allUsers} ratingMap={ratingMap} />
      </section>
      <section id="activity" className="explore-zone explore-priority-section explore-activity-section">
        <div className="explore-zone-heading"><div><p className="eyebrow">THE COMMUNITY</p><h2>Activity</h2><p>See the latest shelves, favourites, wishlists, and listings from people in Atelier.</p></div></div>
        <Suspense fallback={<div className="activity-explorer-feed activity-explorer-loading" aria-hidden="true" />}><ExploreActivity /></Suspense>
      </section>
      <DeferredPerfumeFinder signedIn={Boolean(session?.user?.id)} liveListings={perfumes.map((perfume) => ({ brand: perfume.brand, name: perfume.name }))} />
    </div>
  );
}
