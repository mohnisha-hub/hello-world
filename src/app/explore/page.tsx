import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PerfumeCard, CollectionCard } from "@/components/Cards";
import { SearchFilter } from "@/components/SearchFilter";
import { sellerRating } from "@/lib/listings";

export default async function ExplorePage() {
  const [perfumes, collections] = await Promise.all([
    prisma.perfume.findMany({
      where: { status: "published", owner: { profileStatus: "published" } },
      include: { owner: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.collection.findMany({
      where: { status: "published", owner: { profileStatus: "published" } },
      include: { owner: true, perfumes: { where: { status: "published" } } },
      orderBy: { publishedAt: "desc" },
    }),
  ]);
  const users = Array.from(new Map(perfumes.map((p) => [p.owner.id, p.owner])).values());
  const ratingRows = await Promise.all(users.map(async (user) => [user.id, await sellerRating(user.id)] as const));
  const ratingMap = Object.fromEntries(ratingRows);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-line pb-7">
        <div>
          <p className="eyebrow">Atelier marketplace</p>
          <h1 className="mt-2 text-5xl sm:text-6xl">Find your next scent.</h1>
          <p className="mt-3 max-w-xl text-muted">A considered marketplace for bottles, decants, collections, and the people who keep them.</p>
        </div>
        <Link className="btn" href="/me/create">List something</Link>
      </div>
      <SearchFilter perfumes={perfumes} collections={collections.map((c) => ({ ...c, perfumeCount: c.perfumes.length }))} allUsers={users} ratingMap={ratingMap} />
      {collections.length ? (
        <section>
          <div className="mb-4 flex items-baseline justify-between"><h2 className="section-heading">Collections</h2><span className="text-xs text-muted">Freshly published</span></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {collections.map((collection) => <CollectionCard key={collection.id} collection={collection} perfumeCount={collection.perfumes.length} href={`/u/${collection.owner.username}/c/${collection.id}`} />)}
          </div>
        </section>
      ) : null}
      <section>
        <div className="mb-4 flex items-baseline justify-between"><h2 className="section-heading">Latest listings</h2><span className="text-xs text-muted">Available now</span></div>
        {perfumes.length === 0 ? <p className="text-muted">No published listings yet.</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {perfumes.map((perfume) => <PerfumeCard key={perfume.id} perfume={perfume} href={`/p/${perfume.id}`} username={perfume.owner.username} />)}
        </div>
      </section>
    </div>
  );
}
