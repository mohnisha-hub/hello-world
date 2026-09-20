import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CollectionCard, PerfumeCard } from "@/components/Cards";
import { fragranceByCatalogKey } from "@/lib/fragrance-catalog";
import { Notice } from "@/components/Notice";

export default async function WishlistPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/me/wishlist");
  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const collectionIds = items.filter((i) => i.targetType === "collection").map((i) => i.targetId);
  const perfumeIds = items.filter((i) => i.targetType === "perfume").map((i) => i.targetId);
  const catalogItems = items.filter((i) => i.targetType === "catalog").map((i) => fragranceByCatalogKey(i.targetId)).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const [collections, perfumes] = await Promise.all([
    prisma.collection.findMany({
      where: { id: { in: collectionIds }, status: { in: ["published", "sold"] } },
      include: { owner: true, perfumes: { select: { status: true } } },
    }),
    prisma.perfume.findMany({
      where: { id: { in: perfumeIds }, status: { in: ["published", "sold"] } },
      include: { owner: true },
    }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Wishlist</h1>
      <Notice message={notice} />
      {items.length === 0 ? <p className="text-muted">Save collections and perfumes from other profiles.</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {collections.map((c) => (
          <CollectionCard
            key={c.id}
            collection={c}
            perfumeCount={c.perfumes.filter((p) => p.status === "published" || p.status === "sold").length}
            href={`/u/${c.owner.username}/c/${c.id}`}
          />
        ))}
        {perfumes.map((p) => (
          <PerfumeCard key={p.id} perfume={p} href={`/p/${p.id}`} username={p.owner.username} />
        ))}
        {catalogItems.map((entry) => <div key={`${entry.brand}-${entry.name}`} className="card p-4"><p className="eyebrow">{entry.brand}</p><h2 className="mt-1 font-serif text-xl">{entry.name}</h2><p className="mt-2 text-sm text-muted">{[...entry.top, ...entry.middle, ...entry.base].slice(0, 5).join(" · ")}</p><Link className="mt-3 inline-block text-sm text-accent" href="/explore">Explore similar scents →</Link></div>)}
      </div>
      <p className="text-sm">
        <Link href="/">Browse community</Link>
      </p>
    </div>
  );
}
