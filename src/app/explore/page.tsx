import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SearchFilter } from "@/components/SearchFilter";
import { sellerRating } from "@/lib/listings";
import { auth } from "@/auth";
import { PerfumeFinder } from "@/components/PerfumeFinder";

export default async function ExplorePage() {
  const [perfumes, collections, allUsers, session] = await Promise.all([
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
  ]);
  const marketplaceUsers = Array.from(new Map(perfumes.map((p) => [p.owner.id, p.owner])).values());
  const ratingRows = await Promise.all(marketplaceUsers.map(async (user) => [user.id, await sellerRating(user.id)] as const));
  const ratingMap = Object.fromEntries(ratingRows);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-line pb-7">
        <div>
          <p className="eyebrow">Atelier explore</p>
          <h1 className="mt-2 text-5xl sm:text-6xl">Find your next scent.</h1>
          <p className="mt-3 max-w-xl text-muted">Explore a local perfume catalogue for your collection, or browse live bottles, decants, and bids from collectors.</p>
        </div>
        <Link className="btn" href="/me/create">List something</Link>
      </div>
      <PerfumeFinder signedIn={Boolean(session?.user?.id)} liveListings={perfumes.map((perfume) => ({ brand: perfume.brand, name: perfume.name }))} />
      <div id="marketplace" className="border-t border-line pt-8">
        <p className="eyebrow">MARKETPLACE</p>
        <h2 className="mt-1 font-serif text-3xl sm:text-4xl">Live bottles and active bids.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Browse what collectors are ready to pass on, then narrow by house, note, type, size, price, or location.</p>
      </div>
      <SearchFilter perfumes={perfumes} collections={collections.map((c) => ({ ...c, perfumeCount: c.perfumes.length }))} allUsers={allUsers} ratingMap={ratingMap} />
    </div>
  );
}
