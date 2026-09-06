import { PrismaClient } from "@prisma/client";
import { configuredDatabaseUrl } from "@/lib/db";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const FALLBACK = "postgresql://prisma:prisma@127.0.0.1:5432/prisma";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: configuredDatabaseUrl() ?? FALLBACK } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
