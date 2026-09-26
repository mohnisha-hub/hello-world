"use server";

import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { suggestedAvatar } from "@/lib/photos";
import { isAtelierAvatar } from "@/lib/avatars";
import { DATABASE_UNAVAILABLE, isDatabaseConfigured } from "@/lib/db";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { takeRequestLimit } from "@/lib/rate-limit";
import { recordUsage } from "@/lib/metrics";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*[0-9]).{8,}$/;

function normalizedUsername(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

function safePath(from: string) {
  return from.startsWith("/") && !from.startsWith("//") ? from : "/me/profile";
}

export async function loginAction(formData: FormData) {
  const username = normalizedUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");
  const safeFrom = safePath(String(formData.get("from") ?? "/me/profile"));
  if (!username || !password) return { error: "Username and password are required." };
  if (!(await takeRequestLimit("login", 12, 15 * 60_000))) return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
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

export async function googleLoginAction(formData: FormData) {
  // The button is only rendered when both credentials are configured. Keep
  // this guard for direct form submissions without returning a value: React
  // server form actions must resolve to void.
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !isDatabaseConfigured()) return;
  if (!(await takeRequestLimit("google-login", 12, 15 * 60_000))) return;
  const safeFrom = safePath(String(formData.get("from") ?? "/me/profile"));
  await signIn("google", { redirectTo: `/onboarding?from=${encodeURIComponent(safeFrom)}` });
}

export async function signupAction(formData: FormData) {
  const username = normalizedUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");
  const selectedAvatar = String(formData.get("avatarUrl") ?? "");
  const safeFrom = safePath(String(formData.get("from") ?? "/me/profile"));
  if (!USERNAME_RE.test(username)) return { error: "Username must be 3–24 letters, numbers, or underscores." };
  if (!PASSWORD_RE.test(password)) return { error: "Password must be 8+ characters and include a letter and a number." };
  if (!(await takeRequestLimit("signup", 5, 60 * 60_000))) return { error: "Too many new accounts from this connection. Please try again in an hour." };
  if (!isDatabaseConfigured()) return { error: DATABASE_UNAVAILABLE };
  try {
    const taken = await prisma.user.findUnique({ where: { username } });
    if (taken) return { error: "That username is taken." };
    await prisma.user.create({
      data: {
        username,
        passwordHash: await hash(password, 10),
        photoUrl: isAtelierAvatar(selectedAvatar) ? selectedAvatar : suggestedAvatar(username),
        profileStatus: "draft",
      },
    });
    recordUsage("account_created", { method: "password" });
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
  const { signOut } = await import("@/auth");
  await signOut({ redirectTo: "/" });
}
