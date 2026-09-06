import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPublicListing, isPublicProfile } from "@/lib/visibility";
import { PerfumeCard } from "@/components/Cards";
import { collectionDisplayImage } from "@/lib/photos";
import { wishlistForm } from "@/actions/form-wrappers";
import { GuestAuthCta } from "@/components/GuestAuthCta";
import { StatusBadge } from "@/components/StatusBadge";

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
            {visiblePerfumes.filter((p) => p.status === "published" || p.status === "sold").length} perfume
            {visiblePerfumes.filter((p) => p.status === "published" || p.status === "sold").length === 1 ? "" : "s"} · @
            {username}
          </p>
          {session?.user && !isOwner ? (
            <form action={wishlistForm} className="mt-3">
              <input type="hidden" name="targetType" value="collection" />
              <input type="hidden" name="targetId" value={id} />
              <button className="btn btn-ghost" type="submit">
                {wish ? "Remove from wishlist" : "Wishlist collection"}
              </button>
            </form>
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
