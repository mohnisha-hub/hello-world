export function configuredDatabaseUrl() {
  // Vercel Storage supplies connection settings to server functions at
  // runtime. Indexed lookup keeps Next's action compiler from snapshotting a
  // missing build-time value into the server-action bundle.
  const environment = process.env as Record<string, string | undefined>;
  const candidates = ["ATELIERNEW_DATABASE_URL", "ATELIER_DATABASE_URL", "DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING"]
    .map((key) => environment[key]);
  return candidates.find((url): url is string => typeof url === "string" && !url.startsWith("file:") && !url.includes("127.0.0.1") && !url.includes("localhost") && url.startsWith("postgres")) ?? null;
}

export function isDatabaseConfigured() {
  return Boolean(configuredDatabaseUrl());
}

export const DATABASE_UNAVAILABLE =
  "Database is not connected. Add Neon Postgres in Vercel Storage and set DATABASE_URL to a postgresql:// URL, then redeploy.";
