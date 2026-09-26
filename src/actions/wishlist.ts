"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/listings";

export async function toggleWishlistAction(formData: FormData) {
  const user = await requireUser();
  const targetType = String(formData.get("targetType"));
  const targetId = String(formData.get("targetId"));
  if (targetType === "perfume") {
    const perfume = await prisma.perfume.findUnique({
      where: { id: targetId },
      select: { ownerId: true, status: true, owner: { select: { profileStatus: true } } },
    });
    if (!perfume || perfume.ownerId === user.id || perfume.status !== "published" || perfume.owner.profileStatus !== "published") {
      return { saved: false, error: "That perfume is not available to wishlist." };
    }
  } else if (targetType === "collection") {
    const collection = await prisma.collection.findUnique({
      where: { id: targetId },
      select: { ownerId: true, status: true, owner: { select: { profileStatus: true } } },
    });
    if (!collection || collection.ownerId === user.id || collection.status !== "published" || collection.owner.profileStatus !== "published") {
      return { saved: false, error: "That collection is not available to wishlist." };
    }
  } else if (targetType !== "catalog") {
    return { saved: false, error: "That item cannot be wishlisted." };
  }
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
  });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({ data: { userId: user.id, targetType, targetId } });
  }
  revalidatePath("/me/wishlist");
  revalidatePath(`/p/${targetId}`);
  revalidatePath("/explore");
  return { saved: !existing };
}
