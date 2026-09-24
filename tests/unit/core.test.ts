import { describe, expect, it } from "vitest";
import { isCommunityVisiblePerfume, isPublicProfile } from "@/lib/visibility";
import { dollarsToCents, formatMoney } from "@/lib/money";
import { perfumeCompletion } from "@/lib/completion";
import { isBidListing, listingAmountCents } from "@/lib/sale";
import { fragranceLabel, searchFragranceCatalog } from "@/lib/fragrance-catalog";
import { atelierBadges } from "@/lib/badges";

describe("visibility", () => {
  it("hides listings when the profile is draft", () => {
    expect(
      isCommunityVisiblePerfume({
        status: "published",
        owner: { profileStatus: "draft" },
        collection: { status: "published" },
      }),
    ).toBe(false);
  });

  it("hides nested perfumes when the collection is draft", () => {
    expect(
      isCommunityVisiblePerfume({
        status: "published",
        owner: { profileStatus: "published" },
        collection: { status: "draft" },
      }),
    ).toBe(false);
  });

  it("shows published standalone perfumes", () => {
    expect(
      isCommunityVisiblePerfume({
        status: "published",
        owner: { profileStatus: "published" },
        collection: null,
      }),
    ).toBe(true);
  });

  it("treats only published profiles as public", () => {
    expect(isPublicProfile("published")).toBe(true);
    expect(isPublicProfile("draft")).toBe(false);
  });
});

describe("money", () => {
  it("converts rupees to paise", () => {
    expect(dollarsToCents("12.50")).toBe(1250);
    expect(dollarsToCents("-1")).toBe(null);
  });

  it("formats INR", () => {
    expect(formatMoney(18500)).toMatch(/185/);
    expect(formatMoney(18500)).not.toMatch(/\$/);
  });
});

describe("listing sale type", () => {
  it("uses min bid for bid listings", () => {
    expect(isBidListing("bid")).toBe(true);
    expect(listingAmountCents({ saleType: "buy", priceCents: 1000, minBidCents: 200 })).toBe(1000);
    expect(listingAmountCents({ saleType: "bid", priceCents: 1000, minBidCents: 200 })).toBe(200);
  });
});

describe("perfume completion", () => {
  it("starts at 0% with no optional details", () => {
    expect(perfumeCompletion({}).percent).toBe(0);
    expect(perfumeCompletion({ shippingIncluded: false }).percent).toBe(0);
  });
});

describe("fragrance catalog", () => {
  it("suggests bottles as the name is typed", () => {
    const hits = searchFragranceCatalog("baccarat");
    expect(hits.length).toBeGreaterThan(0);
    expect(fragranceLabel(hits[0])).toMatch(/Baccarat/i);
    expect(hits[0].top.length).toBeGreaterThan(0);
    expect(hits[0].rating).toBeGreaterThan(0);
  });

  it("returns nothing for a one-letter query", () => {
    expect(searchFragranceCatalog("b")).toEqual([]);
  });
});


describe("Atelier badges", () => {
  it("awards shelf and marketplace milestones at their intended thresholds", () => {
    const badges = atelierBadges({ shelf: 20, brands: 10, showcasePicks: 5, wishlist: 20, marketplace: 11, discoveries: 10, heartsGiven: 1, buyerRatings: 20, buyerRatingStars: 4.5 });
    expect(badges.filter((badge) => badge.earned)).toHaveLength(badges.length);
  });

  it("keeps the next milestone actionable", () => {
    const badges = atelierBadges({ shelf: 1, brands: 1, showcasePicks: 0, wishlist: 0, marketplace: 0, discoveries: 0, heartsGiven: 0, buyerRatings: 0, buyerRatingStars: 0 });
    expect(badges.find((badge) => !badge.earned)).toMatchObject({ name: "Curator", progress: "1/5 on shelf" });
  });

  it("awards seller-trust badges only at their stated rating thresholds", () => {
    const base = { shelf: 0, brands: 0, showcasePicks: 0, wishlist: 0, marketplace: 0, discoveries: 0, heartsGiven: 0 };
    const oneRating = atelierBadges({ ...base, buyerRatings: 1, buyerRatingStars: 4 });
    expect(oneRating.find((badge) => badge.id === "rated")?.earned).toBe(true);
    expect(oneRating.find((badge) => badge.id === "fan-favourite")?.earned).toBe(false);

    const fanFavourite = atelierBadges({ ...base, buyerRatings: 5, buyerRatingStars: 4.1 });
    expect(fanFavourite.find((badge) => badge.id === "fan-favourite")?.earned).toBe(true);
    expect(fanFavourite.find((badge) => badge.id === "insider")?.earned).toBe(false);

    const insider = atelierBadges({ ...base, buyerRatings: 20, buyerRatingStars: 4.1 });
    expect(insider.find((badge) => badge.id === "insider")?.earned).toBe(true);
  });
});
