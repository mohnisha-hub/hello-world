import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { isDatabaseConfigured } from "@/lib/db";

function usernameSeed(value: string) {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  return (cleaned || "collector").slice(0, 18);
}

async function usernameForGoogleUser(name: string | null | undefined, email: string) {
  const seed = usernameSeed(name || email.split("@")[0]);
  for (let index = 0; index < 100; index += 1) {
    const suffix = index ? `_${index + 1}` : "";
    const username = `${seed.slice(0, 24 - suffix.length)}${suffix}`;
    if (!(await prisma.user.findUnique({ where: { username }, select: { id: true } }))) return username;
  }
  return `collector_${crypto.randomUUID().slice(0, 8)}`;
}

async function ensureGoogleUser(googleId: string, name: string | null | undefined, email: string, image?: string | null) {
  const existing = await prisma.user.findUnique({ where: { googleId } });
  if (existing) return existing;

  // Retry on the small chance two new accounts choose the same username.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.user.create({
        data: {
          googleId,
          email: email.toLowerCase(),
          username: await usernameForGoogleUser(name, email),
          passwordHash: null,
          photoUrl: image ?? null,
          profileStatus: "draft",
        },
      });
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  throw new Error("Unable to create Google account");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
      : []),
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!isDatabaseConfigured()) return null;
        try {
          const username = String(credentials?.username ?? "").trim();
          const password = String(credentials?.password ?? "");
          if (!username || !password) return null;
          if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) return null;

          const user = await prisma.user.findUnique({ where: { username } });
          if (!user?.passwordHash) return null;
          const ok = await compare(password, user.passwordHash);
          if (!ok) return null;
          return { id: user.id, name: user.username, username: user.username };
        } catch (error) {
          console.error("authorize failed", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!isDatabaseConfigured() || !account.providerAccountId || !user.email) return false;
      try {
        await ensureGoogleUser(account.providerAccountId, user.name, user.email, user.image);
        return true;
      } catch (error) {
        console.error("Google account creation failed", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google") {
        const dbUser = await prisma.user.findUnique({ where: { googleId: account.providerAccountId } });
        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
        }
      } else if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
      }
      return token;
    },
  },
});
