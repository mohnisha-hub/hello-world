import type { Collection, Perfume } from "@prisma/client";
import { compareByPublish } from "@/lib/listings";

export type FeedItem =
  | { kind: "collection"; collection: Collection; perfumeCount: number; publishedAt: Date | null; createdAt: Date; sold: boolean }
  | { kind: "perfume"; perfume: Perfume; publishedAt: Date | null; createdAt: Date; sold: boolean };

export function buildFeed(
  collections: (Collection & { perfumes: Perfume[] })[],
  standalone: Perfume[],
  dir: "asc" | "desc",
) {
  const items: FeedItem[] = [
    ...collections.map((c) => ({
      kind: "collection" as const,
      collection: c,
      perfumeCount: c.perfumes.filter((p) => p.status === "published" || p.status === "sold").length,
      publishedAt: c.publishedAt,
      createdAt: c.createdAt,
      sold: c.status === "sold",
    })),
    ...standalone.map((p) => ({
      kind: "perfume" as const,
      perfume: p,
      publishedAt: p.publishedAt,
      createdAt: p.createdAt,
      sold: p.status === "sold",
    })),
  ];
  const live = items.filter((i) => !i.sold);
  const sold = items.filter((i) => i.sold);
  const sortFn = (a: FeedItem, b: FeedItem) =>
    compareByPublish(a.publishedAt, a.createdAt, b.publishedAt, b.createdAt, dir);
  live.sort(sortFn);
  sold.sort(sortFn);
  return { live, sold };
}
