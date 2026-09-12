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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Atelier marketplace</p>
          <h1 className="mt-2 text-4xl">Explore the vault</h1>
          <p className="mt-2 text-muted">Live collections and listings from published Atelier members.</p>
        </div>
        <Link className="btn" href="/me/create">Create a listing</Link>
      </div>
      <SearchFilter perfumes={perfumes} collections={collections.map((c) => ({ ...c, perfumeCount: c.perfumes.length }))} allUsers={users} ratingMap={ratingMap} />
      {collections.length ? (
        <section>
          <h2 className="mb-3 text-2xl">Live collections</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {collections.map((collection) => <CollectionCard key={collection.id} collection={collection} perfumeCount={collection.perfumes.length} href={`/u/${collection.owner.username}/c/${collection.id}`} />)}
          </div>
        </section>
      ) : null}
      <section>
        <h2 className="mb-3 text-2xl">Latest listings</h2>
        {perfumes.length === 0 ? <p className="text-muted">No published listings yet.</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {perfumes.map((perfume) => <PerfumeCard key={perfume.id} perfume={perfume} href={`/p/${perfume.id}`} username={perfume.owner.username} />)}
        </div>
      </section>
    </div>
  );
}
