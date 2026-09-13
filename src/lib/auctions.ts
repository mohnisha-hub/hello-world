import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { notify } from "@/lib/notifications";

/** Settles each expired auction exactly once. Safe to call from cron and user-facing routes. */
export async function settleExpiredAuctions(now = new Date()) {
  const expired = await prisma.perfume.findMany({
    where: { status: "published", saleType: "bid", bidEndsAt: { lte: now } },
    select: { id: true },
  });
  for (const { id } of expired) await settleAuction(id, now);
}

async function settleAuction(perfumeId: string, now: Date) {
  const outcome = await prisma.$transaction(async (tx) => {
    const perfume = await tx.perfume.findUnique({ where: { id: perfumeId }, include: { owner: true } });
    if (!perfume || perfume.status !== "published" || perfume.saleType !== "bid" || !perfume.bidEndsAt || perfume.bidEndsAt > now) return null;
    const winner = await tx.bid.findFirst({
      where: { perfumeId, kind: "bid", status: "open", amountCents: { gte: perfume.minBidCents ?? perfume.priceCents } },
      orderBy: [{ amountCents: "desc" }, { createdAt: "asc" }],
      include: { bidder: true, conversation: true },
    });
    if (!winner) {
      await tx.bid.updateMany({ where: { perfumeId, kind: "bid", status: "open" }, data: { status: "declined" } });
      return { kind: "no-winner" as const, perfume, winner: null, conversationId: null };
    }
    const accepted = await tx.bid.updateMany({ where: { id: winner.id, status: "open" }, data: { status: "accepted" } });
    if (!accepted.count) return null;
    await tx.bid.updateMany({ where: { perfumeId, kind: "bid", status: "open", NOT: { id: winner.id } }, data: { status: "declined" } });
    const conversation = winner.conversation ?? await tx.conversation.create({ data: { bidId: winner.id } });
    await tx.message.create({ data: { conversationId: conversation.id, senderId: perfume.ownerId, body: `Auction ended — @${winner.bidder.username} won ${perfume.name} at ${formatMoney(winner.amountCents)}. The deal chat is now open.` } });
    return { kind: "winner" as const, perfume, winner, conversationId: conversation.id };
  });
  if (!outcome) return;
  if (outcome.kind === "no-winner") {
    await notify(outcome.perfume.ownerId, "auction-ended", `Bidding ended on ${outcome.perfume.name} with no eligible bids.`, `/p/${outcome.perfume.id}`);
    return;
  }
  await Promise.all([
    notify(outcome.perfume.ownerId, "auction-winner", `Auction ended: @${outcome.winner.bidder.username} won ${outcome.perfume.name} at ${formatMoney(outcome.winner.amountCents)}.`, `/me/messages/${outcome.conversationId}`),
    notify(outcome.winner.bidderId, "auction-winner", `You won ${outcome.perfume.name} at ${formatMoney(outcome.winner.amountCents)}. Deal chat is open.`, `/me/messages/${outcome.conversationId}`),
  ]);
}
