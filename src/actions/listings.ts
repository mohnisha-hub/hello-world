"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, syncCollectionStatus } from "@/lib/listings";
import { trySaveUpload } from "@/lib/upload";
import { suggestedCollectionArt, suggestedPerfumeArt } from "@/lib/photos";
import { rupeesToPaise } from "@/lib/money";
import { isBidListing } from "@/lib/sale";
import { fragranceByCatalogKey, notesToText } from "@/lib/fragrance-catalog";
import { withNotice } from "@/lib/notice";
import { takeUserLimit } from "@/lib/rate-limit";
import { recordUsage } from "@/lib/metrics";

function readText(formData: FormData, key: string, maxLength: number) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length <= maxLength ? value || null : undefined;
}

function revalidateOwner(username: string, extra?: string[]) {
  revalidatePath("/me");
  revalidatePath("/me/drafts");
  revalidatePath(`/u/${username}`);
  extra?.forEach((p) => revalidatePath(p));
}

async function moveToUncategorizedCollection(ownerId: string, sourceCollectionId: string) {
  const perfumes = await prisma.perfume.findMany({
    where: { collectionId: sourceCollectionId },
    select: { status: true },
  });
  if (!perfumes.length) return null;

  let target = await prisma.collection.findFirst({
    where: { ownerId, name: "Uncategorized", NOT: { id: sourceCollectionId }, status: { not: "deleted" } },
  });
  if (!target) {
    target = await prisma.collection.create({
      data: { ownerId, name: "Uncategorized", photoUrl: suggestedCollectionArt("Uncategorized") },
    });
  }
  await prisma.perfume.updateMany({
    where: { collectionId: sourceCollectionId },
    data: { collectionId: target.id },
  });
  if (perfumes.some((perfume) => perfume.status === "published")) {
    target = await prisma.collection.update({
      where: { id: target.id },
      data: { status: "published", publishedAt: target.publishedAt ?? new Date() },
    });
  } else if (perfumes.length && perfumes.every((perfume) => perfume.status === "sold")) {
    target = await prisma.collection.update({ where: { id: target.id }, data: { status: "sold" } });
  }
  return target;
}

export async function saveCollectionAction(formData: FormData) {
  const user = await requireUser();
  if (!(await takeUserLimit("collection-save", user.id, 30, 60 * 60_000))) return { error: "You have made many changes recently. Please try again in an hour." };
  const id = String(formData.get("id") ?? "");
  const name = readText(formData, "name", 100);
  if (!name) return { error: name === undefined ? "Collection names can be up to 100 characters." : "A collection needs a name." };
  const intent = String(formData.get("intent") ?? "save");
  const useAtelierArt = formData.get("coverSource") !== "upload";
  const file = formData.get("photo") as File | null;
  const upload = await trySaveUpload(file, `col-${user.id}`, user.id);
  if (upload.error) return { error: upload.error };
  const uploaded = upload.url;

  const existing = id
    ? await prisma.collection.findFirst({ where: { id, ownerId: user.id } })
    : null;

  let photoUrl = useAtelierArt ? suggestedCollectionArt(name) : existing?.photoUrl ?? null;
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
    if (existing?.status !== "published") recordUsage("collection_published");
  } else if (intent === "unpublish") {
    const destination = await moveToUncategorizedCollection(user.id, collection.id);
    await prisma.collection.update({
      where: { id: collection.id },
      data: { status: "draft" },
    });
    await prisma.pin.deleteMany({ where: { userId: user.id, targetType: "collection", targetId: collection.id } });
    revalidateOwner(user.username, [`/u/${user.username}/c/${collection.id}`, ...(destination ? [`/u/${user.username}/c/${destination.id}`] : [])]);
    if (destination) redirect(`/me/collections/${destination.id}`);
  }

  revalidateOwner(user.username, [`/u/${user.username}/c/${collection.id}`]);
  redirect(`/me/collections/${collection.id}`);
}

export async function savePerfumeAction(formData: FormData) {
  const user = await requireUser();
  if (!(await takeUserLimit("listing-save", user.id, 60, 60 * 60_000))) return { error: "You have made many listing changes recently. Please try again in an hour." };
  const id = String(formData.get("id") ?? "");
  const brand = readText(formData, "brand", 100);
  const name = readText(formData, "name", 160);
  const listingIntent = String(formData.get("listingIntent") ?? "marketplace") === "collection" ? "collection" : "marketplace";
  const createMarketplaceListing = listingIntent === "collection" && formData.get("createMarketplaceListing") === "true";
  const acceptBids = formData.get("acceptBids") === "on" || formData.get("acceptBids") === "true";
  const saleType = listingIntent === "collection" ? "collection" : acceptBids ? "bid" : "buy";
  const priceCents = rupeesToPaise(String(formData.get("price") ?? ""));
  const minBidCents = rupeesToPaise(String(formData.get("minBid") ?? ""));
  if (!name) return { error: name === undefined ? "Perfume names can be up to 160 characters." : "Name is required." };
  if (brand === undefined) return { error: "Brand names can be up to 100 characters." };
  if (listingIntent === "marketplace" && saleType === "buy" && priceCents == null) return { error: "Enter a buy price in INR." };
  if (listingIntent === "marketplace" && saleType === "bid" && (minBidCents == null || minBidCents <= 0)) {
    return { error: "Enter a minimum bid in INR." };
  }
  const marketplaceKind = String(formData.get("marketplaceKind") ?? "");
  const marketplaceMl = Number(String(formData.get("marketplaceMl") ?? ""));
  const marketplacePriceCents = rupeesToPaise(String(formData.get("marketplacePrice") ?? ""));
  if (createMarketplaceListing && !["retail", "partial", "decant"].includes(marketplaceKind)) {
    return { error: "Choose Retail, Partial, or Decant for the marketplace listing." };
  }
  if (createMarketplaceListing && (!Number.isFinite(marketplaceMl) || marketplaceMl <= 0 || marketplacePriceCents == null || marketplacePriceCents <= 0)) {
    return { error: "Add a valid price and volume for the marketplace listing." };
  }
  const durationValue = Number(String(formData.get("bidDuration") ?? ""));
  const durationUnit = String(formData.get("bidDurationUnit") ?? "hours");
  const durationHours = durationUnit === "days" ? durationValue * 24 : durationValue;
  if (listingIntent === "marketplace" && saleType === "bid" && (!Number.isInteger(durationValue) || durationValue < 1 || durationHours > 48)) {
    return { error: "Set a bid duration from 1 to 48 hours." };
  }

  const intent = String(formData.get("intent") ?? "save");
  if (createMarketplaceListing && intent !== "publish") {
    return { error: "Publish the shelf perfume to create its marketplace listing." };
  }
  const collectionIdRaw = String(formData.get("collectionId") ?? "");
  const collectionId = collectionIdRaw || null;
  if (collectionId) {
    const col = await prisma.collection.findFirst({
      where: { id: collectionId, ownerId: user.id, NOT: { status: "deleted" } },
    });
    if (!col) return { error: "Collection not found." };
  }

  const kind = String(formData.get("kind") ?? "");
  if (listingIntent === "marketplace" && !new Set(["retail", "partial", "decant"]).has(kind)) {
    return { error: "Choose Retail, Partial, or Decant." };
  }
  const fill = null;
  const mlRaw = String(formData.get("ml") ?? "").trim();
  const ml = mlRaw ? Number(mlRaw) : null;
  if (listingIntent === "marketplace" && (ml == null || !Number.isFinite(ml) || ml <= 0)) return { error: "Enter the perfume volume in millilitres." };
  const unitsAvailable = Number(String(formData.get("unitsAvailable") ?? "1"));
  if (listingIntent === "marketplace" && (!Number.isInteger(unitsAvailable) || unitsAvailable < 1)) return { error: "Enter at least one available unit." };
  const shippingIncluded = formData.getAll("shippingIncluded").map(String).includes("true");
  const description = readText(formData, "description", 4_000);
  const sourcedFrom = readText(formData, "sourcedFrom", 240);
  const topNotes = readText(formData, "topNotes", 1_000);
  const middleNotes = readText(formData, "middleNotes", 1_000);
  const baseNotes = readText(formData, "baseNotes", 1_000);
  if ([description, sourcedFrom, topNotes, middleNotes, baseNotes].includes(undefined)) return { error: "One or more listing fields are too long." };
  const ratingRaw = String(formData.get("catalogRating") ?? "").trim();
  const parsedRating = ratingRaw ? Number.parseFloat(ratingRaw) : null;
  // Fragrantica ratings commonly use two decimal places (for example 3.95).
  // Normalize before persistence so imported and manually entered values use
  // a consistent, database-safe precision.
  const catalogRating = parsedRating != null && Number.isFinite(parsedRating)
    ? Math.round(parsedRating * 100) / 100
    : null;
  const useAtelierArt = formData.get("coverSource") !== "upload";
  const file = formData.get("photo") as File | null;
  const upload = await trySaveUpload(file, `p-${user.id}`, user.id);
  if (upload.error) return { error: upload.error };
  const uploaded = upload.url;

  const existing = id ? await prisma.perfume.findFirst({ where: { id, ownerId: user.id } }) : null;
  if (existing && listingIntent === "collection" && isBidListing(existing.saleType)) {
    const openBids = await prisma.bid.count({ where: { perfumeId: existing.id, kind: "bid", status: "open" } });
    if (openBids) return { error: "This listing has open bids. Settle or decline them before moving it to your shelf." };
  }
  if (existing && saleType === "buy" && isBidListing(existing.saleType)) {
    const openBids = await prisma.bid.count({
      where: { perfumeId: existing.id, kind: "bid", status: "open" },
    });
    if (openBids > 0) {
      return { error: "This listing has open bids. Accept or decline them before switching to buy-only." };
    }
  }
  let imageUrl = useAtelierArt ? suggestedPerfumeArt(name) : existing?.imageUrl ?? null;
  if (uploaded) imageUrl = uploaded;

  const bidEndsAt = saleType === "bid"
    ? existing?.bidEndsAt && existing.bidEndsAt > new Date()
      ? existing.bidEndsAt
      : new Date(Date.now() + durationHours * 60 * 60 * 1000)
    : null;
  const payload = {
    brand,
    name,
    saleType,
    listingIntent,
    priceCents: listingIntent === "collection" ? 0 : saleType === "buy" ? priceCents! : minBidCents!,
    minBidCents: saleType === "bid" ? minBidCents! : null,
    bidEndsAt,
    collectionId,
    kind: kind || null,
    fill,
    ml: ml != null && Number.isFinite(ml) ? ml : null,
    unitsAvailable: listingIntent === "collection" ? 1 : unitsAvailable,
    shippingIncluded: listingIntent === "collection" ? null : shippingIncluded,
    description,
    sourcedFrom,
    topNotes,
    middleNotes,
    baseNotes,
    catalogRating:
      listingIntent === "marketplace" && catalogRating != null && Number.isFinite(catalogRating) && catalogRating >= 0 && catalogRating <= 5
        ? catalogRating
        : null,
    // External user-provided URLs are intentionally not stored or rendered.
    links: "[]",
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
    if (existing?.status !== "published") recordUsage("perfume_published", { listing_intent: listingIntent, sale_type: saleType });
  } else if (intent === "unpublish") {
    await prisma.perfume.update({
      where: { id: perfume.id },
      data: { status: "draft", soldAt: null },
    });
  }

  let marketplaceCopyId: string | null = null;
  if (createMarketplaceListing) {
    const marketplaceCopy = await prisma.perfume.create({
      data: {
        ownerId: user.id,
        collectionId: null,
        brand,
        name,
        saleType: "buy",
        listingIntent: "marketplace",
        priceCents: marketplacePriceCents!,
        minBidCents: null,
        bidEndsAt: null,
        kind: marketplaceKind,
        fill: null,
        ml: marketplaceMl,
        unitsAvailable: 1,
        shippingIncluded: false,
        description,
        sourcedFrom,
        topNotes,
        middleNotes,
        baseNotes,
        catalogRating:
          catalogRating != null && Number.isFinite(catalogRating) && catalogRating >= 0 && catalogRating <= 5
            ? catalogRating
            : null,
        links: "[]",
        imageUrl,
        status: "published",
        publishedAt: new Date(),
      },
    });
    marketplaceCopyId = marketplaceCopy.id;
  }

  await syncCollectionStatus(collectionId);
  if (existing?.collectionId && existing.collectionId !== collectionId) {
    await syncCollectionStatus(existing.collectionId);
  }

  revalidateOwner(user.username, [`/p/${perfume.id}`, ...(marketplaceCopyId ? [`/p/${marketplaceCopyId}`] : [])]);
  if (marketplaceCopyId) redirect(withNotice(`/p/${marketplaceCopyId}`, "Marketplace listing created from your shelf perfume."));
  redirect(`/p/${perfume.id}`);
}

export async function addCatalogPerfumeToShelfAction(formData: FormData) {
  const user = await requireUser();
  const entry = fragranceByCatalogKey(String(formData.get("catalogKey") ?? ""));
  if (!entry) return;
  const existing = await prisma.perfume.findFirst({ where: { ownerId: user.id, brand: entry.brand, name: entry.name, listingIntent: "collection", status: { not: "deleted" } }, select: { id: true } });
  if (!existing) {
    await prisma.perfume.create({ data: { ownerId: user.id, brand: entry.brand, name: entry.name, saleType: "collection", listingIntent: "collection", priceCents: 0, imageUrl: entry.imageUrl ?? suggestedPerfumeArt(entry.name), topNotes: notesToText(entry.top), middleNotes: notesToText(entry.middle), baseNotes: notesToText(entry.base), links: "[]", status: "published", publishedAt: new Date() } });
    recordUsage("shelf_added", { source: "perfume_explorer" });
  }
  revalidateOwner(user.username);
  revalidatePath("/explore");
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && text[index + 1] === "\n") index += 1; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}

export async function importPerfumesAction(formData: FormData) {
  const user = await requireUser();
  if (!(await takeUserLimit("listing-import", user.id, 12, 60 * 60_000))) redirect(`/me/perfumes/import?notice=${encodeURIComponent("You have reached the hourly import limit. Please try again later.")}`);
  const fail = (message: string): never => redirect(`/me/perfumes/import?notice=${encodeURIComponent(message)}`);
  const file = formData.get("file") as File | null;
  if (!file) fail("Upload the Atelier CSV template as a .csv file.");
  const csvFile = file as File;
  if (!csvFile.name.toLowerCase().endsWith(".csv")) fail("Upload the Atelier CSV template as a .csv file.");
  if (csvFile.size > 1024 * 1024) fail("Keep CSV uploads under 1 MB.");
  const rows = parseCsv(await csvFile.text());
  if (rows.length < 2) fail("Add at least one perfume row below the template headings.");
  const headers = rows[0].map((header) => header.toLowerCase().replace(/\s+/g, "_"));
  const required = ["name", "listing_intent"];
  if (required.some((header) => !headers.includes(header))) fail("This file is missing a required template column.");
  const records = rows.slice(1);
  if (records.length > 100) fail("Import up to 100 perfumes at a time.");
  const valueFor = (row: string[], key: string) => row[headers.indexOf(key)]?.trim() ?? "";
  const issues: string[] = [];
  const parsed = records.map((row, index) => {
    const name = valueFor(row, "name");
    const listingIntent = valueFor(row, "listing_intent").toLowerCase() === "collection" ? "collection" : "marketplace";
    const saleType = listingIntent === "collection" ? "collection" : valueFor(row, "listing_type").toLowerCase() === "bid" ? "bid" : "buy";
    const kind = valueFor(row, "kind").toLowerCase();
    const ml = Number(valueFor(row, "ml"));
    const bidDurationHours = Number(valueFor(row, "bid_duration_hours") || "24");
    const amount = rupeesToPaise(valueFor(row, saleType === "bid" ? "min_bid_inr" : "price_inr"));
    const invalidMarketplace = !["retail", "partial", "decant"].includes(kind) || !Number.isFinite(ml) || ml <= 0 || amount == null || amount <= 0 || (saleType === "bid" && (!Number.isInteger(bidDurationHours) || bidDurationHours < 1 || bidDurationHours > 48));
    if (!name || (listingIntent === "marketplace" && invalidMarketplace)) issues.push(`Row ${index + 2}`);
    return { name, listingIntent, saleType, kind: kind || null, ml: Number.isFinite(ml) && ml > 0 ? ml : null, amount, bidDurationHours, row };
  });
  if (issues.length) fail(`${issues.slice(0, 5).join(", ")} need a name. Marketplace rows also need a valid type, ml, and INR price or minimum bid.`);
  const existingCollections = await prisma.collection.findMany({ where: { ownerId: user.id, NOT: { status: "deleted" } }, select: { id: true, name: true } });
  const collectionIds = new Map(existingCollections.map((collection) => [collection.name.toLowerCase(), collection.id]));
  for (const item of parsed) {
    const collectionName = valueFor(item.row, "collection");
    let collectionId: string | null = null;
    if (collectionName) {
      const key = collectionName.toLowerCase();
      collectionId = collectionIds.get(key) ?? null;
      if (!collectionId) {
        const collection = await prisma.collection.create({ data: { ownerId: user.id, name: collectionName, photoUrl: suggestedCollectionArt(collectionName) } });
        collectionId = collection.id;
        collectionIds.set(key, collection.id);
      }
    }
    const shipping = ["true", "yes", "1"].includes(valueFor(item.row, "shipping_included").toLowerCase());
    await prisma.perfume.create({ data: { ownerId: user.id, collectionId, brand: valueFor(item.row, "brand") || null, name: item.name, listingIntent: item.listingIntent, saleType: item.saleType, priceCents: item.listingIntent === "marketplace" ? item.amount! : 0, minBidCents: item.saleType === "bid" ? item.amount : null, bidEndsAt: item.saleType === "bid" ? new Date(Date.now() + item.bidDurationHours * 60 * 60 * 1000) : null, kind: item.kind, ml: item.ml, shippingIncluded: item.listingIntent === "marketplace" ? shipping : false, description: valueFor(item.row, "description") || null, topNotes: valueFor(item.row, "top_notes") || null, middleNotes: valueFor(item.row, "middle_notes") || null, baseNotes: valueFor(item.row, "base_notes") || null, links: "[]", imageUrl: suggestedPerfumeArt(item.name) } });
  }
  recordUsage("bulk_imported", { count: parsed.length });
  revalidateOwner(user.username);
  redirect(`/me/perfumes?notice=${encodeURIComponent(`${parsed.length} perfume${parsed.length === 1 ? "" : "s"} imported as drafts.`)}`);
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
  redirect(withNotice("/me/drafts", "Perfume removed from your profile. You can restore it here."));
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
  const collection = await prisma.collection.findFirst({ where: { id, ownerId: user.id } });
  if (!collection) return { error: "Collection not found." };
  const destination = await moveToUncategorizedCollection(user.id, collection.id);
  await prisma.collection.update({ where: { id }, data: { status: "deleted" } });
  await prisma.pin.deleteMany({ where: { userId: user.id, targetType: "collection", targetId: id } });
  revalidateOwner(user.username, [`/u/${user.username}/c/${id}`, ...(destination ? [`/u/${user.username}/c/${destination.id}`] : [])]);
  redirect(withNotice("/me/drafts", "Collection removed. Its perfumes are now in Uncategorized; the collection can be restored here."));
}

export async function markPerfumeSoldAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const perfume = await prisma.perfume.findFirst({ where: { id, ownerId: user.id } });
  if (!perfume) return { error: "Not found." };
  const remaining = Math.max(0, perfume.unitsAvailable - 1);
  await prisma.perfume.update({ where: { id }, data: { unitsAvailable: remaining, ...(remaining === 0 ? { status: "sold", soldAt: new Date() } : {}) } });
  if (remaining === 0) {
    await prisma.bid.updateMany({ where: { perfumeId: id, status: { in: ["open", "accepted"] } }, data: { status: "archived" } });
    await syncCollectionStatus(perfume.collectionId);
  }
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
