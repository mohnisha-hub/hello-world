/**
 * Product-level metrics intentionally contain no usernames, email addresses,
 * listing names, message text, or other personal data. They are emitted as
 * structured Vercel runtime logs, making early usage patterns searchable
 * without turning Atelier into a behavioural-data warehouse.
 */
export type UsageEvent =
  | "account_created"
  | "profile_published"
  | "collection_published"
  | "perfume_published"
  | "shelf_added"
  | "bulk_imported"
  | "wishlist_added"
  | "bid_placed"
  | "buy_requested"
  | "message_sent";

export function recordUsage(event: UsageEvent, properties: Record<string, string | number | boolean | null> = {}) {
  console.log(JSON.stringify({
    level: "info",
    source: "atelier.usage",
    event,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    at: new Date().toISOString(),
    ...properties,
  }));
}
