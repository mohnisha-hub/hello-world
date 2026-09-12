import { isBidListing } from "@/lib/sale";

export function SaleBadge({ saleType }: { saleType?: string | null }) {
  const bid = isBidListing(saleType);
  return <span className={`badge ${bid ? "badge-bid" : "badge-buy"}`}>{bid ? "Accepting bids" : "Buy now"}</span>;
}
