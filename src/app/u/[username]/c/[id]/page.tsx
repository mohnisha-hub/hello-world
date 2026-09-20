import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPublicListing, isPublicProfile } from "@/lib/visibility";
import { PerfumeCard } from "@/components/Cards";
import { collectionDisplayImage } from "@/lib/photos";
import { GuestAuthCta } from "@/components/GuestAuthCta";
import { StatusBadge } from "@/components/StatusBadge";
import { WishlistButton } from "@/components/WishlistButton";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ username: string; id: string }>;
}) {
  const { username, id } = await params;
  const session = await auth();
  const collection = await prisma.collection.findFirst({
    where: { id, owner: { username } },
    include: { owner: true, perfumes: true },
  });
  if (!collection) notFound();
  const isOwner = session?.user?.id === collection.ownerId;
  if (!isOwner) {
    if (!isPublicProfile(collection.owner.profileStatus) || !isPublicListing(collection.status)) notFound();
  }
  const visiblePerfumes = collection.perfumes.filter((p) => isOwner || isPublicListing(p.status));
  const wish = session?.user?.id
    ? await prisma.wishlistItem.findUnique({
        where: {
          userId_targetType_targetId: { userId: session.user.id, targetType: "collection", targetId: id },
        },
      })
    : null;

  return (
    <div className="space-y-6">
      <Link href={`/u/${username}`} className="text-sm">
        ← Back to feed
      </Link>
      <div className="flex flex-wrap items-end gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={collectionDisplayImage(collection.name, collection.photoUrl)}
          alt=""
          className="h-40 w-40 rounded-3xl object-cover"
        />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl">{collection.name}</h1>
            <StatusBadge status={collection.status} />
          </div>
          <p className="text-muted">
            Curated by @{username} · {visiblePerfumes.filter((p) => p.status === "published" || p.status === "sold").length} perfume
            {visiblePerfumes.filter((p) => p.status === "published" || p.status === "sold").length === 1 ? "" : "s"}
          </p>
          {session?.user && !isOwner ? (
            <div className="mt-3"><WishlistButton targetType="collection" targetId={id} saved={Boolean(wish)} label="Wishlist collection" /></div>
          ) : null}
          {isOwner ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="btn" href={`/me/perfumes/new?collectionId=${collection.id}`}>
                + Perfume
              </Link>
              <Link className="btn btn-ghost" href={`/me/collections/${collection.id}`}>
                Manage collection
              </Link>
            </div>
          ) : null}
          {!session?.user && !isOwner ? (
            <div className="mt-3">
              <GuestAuthCta from={`/u/${username}/c/${id}`} action="wishlist this collection" />
            </div>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {visiblePerfumes.map((p) => (
          <PerfumeCard key={p.id} perfume={p} href={`/p/${p.id}`} showStatus={isOwner} />
        ))}
      </div>
    </div>
  );
}
