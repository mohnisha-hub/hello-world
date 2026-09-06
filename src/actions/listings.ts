"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, syncCollectionStatus } from "@/lib/listings";
import { trySaveUpload } from "@/lib/upload";
import { suggestedCollectionArt, suggestedPerfumeArt } from "@/lib/photos";
import { rupeesToPaise } from "@/lib/money";
import { isBidListing } from "@/lib/sale";

function revalidateOwner(username: string, extra?: string[]) {
  revalidatePath("/me");
  revalidatePath("/me/drafts");
  revalidatePath(`/u/${username}`);
  extra?.forEach((p) => revalidatePath(p));
}

export async function saveCollectionAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "A collection needs a name." };
  const intent = String(formData.get("intent") ?? "save");
  const useSuggested = formData.get("useSuggested") === "on";
  const file = formData.get("photo") as File | null;
  const upload = await trySaveUpload(file, `col-${user.id}`);
  if (upload.error) return { error: upload.error };
  const uploaded = upload.url;

  const existing = id
    ? await prisma.collection.findFirst({ where: { id, ownerId: user.id } })
    : null;

  let photoUrl = existing?.photoUrl ?? null;
  if (useSuggested) photoUrl = suggestedCollectionArt(name);
  if (uploaded) photoUrl = uploaded;

  const data = { name, photoUrl, ownerId: user.id };

  const collection = existing
    ? await prisma.collection.update({ where: { id: existing.id }, data: { name, photoUrl } })
    : await prisma.collection.create({ data });

  if (intent === "publish") {
    const publishedCount = await prisma.perfume.count({
      where: { collectionId: collection.id, status: "published" },
    });
    if (publishedCount < 1) {
      revalidateOwner(user.username, [`/u/${user.username}/c/${collection.id}`]);
      if (!existing) redirect(`/me/collections/${collection.id}`);
      return { error: "Publish at least one perfume in this collection first." };
    }
    await prisma.collection.update({
      where: { id: collection.id },
      data: { status: "published", publishedAt: collection.publishedAt ?? new Date() },
    });
  } else if (intent === "unpublish") {
    await prisma.collection.update({
      where: { id: collection.id },
      data: { status: "draft" },
    });
  }

  revalidateOwner(user.username, [`/u/${user.username}/c/${collection.id}`]);
  redirect(`/me/collections/${collection.id}`);
}

export async function savePerfumeAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const acceptBids = formData.get("acceptBids") === "on" || formData.get("acceptBids") === "true";
  const saleType = acceptBids ? "bid" : "buy";
  const priceCents = rupeesToPaise(String(formData.get("price") ?? ""));
  const minBidCents = rupeesToPaise(String(formData.get("minBid") ?? ""));
  if (!name) return { error: "Name is required." };
  if (saleType === "buy" && priceCents == null) return { error: "Enter a buy price in INR." };
  if (saleType === "bid" && (minBidCents == null || minBidCents <= 0)) {
    return { error: "Enter a minimum bid in INR." };
  }

  const intent = String(formData.get("intent") ?? "save");
  const collectionIdRaw = String(formData.get("collectionId") ?? "");
  const collectionId = collectionIdRaw || null;
  if (collectionId) {
    const col = await prisma.collection.findFirst({
      where: { id: collectionId, ownerId: user.id, NOT: { status: "deleted" } },
    });
    if (!col) return { error: "Collection not found." };
  }

  const kind = String(formData.get("kind") ?? "") || null;
  const fill = kind === "bottle" || kind === "tester" ? String(formData.get("fill") ?? "") || null : null;
  const mlRaw = String(formData.get("ml") ?? "").trim();
  const ml = mlRaw ? Number(mlRaw) : null;
  const shippingIncluded = formData.getAll("shippingIncluded").map(String).includes("true");
  const description = String(formData.get("description") ?? "").trim() || null;
  const topNotes = String(formData.get("topNotes") ?? "").trim() || null;
  const middleNotes = String(formData.get("middleNotes") ?? "").trim() || null;
  const baseNotes = String(formData.get("baseNotes") ?? "").trim() || null;
  const ratingRaw = String(formData.get("catalogRating") ?? "").trim();
  const catalogRating = ratingRaw ? Number.parseFloat(ratingRaw) : null;
  const linkLabels = formData.getAll("linkLabel").map(String);
  const linkUrls = formData.getAll("linkUrl").map(String);
  const links = linkUrls
    .map((url, i) => ({ label: linkLabels[i] || "Link", url: url.trim() }))
    .filter((l) => l.url);
  const useSuggested = formData.get("useSuggested") === "on";
  const file = formData.get("photo") as File | null;
  const upload = await trySaveUpload(file, `p-${user.id}`);
  if (upload.error) return { error: upload.error };
  const uploaded = upload.url;

  const existing = id ? await prisma.perfume.findFirst({ where: { id, ownerId: user.id } }) : null;
  if (existing && saleType === "buy" && isBidListing(existing.saleType)) {
    const openBids = await prisma.bid.count({
      where: { perfumeId: existing.id, kind: "bid", status: "open" },
    });
    if (openBids > 0) {
      return { error: "This listing has open bids. Accept or decline them before switching to buy-only." };
    }
  }
  let imageUrl = existing?.imageUrl ?? null;
  const catalogImage = String(formData.get("catalogImage") ?? "").trim();
  if (useSuggested) imageUrl = suggestedPerfumeArt(name);
  else if (catalogImage.startsWith("https://")) imageUrl = catalogImage;
  if (uploaded) imageUrl = uploaded;

  const payload = {
    name,
    saleType,
    priceCents: saleType === "buy" ? priceCents! : minBidCents!,
    minBidCents: saleType === "bid" ? minBidCents! : null,
    collectionId,
    kind,
    fill,
    ml: ml != null && Number.isFinite(ml) ? ml : null,
    shippingIncluded,
    description,
    topNotes,
    middleNotes,
    baseNotes,
    catalogRating:
      catalogRating != null && Number.isFinite(catalogRating) && catalogRating >= 0 && catalogRating <= 5
        ? catalogRating
        : null,
    links: JSON.stringify(links),
    imageUrl,
    ownerId: user.id,
  };

  const perfume = existing
    ? await prisma.perfume.update({ where: { id: existing.id }, data: payload })
    : await prisma.perfume.create({ data: payload });

  if (intent === "publish") {
    await prisma.perfume.update({
      where: { id: perfume.id },
      data: { status: "published", publishedAt: perfume.publishedAt ?? new Date() },
    });
  } else if (intent === "unpublish") {
    await prisma.perfume.update({
      where: { id: perfume.id },
      data: { status: "draft", soldAt: null },
    });
  }

  await syncCollectionStatus(collectionId);
  if (existing?.collectionId && existing.collectionId !== collectionId) {
    await syncCollectionStatus(existing.collectionId);
  }

  revalidateOwner(user.username, [`/p/${perfume.id}`]);
  redirect(`/p/${perfume.id}`);
}

export async function deletePerfumeAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const perfume = await prisma.perfume.findFirst({ where: { id, ownerId: user.id } });
  if (!perfume) return { error: "Perfume not found." };
  await prisma.perfume.update({
    where: { id },
    data: { status: "deleted" },
  });
  await syncCollectionStatus(perfume.collectionId);
  revalidateOwner(user.username);
}

export async function restoreItemAction(formData: FormData) {
  const user = await requireUser();
  const type = String(formData.get("type"));
  const id = String(formData.get("id"));
  if (type === "perfume") {
    const perfume = await prisma.perfume.findFirst({ where: { id, ownerId: user.id } });
    if (!perfume) return;
    await prisma.perfume.update({ where: { id }, data: { status: "draft" } });
    await syncCollectionStatus(perfume.collectionId);
  } else {
    await prisma.collection.updateMany({
      where: { id, ownerId: user.id },
      data: { status: "draft" },
    });
  }
  revalidateOwner(user.username);
}

export async function deleteCollectionAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  await prisma.collection.updateMany({
    where: { id, ownerId: user.id },
    data: { status: "deleted" },
  });
  revalidateOwner(user.username);
}

export async function markPerfumeSoldAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const perfume = await prisma.perfume.findFirst({ where: { id, ownerId: user.id } });
  if (!perfume) return { error: "Not found." };
  await prisma.perfume.update({
    where: { id },
    data: { status: "sold", soldAt: new Date() },
  });
  await prisma.bid.updateMany({
    where: { perfumeId: id, status: { in: ["open", "accepted"] } },
    data: { status: "archived" },
  });
  await syncCollectionStatus(perfume.collectionId);
  revalidateOwner(user.username, [`/p/${id}`]);
}

export async function togglePinAction(formData: FormData) {
  const user = await requireUser();
  const targetType = String(formData.get("targetType"));
  const targetId = String(formData.get("targetId"));
  const existing = await prisma.pin.findUnique({
    where: { userId_targetType_targetId: { userId: user.id, targetType, targetId } },
  });
  if (existing) {
    await prisma.pin.delete({ where: { id: existing.id } });
  } else {
    if (targetType === "collection") {
      const col = await prisma.collection.findFirst({
        where: { id: targetId, ownerId: user.id, status: { in: ["published", "sold"] } },
      });
      if (!col) return { error: "Only live collections can be pinned." };
    } else {
      const perfume = await prisma.perfume.findFirst({
        where: { id: targetId, ownerId: user.id, status: { in: ["published", "sold"] } },
      });
      if (!perfume) return { error: "Only live perfumes can be pinned." };
    }
    const count = await prisma.pin.count({ where: { userId: user.id } });
    if (count >= 3) return { error: "You can pin up to three items." };
    await prisma.pin.create({
      data: { userId: user.id, targetType, targetId, position: count + 1 },
    });
  }
  revalidateOwner(user.username);
}
