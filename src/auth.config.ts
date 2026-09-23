import type { NextAuthConfig } from "next-auth";

function authSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;

  // A predictable signing key turns a configuration mistake into forged
  // sessions. Deployed environments must fail closed instead.
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters.");
  }
  return "development-only-auth-secret-do-not-use-in-production";
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
