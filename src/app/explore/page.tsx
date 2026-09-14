import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SearchFilter } from "@/components/SearchFilter";
import { sellerRating } from "@/lib/listings";
import { auth } from "@/auth";
import { PerfumeFinder } from "@/components/PerfumeFinder";
import { ActivityFeed } from "@/components/ActivityFeed";
import { getPublicActivity } from "@/lib/public-activity";

export default async function ExplorePage() {
  const [perfumes, collections, allUsers, session, activities] = await Promise.all([
    prisma.perfume.findMany({
      where: {
        status: "published",
        listingIntent: "marketplace",
        owner: { profileStatus: "published" },
        OR: [{ collectionId: null }, { collection: { status: { in: ["published", "sold"] } } }],
      },
      include: { owner: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.collection.findMany({
      where: { status: "published", owner: { profileStatus: "published" } },
      include: { owner: true, perfumes: { where: { status: "published" } } },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.user.findMany({
      where: { profileStatus: "published" },
      select: { id: true, username: true, photoUrl: true, location: true, bio: true, profileStatus: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    auth(),
    getPublicActivity(6),
  ]);
  const marketplaceUsers = Array.from(new Map(perfumes.map((p) => [p.owner.id, p.owner])).values());
  const ratingRows = await Promise.all(marketplaceUsers.map(async (user) => [user.id, await sellerRating(user.id)] as const));
  const ratingMap = Object.fromEntries(ratingRows);

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
        <SearchFilter perfumes={perfumes} collections={collections.map((c) => ({ ...c, perfumeCount: c.perfumes.length }))} allUsers={allUsers} ratingMap={ratingMap} />
      </section>
      <section id="activity" className="explore-zone explore-priority-section explore-activity-section">
        <div className="explore-zone-heading"><div><p className="eyebrow">THE COMMUNITY</p><h2>Activity</h2><p>See the latest shelves, favourites, wishlists, and listings from people in Atelier.</p></div></div>
        <ActivityFeed activities={activities} mode="explore" />
      </section>
      <div id="perfume-explorer"><PerfumeFinder signedIn={Boolean(session?.user?.id)} liveListings={perfumes.map((perfume) => ({ brand: perfume.brand, name: perfume.name }))} /></div>
    </div>
  );
}
