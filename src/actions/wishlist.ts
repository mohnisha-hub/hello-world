"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/listings";

export async function toggleWishlistAction(formData: FormData) {
  const user = await requireUser();
  const targetType = String(formData.get("targetType"));
  const targetId = String(formData.get("targetId"));
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
}
