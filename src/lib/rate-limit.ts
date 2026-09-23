import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Limit = { scope: string; subject: string; limit: number; windowMs: number };

function fingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 48);
}

async function requestSubject() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-vercel-forwarded-for") || requestHeaders.get("x-forwarded-for") || "unknown";
  return `ip:${fingerprint(forwarded.split(",")[0].trim())}`;
}

async function take(limit: Limit) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + limit.windowMs);
  const key = `${limit.scope}:${fingerprint(limit.subject)}`;
  const rows = await prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "updatedAt")
    VALUES (${key}, 1, ${resetAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${resetAt}
        ELSE "RateLimitBucket"."resetAt"
      END,
      "updatedAt" = ${now}
    RETURNING "count"
  `);
  return (rows[0]?.count ?? limit.limit + 1) <= limit.limit;
}

/** Rate limits unauthenticated requests by the Vercel-provided client IP. */
export async function takeRequestLimit(scope: string, limit: number, windowMs: number) {
  return take({ scope, subject: await requestSubject(), limit, windowMs });
}

/** Rate limits authenticated mutations without penalising other collectors. */
export async function takeUserLimit(scope: string, userId: string, limit: number, windowMs: number) {
  return take({ scope, subject: `user:${userId}`, limit, windowMs });
}

export async function clearExpiredRateLimits() {
  await prisma.rateLimitBucket.deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60_000) } } });
}
