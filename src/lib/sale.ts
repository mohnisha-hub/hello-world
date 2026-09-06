export type SaleType = "buy" | "bid";

export function isBidListing(saleType?: string | null) {
  return saleType === "bid";
}

export function listingAmountCents(perfume: {
  saleType?: string | null;
  priceCents: number;
  minBidCents?: number | null;
}) {
  if (isBidListing(perfume.saleType) && perfume.minBidCents != null) return perfume.minBidCents;
  return perfume.priceCents;
}
