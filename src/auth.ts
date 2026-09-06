import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { isDatabaseConfigured } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
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
          if (!user) return null;
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
});
