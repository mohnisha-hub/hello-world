import { prisma } from "@/lib/prisma";
import { sellerRating } from "@/lib/listings";
import { SearchFilter } from "@/components/SearchFilter";
import type { SearchableCollection, SearchablePerfume } from "@/lib/search";

export default async function HomePage() {
  let publicUsers: SearchablePerfume["owner"][] = [];
  let publicPerfumes: SearchablePerfume[] = [];
  let publicCollections: SearchableCollection[] = [];
  const ratingMap: Record<string, { average: number; count: number } | null> = {};

  try {
    const [users, perfumes, collections] = await Promise.all([
      prisma.user.findMany({
        where: { profileStatus: "published" },
        orderBy: { username: "asc" },
        select: {
          id: true,
          username: true,
          photoUrl: true,
          location: true,
          bio: true,
          profileStatus: true,
        },
      }),
      prisma.perfume.findMany({
        where: {
          status: "published",
          owner: { profileStatus: "published" },
          OR: [{ collectionId: null }, { collection: { status: { in: ["published", "sold"] } } }],
        },
        select: {
          id: true,
          name: true,
          priceCents: true,
          saleType: true,
          minBidCents: true,
          ml: true,
          kind: true,
          fill: true,
          imageUrl: true,
          description: true,
          topNotes: true,
          middleNotes: true,
          baseNotes: true,
          status: true,
          collection: { select: { name: true, status: true } },
          owner: {
            select: {
              id: true,
              username: true,
              photoUrl: true,
              location: true,
              bio: true,
              profileStatus: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.collection.findMany({
        where: {
          status: "published",
          owner: { profileStatus: "published" },
        },
        select: {
          id: true,
          name: true,
          photoUrl: true,
          status: true,
          owner: {
            select: {
              id: true,
              username: true,
              photoUrl: true,
              location: true,
              bio: true,
              profileStatus: true,
            },
          },
          perfumes: { where: { status: { in: ["published", "sold"] } }, select: { id: true } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    publicUsers = users;
    publicPerfumes = perfumes.map((perfume) => ({
      ...perfume,
      collectionName: perfume.collection?.name ?? null,
      collectionStatus: perfume.collection?.status ?? null,
    }));
    publicCollections = collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      photoUrl: collection.photoUrl,
      status: collection.status,
      perfumeCount: collection.perfumes.length,
      owner: collection.owner,
    }));

    await Promise.all(
      users.map(async (user) => {
        try {
          ratingMap[user.id] = await sellerRating(user.id);
        } catch {
          ratingMap[user.id] = null;
        }
      }),
    );
  } catch (error) {
    console.error("Homepage data failed", error);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Perfume community</p>
        <h1 className="mt-2 text-5xl">Atelier</h1>
        <p className="mt-3 max-w-xl text-muted">
          Buyers and sellers, bottles and decants. Discover curated fragrance collections from collectors across India.
        </p>
      </div>

      <SearchFilter
        perfumes={publicPerfumes}
        collections={publicCollections}
        allUsers={publicUsers}
        ratingMap={ratingMap}
      />
    </div>
  );
}
