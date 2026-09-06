export function configuredDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (!url || url.startsWith("file:")) return null;
  if (url.includes("127.0.0.1") || url.includes("localhost")) return null;
  if (!url.startsWith("postgres")) return null;
  return url;
}

export function isDatabaseConfigured() {
  return Boolean(configuredDatabaseUrl());
}

export const DATABASE_UNAVAILABLE =
  "Database is not connected. Add Neon Postgres in Vercel Storage and set DATABASE_URL to a postgresql:// URL, then redeploy.";
