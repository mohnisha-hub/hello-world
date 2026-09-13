"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/listings";
import { getSessionUser } from "@/lib/acting";
import { trySaveUpload } from "@/lib/upload";
import { suggestedAvatar } from "@/lib/photos";
import { SCENT_PROFILE_SLOTS } from "@/lib/showcase";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

export async function completeOnboardingAction(formData: FormData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) redirect("/login?from=/onboarding");

  const username = String(formData.get("username") ?? "").trim();
  if (!USERNAME_RE.test(username)) return { error: "Username must be 3–24 letters, numbers, or underscores." };

  const current = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!current) redirect("/login?from=/onboarding");
  const taken = await prisma.user.findFirst({ where: { username, NOT: { id: current.id } }, select: { id: true } });
  if (taken) return { error: "That username is already taken." };

  const intent = String(formData.get("intent") ?? "draft");
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || current.email || null;
  const file = formData.get("photo") as File | null;
  const upload = await trySaveUpload(file, `user-${current.id}`);
  if (upload.error) return { error: upload.error };

  await prisma.user.update({
    where: { id: current.id },
    data: {
      username,
      bio,
      location,
      email,
      photoUrl: upload.url ?? current.photoUrl ?? suggestedAvatar(username),
      profileStatus: intent === "publish" ? "published" : "draft",
      usernameConfigured: true,
    },
  });
  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath("/me/profile");
  if (intent === "publish") redirect(`/u/${username}`);
  const returnTo = String(formData.get("returnTo") ?? "/me/profile");
  redirect(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/me/profile");
}

export async function saveProfileAction(formData: FormData) {
  const user = await requireUser();
  const intent = String(formData.get("intent") ?? "save");
  const publish = intent === "publish";
  const useSuggested = formData.get("useSuggested") === "on";
  const removePhoto = formData.get("removePhoto") === "on";
  const file = formData.get("photo") as File | null;
  const upload = await trySaveUpload(file, `user-${user.id}`);
  if (upload.error) return { error: upload.error };
  const uploaded = upload.url;

  const current = await prisma.user.findUnique({ where: { id: user.id } });
  if (!current) return { error: "Account missing." };

  let photoUrl = current.photoUrl;
  if (removePhoto) photoUrl = null;
  if (useSuggested) photoUrl = suggestedAvatar(user.username);
  if (uploaded) photoUrl = uploaded;

  // Contact takes place in deal chat. Retain legacy private fields without
  // surfacing them in the collector profile experience.
  const email = current.email;
  const workNumber = current.workNumber;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const feedSort = String(formData.get("feedSort") ?? current.feedSort);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email,
      workNumber,
      bio,
      location,
      photoUrl,
      feedSort: feedSort === "publishedAtAsc" ? "publishedAtAsc" : "publishedAtDesc",
      profileStatus: publish ? "published" : "draft",
    },
  });
  revalidatePath("/me");
  revalidatePath("/me/profile");
  revalidatePath("/");
  revalidatePath(`/u/${user.username}`);
  if (publish) redirect(`/u/${user.username}`);
  return { ok: true, published: publish };
}

export async function setFeedSortAction(formData: FormData) {
  const user = await requireUser();
  const feedSort = String(formData.get("feedSort"));
  await prisma.user.update({
    where: { id: user.id },
    data: { feedSort: feedSort === "publishedAtAsc" ? "publishedAtAsc" : "publishedAtDesc" },
  });
  revalidatePath("/me");
  revalidatePath(`/u/${user.username}`);
}

export async function saveScentShowcaseAction(formData: FormData) {
  const user = await requireUser();
  const ownedPerfumes = await prisma.perfume.findMany({
    where: { ownerId: user.id, NOT: { status: "deleted" } },
    select: { id: true },
  });
  const ownedIds = new Set(ownedPerfumes.map((perfume) => perfume.id));
  const top3 = ["top1", "top2", "top3"]
    .map((name) => String(formData.get(name) ?? ""))
    .filter((id, index, values) => ownedIds.has(id) && values.indexOf(id) === index);
  const slots = Object.fromEntries(
    SCENT_PROFILE_SLOTS.flatMap(([key]) => {
      const perfumeId = String(formData.get(key) ?? "");
      return ownedIds.has(perfumeId) ? [[key, perfumeId]] : [];
    }),
  );
  await prisma.user.update({ where: { id: user.id }, data: { scentShowcase: JSON.stringify({ top3, slots }) } });
  revalidatePath(`/u/${user.username}`);
}
