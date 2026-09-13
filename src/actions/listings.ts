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
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "A collection needs a name." };
  const intent = String(formData.get("intent") ?? "save");
  const useAtelierArt = formData.get("coverSource") !== "upload";
  const file = formData.get("photo") as File | null;
  const upload = await trySaveUpload(file, `col-${user.id}`);
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
  const id = String(formData.get("id") ?? "");
  const brand = String(formData.get("brand") ?? "").trim() || null;
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

  const kind = String(formData.get("kind") ?? "");
  if (!new Set(["retail", "tester", "partial", "decant"]).has(kind)) {
    return { error: "Choose Retail, Tester, Partial, or Decant." };
  }
  const fill = null;
  const mlRaw = String(formData.get("ml") ?? "").trim();
  const ml = mlRaw ? Number(mlRaw) : null;
  if (ml == null || !Number.isFinite(ml) || ml <= 0) return { error: "Enter the perfume volume in millilitres." };
  const unitsAvailable = Number(String(formData.get("unitsAvailable") ?? "1"));
  if (!Number.isInteger(unitsAvailable) || unitsAvailable < 1) return { error: "Enter at least one available unit." };
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
  const useAtelierArt = formData.get("coverSource") !== "upload";
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
  let imageUrl = useAtelierArt ? suggestedPerfumeArt(name) : existing?.imageUrl ?? null;
  if (uploaded) imageUrl = uploaded;

  const payload = {
    brand,
    name,
    saleType,
    priceCents: saleType === "buy" ? priceCents! : minBidCents!,
    minBidCents: saleType === "bid" ? minBidCents! : null,
    collectionId,
    kind,
    fill,
    ml: ml != null && Number.isFinite(ml) ? ml : null,
    unitsAvailable,
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
  const fail = (message: string): never => redirect(`/me/perfumes/import?notice=${encodeURIComponent(message)}`);
  const file = formData.get("file") as File | null;
  if (!file) fail("Upload the Atelier CSV template as a .csv file.");
  const csvFile = file as File;
  if (!csvFile.name.toLowerCase().endsWith(".csv")) fail("Upload the Atelier CSV template as a .csv file.");
  if (csvFile.size > 1024 * 1024) fail("Keep CSV uploads under 1 MB.");
  const rows = parseCsv(await csvFile.text());
  if (rows.length < 2) fail("Add at least one perfume row below the template headings.");
  const headers = rows[0].map((header) => header.toLowerCase().replace(/\s+/g, "_"));
  const required = ["name", "listing_type", "kind", "ml"];
  if (required.some((header) => !headers.includes(header))) fail("This file is missing a required template column.");
  const records = rows.slice(1);
  if (records.length > 100) fail("Import up to 100 perfumes at a time.");
  const valueFor = (row: string[], key: string) => row[headers.indexOf(key)]?.trim() ?? "";
  const issues: string[] = [];
  const parsed = records.map((row, index) => {
    const name = valueFor(row, "name");
    const saleType = valueFor(row, "listing_type").toLowerCase() === "bid" ? "bid" : "buy";
    const kind = valueFor(row, "kind").toLowerCase();
    const ml = Number(valueFor(row, "ml"));
    const amount = rupeesToPaise(valueFor(row, saleType === "bid" ? "min_bid_inr" : "price_inr"));
    if (!name || !["retail", "tester", "partial", "decant"].includes(kind) || !Number.isFinite(ml) || ml <= 0 || amount == null || amount <= 0) issues.push(`Row ${index + 2}`);
    return { name, saleType, kind, ml, amount, row };
  });
  if (issues.length) fail(`${issues.slice(0, 5).join(", ")} need a name, valid listing type, kind, ml, and INR price or minimum bid.`);
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
    await prisma.perfume.create({ data: { ownerId: user.id, collectionId, brand: valueFor(item.row, "brand") || null, name: item.name, saleType: item.saleType, priceCents: item.amount!, minBidCents: item.saleType === "bid" ? item.amount : null, kind: item.kind, ml: item.ml, shippingIncluded: shipping, description: valueFor(item.row, "description") || null, topNotes: valueFor(item.row, "top_notes") || null, middleNotes: valueFor(item.row, "middle_notes") || null, baseNotes: valueFor(item.row, "base_notes") || null, links: "[]", imageUrl: suggestedPerfumeArt(item.name) } });
  }
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
  redirect(`/u/${user.username}`);
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
