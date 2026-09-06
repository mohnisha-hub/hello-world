"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, syncCollectionStatus } from "@/lib/listings";
import { rupeesToPaise, formatMoney } from "@/lib/money";
import { isBidListing, listingAmountCents } from "@/lib/sale";

async function closeOtherBids(perfumeId: string, keepBidId?: string) {
  await prisma.bid.updateMany({
    where: {
      perfumeId,
      status: "open",
      ...(keepBidId ? { NOT: { id: keepBidId } } : {}),
    },
    data: { status: "declined" },
  });
}

async function markSold(perfumeId: string, collectionId: string | null) {
  await prisma.perfume.update({
    where: { id: perfumeId },
    data: { status: "sold", soldAt: new Date() },
  });
  await syncCollectionStatus(collectionId);
}

function revalidateDeal(username: string, perfumeId: string) {
  revalidatePath("/me/bids");
  revalidatePath("/me/buys");
  revalidatePath("/me/messages");
  revalidatePath(`/p/${perfumeId}`);
  revalidatePath(`/u/${username}`);
}

export async function placeBidAction(formData: FormData) {
  const user = await requireUser();
  const perfumeId = String(formData.get("perfumeId"));
  const amountCents = rupeesToPaise(String(formData.get("amount") ?? ""));
  if (amountCents == null || amountCents <= 0) return { error: "Enter a bid amount in INR." };
  const perfume = await prisma.perfume.findUnique({ where: { id: perfumeId } });
  if (!perfume || perfume.status !== "published") return { error: "This listing is not open." };
  if (perfume.ownerId === user.id) return { error: "You cannot bid on your own perfume." };
  if (!isBidListing(perfume.saleType)) return { error: "This perfume is buy-only." };
  const minimum = listingAmountCents(perfume);
  if (amountCents <= minimum) {
    return { error: `Bid must be more than the minimum of ${formatMoney(minimum)}.` };
  }
  await prisma.bid.create({
    data: {
      perfumeId,
      bidderId: user.id,
      sellerId: perfume.ownerId,
      amountCents,
      kind: "bid",
    },
  });
  revalidatePath("/me/bids");
  revalidatePath(`/p/${perfumeId}`);
  return { ok: true };
}

export async function buyPerfumeAction(formData: FormData) {
  const user = await requireUser();
  const perfumeId = String(formData.get("perfumeId"));
  const perfume = await prisma.perfume.findUnique({
    where: { id: perfumeId },
    include: { owner: true },
  });
  if (!perfume || perfume.status !== "published") return { error: "This listing is not for sale." };
  if (perfume.ownerId === user.id) return { error: "You cannot buy your own perfume." };
  if (isBidListing(perfume.saleType)) return { error: "This perfume is open for bids, not buy-now." };

  const conversation = await prisma.$transaction(async (tx) => {
    const bid = await tx.bid.create({
      data: {
        perfumeId,
        bidderId: user.id,
        sellerId: perfume.ownerId,
        amountCents: perfume.priceCents,
        kind: "buy",
        status: "accepted",
      },
    });
    const convo = await tx.conversation.create({ data: { bidId: bid.id } });
    await tx.message.create({
      data: {
        conversationId: convo.id,
        senderId: user.id,
        body: `Buy request for ${perfume.name} at ${formatMoney(perfume.priceCents)}. Listing: /p/${perfume.id}`,
      },
    });
    await tx.perfume.update({
      where: { id: perfumeId },
      data: { status: "sold", soldAt: new Date() },
    });
    return convo;
  });

  await closeOtherBids(perfumeId);
  await syncCollectionStatus(perfume.collectionId);
  revalidateDeal(perfume.owner.username, perfumeId);
  redirect(`/me/messages/${conversation.id}`);
}

export async function declineBidAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const bid = await prisma.bid.findFirst({
    where: { id, sellerId: user.id, status: "open", kind: "bid" },
  });
  if (!bid) return { error: "Bid not found." };
  await prisma.bid.update({ where: { id }, data: { status: "declined" } });
  revalidatePath("/me/bids");
  revalidatePath(`/p/${bid.perfumeId}`);
  return { ok: true };
}

export async function acceptBidAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const bid = await prisma.bid.findFirst({
    where: { id, sellerId: user.id, status: "open", kind: "bid" },
    include: { perfume: { include: { owner: true } }, bidder: true, conversation: true },
  });
  if (!bid) return { error: "Bid not found." };
  const conversation = await prisma.$transaction(async (tx) => {
    await tx.bid.update({ where: { id }, data: { status: "accepted" } });
    const convo =
      bid.conversation ??
      (await tx.conversation.create({ data: { bidId: id } }));
    await tx.message.create({
      data: {
        conversationId: convo.id,
        senderId: user.id,
        body: `Bid accepted for ${bid.perfume.name} at ${formatMoney(bid.amountCents)} (minimum ${formatMoney(listingAmountCents(bid.perfume))}). Perfume: /p/${bid.perfume.id}`,
      },
    });
    await tx.perfume.update({
      where: { id: bid.perfumeId },
      data: { status: "sold", soldAt: new Date() },
    });
    return convo;
  });
  await closeOtherBids(bid.perfumeId, bid.id);
  await syncCollectionStatus(bid.perfume.collectionId);
  revalidateDeal(bid.perfume.owner.username, bid.perfumeId);
  redirect(`/me/messages/${conversation.id}`);
}

export async function archiveBidSoldAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const bid = await prisma.bid.findFirst({
    where: { id, OR: [{ sellerId: user.id }, { bidderId: user.id }] },
  });
  if (!bid) return { error: "Bid not found." };
  await prisma.bid.update({ where: { id }, data: { status: "archived" } });
  const perfume = await prisma.perfume.findUnique({ where: { id: bid.perfumeId } });
  if (perfume && perfume.status !== "sold") {
    await markSold(perfume.id, perfume.collectionId);
    await closeOtherBids(perfume.id);
  }
  revalidatePath("/me/bids");
  revalidatePath("/me/buys");
  revalidatePath(`/p/${bid.perfumeId}`);
}

export async function ratePurchaseAction(formData: FormData) {
  const user = await requireUser();
  const perfumeId = String(formData.get("perfumeId"));
  const purchaseScore = Number(formData.get("purchaseScore"));
  const deliveryScore = Number(formData.get("deliveryScore"));
  if (
    !Number.isInteger(purchaseScore) ||
    !Number.isInteger(deliveryScore) ||
    purchaseScore < 1 ||
    purchaseScore > 10 ||
    deliveryScore < 1 ||
    deliveryScore > 10
  ) {
    return { error: "Rate purchase and delivery from 1 to 10." };
  }
  const bid = await prisma.bid.findFirst({
    where: {
      perfumeId,
      bidderId: user.id,
      status: { in: ["archived", "accepted"] },
    },
  });
  if (!bid) return { error: "You can rate after a buy or accepted bid." };
  await prisma.rating.upsert({
    where: { perfumeId_raterId: { perfumeId, raterId: user.id } },
    update: { purchaseScore, deliveryScore },
    create: {
      perfumeId,
      raterId: user.id,
      sellerId: bid.sellerId,
      purchaseScore,
      deliveryScore,
    },
  });
  const seller = await prisma.user.findUnique({ where: { id: bid.sellerId } });
  revalidatePath("/me/bids");
  revalidatePath("/me/buys");
  if (seller) revalidatePath(`/u/${seller.username}`);
  revalidatePath("/");
}

export async function sendMessageAction(formData: FormData) {
  const user = await requireUser();
  const conversationId = String(formData.get("conversationId"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a message." };
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { bid: true },
  });
  if (!convo) return { error: "Thread not found." };
  if (convo.bid.bidderId !== user.id && convo.bid.sellerId !== user.id) {
    return { error: "Not your conversation." };
  }
  await prisma.message.create({ data: { conversationId, senderId: user.id, body } });
  revalidatePath(`/me/messages/${conversationId}`);
}
