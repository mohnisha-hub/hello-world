import { prisma } from "@/lib/prisma";
export { requireUser } from "@/lib/acting";

export async function syncCollectionStatus(collectionId: string | null | undefined) {
  if (!collectionId) return;
  const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!collection || collection.status === "deleted") return;

  const perfumes = await prisma.perfume.findMany({
    where: { collectionId, NOT: { status: "deleted" } },
  });
  const published = perfumes.filter((p) => p.status === "published");
  const sold = perfumes.filter((p) => p.status === "sold");
  const drafts = perfumes.filter((p) => p.status === "draft");

  if (published.length >= 1) {
    if (collection.status === "sold") {
      await prisma.collection.update({
        where: { id: collectionId },
        data: { status: "published", publishedAt: collection.publishedAt ?? new Date() },
      });
    }
    return;
  }

  if (sold.length > 0 && drafts.length === 0 && sold.length === perfumes.length) {
    await prisma.collection.update({
      where: { id: collectionId },
      data: { status: "sold" },
    });
    return;
  }

  if (collection.status === "published" || collection.status === "sold") {
    await prisma.collection.update({
      where: { id: collectionId },
      data: { status: "draft" },
    });
  }
}

export async function sellerRating(userId: string) {
  const ratings = await prisma.rating.findMany({ where: { sellerId: userId } });
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((acc, r) => acc + (r.purchaseScore + r.deliveryScore) / 2, 0);
  return { average: sum / ratings.length, count: ratings.length };
}

export function sortKey(publishedAt: Date | null, createdAt: Date) {
  return (publishedAt ?? createdAt).getTime();
}

export function compareByPublish(a: Date | null, ac: Date, b: Date | null, bc: Date, dir: "asc" | "desc") {
  const av = sortKey(a, ac);
  const bv = sortKey(b, bc);
  return dir === "asc" ? av - bv : bv - av;
}
