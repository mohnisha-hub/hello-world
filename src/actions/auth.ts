"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { ACTING_COOKIE } from "@/lib/acting";
import { getSessionUser } from "@/lib/acting";
import { isAdminUsername } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { suggestedAvatar } from "@/lib/photos";
import { DATABASE_UNAVAILABLE, isDatabaseConfigured } from "@/lib/db";
import { isRedirectError } from "next/dist/client/components/redirect-error";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

function safePath(from: string) {
  return from.startsWith("/") && !from.startsWith("//") ? from : "/me/profile";
}

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const safeFrom = safePath(String(formData.get("from") ?? "/me/profile"));
  if (!username || !password) return { error: "Username and password are required." };
  if (!isDatabaseConfigured()) return { error: DATABASE_UNAVAILABLE };
  try {
    const result = await signIn("credentials", { username, password, redirect: false });
    if (!result || result.error) return { error: "Could not sign in with those details." };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("loginAction failed", error);
    return { error: DATABASE_UNAVAILABLE };
  }
  redirect(safeFrom);
}

export async function signupAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const safeFrom = safePath(String(formData.get("from") ?? "/me/profile"));
  if (!USERNAME_RE.test(username)) return { error: "Username must be 3–24 letters, numbers, or underscores." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!isDatabaseConfigured()) return { error: DATABASE_UNAVAILABLE };
  try {
    const taken = await prisma.user.findUnique({ where: { username } });
    if (taken) return { error: "That username is taken." };
    await prisma.user.create({
      data: {
        username,
        passwordHash: await hash(password, 10),
        photoUrl: suggestedAvatar(username),
        profileStatus: "draft",
      },
    });
    const result = await signIn("credentials", { username, password, redirect: false });
    if (!result || result.error) return { error: "Account created, but sign-in failed. Try logging in." };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) return { error: "Account created, but sign-in failed. Try logging in." };
    console.error("signupAction failed", error);
    return { error: DATABASE_UNAVAILABLE };
  }
  redirect(safeFrom);
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(ACTING_COOKIE);
  const { signOut } = await import("@/auth");
  await signOut({ redirectTo: "/" });
}

export async function setActingUserAction(formData: FormData): Promise<void> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?from=/me");
  if (!isAdminUsername(sessionUser.username)) redirect("/me/profile");
  const userId = String(formData.get("userId") ?? "");
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) redirect("/me/profile");
  const jar = await cookies();
  jar.set(ACTING_COOKIE, target.id, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/me");
  revalidatePath("/me/profile");
  revalidatePath("/me/drafts");
  redirect("/me/profile");
}
