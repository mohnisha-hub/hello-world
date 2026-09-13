import { prisma } from "@/lib/prisma";

export type PublicActivity = {
  id: string;
  actor: string;
  action: string;
  subject: string;
  href: string;
  time: number;
};

// Intentionally public and low-sensitivity: no messages, contact details, or bid values.
export async function getPublicActivity(limit = 10): Promise<PublicActivity[]> {
  const [perfumes, collections, hearts, wishlists, bids] = await Promise.all([
    prisma.perfume.findMany({ where: { status: "published", owner: { profileStatus: "published" } }, select: { id: true, name: true, listingIntent: true, publishedAt: true, createdAt: true, owner: { select: { username: true } } }, orderBy: { publishedAt: "desc" }, take: limit }),
    prisma.collection.findMany({ where: { status: "published", owner: { profileStatus: "published" } }, select: { id: true, name: true, publishedAt: true, createdAt: true, owner: { select: { username: true } } }, orderBy: { publishedAt: "desc" }, take: Math.min(4, limit) }),
    prisma.scentHeart.findMany({ where: { user: { profileStatus: "published" }, profile: { profileStatus: "published" } }, select: { id: true, createdAt: true, user: { select: { username: true } }, profile: { select: { username: true } } }, orderBy: { createdAt: "desc" }, take: Math.min(4, limit) }),
    prisma.wishlistItem.findMany({ where: { user: { profileStatus: "published" } }, select: { id: true, createdAt: true, user: { select: { username: true } } }, orderBy: { createdAt: "desc" }, take: Math.min(4, limit) }),
    prisma.bid.findMany({ where: { status: { in: ["open", "accepted", "archived"] }, bidder: { profileStatus: "published" }, perfume: { owner: { profileStatus: "published" } } }, select: { id: true, createdAt: true, bidder: { select: { username: true } }, perfume: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: Math.min(4, limit) }),
  ]);

  return [
    ...perfumes.map((perfume) => ({ id: `perfume-${perfume.id}`, actor: perfume.owner.username, action: perfume.listingIntent === "collection" ? "added to their shelf" : "listed", subject: perfume.name, href: perfume.listingIntent === "collection" ? `/u/${perfume.owner.username}` : `/p/${perfume.id}`, time: (perfume.publishedAt ?? perfume.createdAt).getTime() })),
    ...collections.map((collection) => ({ id: `collection-${collection.id}`, actor: collection.owner.username, action: "curated", subject: collection.name, href: `/u/${collection.owner.username}/c/${collection.id}`, time: (collection.publishedAt ?? collection.createdAt).getTime() })),
    ...hearts.map((heart) => ({ id: `heart-${heart.id}`, actor: heart.user.username, action: "hearted a Podium pick from", subject: `@${heart.profile.username}`, href: `/u/${heart.profile.username}`, time: heart.createdAt.getTime() })),
    ...wishlists.map((wishlist) => ({ id: `wishlist-${wishlist.id}`, actor: wishlist.user.username, action: "saved a scent to their", subject: "Wishlist", href: `/u/${wishlist.user.username}`, time: wishlist.createdAt.getTime() })),
    ...bids.map((bid) => ({ id: `bid-${bid.id}`, actor: bid.bidder.username, action: "placed a bid on", subject: bid.perfume.name, href: `/p/${bid.perfume.id}`, time: bid.createdAt.getTime() })),
  ].sort((a, b) => b.time - a.time).slice(0, limit);
}
