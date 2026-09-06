import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CollectionCard, PerfumeCard } from "@/components/Cards";

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/me/wishlist");
  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const collectionIds = items.filter((i) => i.targetType === "collection").map((i) => i.targetId);
  const perfumeIds = items.filter((i) => i.targetType === "perfume").map((i) => i.targetId);
  const [collections, perfumes] = await Promise.all([
    prisma.collection.findMany({
      where: { id: { in: collectionIds }, status: { in: ["published", "sold"] } },
      include: { owner: true, perfumes: true },
    }),
    prisma.perfume.findMany({
      where: { id: { in: perfumeIds }, status: { in: ["published", "sold"] } },
      include: { owner: true },
    }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Wishlist</h1>
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
      </div>
      <p className="text-sm">
        <Link href="/">Browse community</Link>
      </p>
    </div>
  );
}
