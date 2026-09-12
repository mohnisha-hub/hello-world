export function configuredDatabaseUrl() {
  // Vercel Storage supplies connection settings to server functions at
  // runtime. Indexed lookup keeps Next's action compiler from snapshotting a
  // missing build-time value into the server-action bundle.
  const environment = process.env as Record<string, string | undefined>;
  const url = ["ATELIER_DATABASE_URL", "DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING"]
    .map((key) => environment[key])
    .find(Boolean);
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
