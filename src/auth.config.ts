import type { NextAuthConfig } from "next-auth";

function authSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  console.warn("AUTH_SECRET is not set. Using a fallback so the site can boot; set AUTH_SECRET on Vercel.");
  return "atelier-fallback-auth-secret-set-AUTH_SECRET-on-vercel";
}

export const authConfig = {
  trustHost: true,
  secret: authSecret(),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
