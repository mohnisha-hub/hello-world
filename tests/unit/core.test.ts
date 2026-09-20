import { describe, expect, it, vi } from "vitest";
import { isCommunityVisiblePerfume, isPublicProfile } from "@/lib/visibility";
import { dollarsToCents, formatMoney } from "@/lib/money";
import { perfumeCompletion } from "@/lib/completion";
import { isBidListing, listingAmountCents } from "@/lib/sale";
import { fragranceLabel, searchFragranceCatalog } from "@/lib/fragrance-catalog";
import { isAdminUsername } from "@/lib/admin";
import { fetchFragranticaNotes, validateFragranticaPerfumeUrl } from "@/lib/fragrantica";

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

describe("Fragrantica imports", () => {
  it("only permits secure Fragrantica perfume URLs", () => {
    expect(validateFragranticaPerfumeUrl("https://www.fragrantica.com/perfume/Giorgio-Armani/Si-18453.html")?.hostname).toBe("www.fragrantica.com");
    expect(validateFragranticaPerfumeUrl("http://www.fragrantica.com/perfume/Giorgio-Armani/Si-18453.html")).toBeNull();
    expect(validateFragranticaPerfumeUrl("https://www.fragrantica.com/login")).toBeNull();
    expect(validateFragranticaPerfumeUrl("https://fragrantica.com.evil.example/perfume/Giorgio-Armani/Si-18453.html")).toBeNull();
  });

  it("fills Sì from the local catalogue immediately", async () => {
    const originalFetch = globalThis.fetch;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("blocked", { status: 403, headers: { "content-type": "text/html" } })));
    try {
      const result = await fetchFragranticaNotes("https://www.fragrantica.com/perfume/Giorgio-Armani/Si-18453.html");
      expect(result).toMatchObject({
        brand: "Giorgio Armani",
        name: "Sì Eau de Parfum",
        source: "atelier-catalogue",
      });
      expect(result.top).toContain("Cassis (Blackcurrant)");
      expect(result.middle).toContain("May Rose");
      expect(result.base).toContain("Vanilla");
      expect(globalThis.fetch).not.toHaveBeenCalled();
    } finally {
      vi.stubGlobal("fetch", originalFetch);
    }
  });
});

describe("admin", () => {
  it("only matches ADMIN_USERNAME exactly", () => {
    const previous = process.env.ADMIN_USERNAME;
    process.env.ADMIN_USERNAME = "mohnisha";
    expect(isAdminUsername("mohnisha")).toBe(true);
    expect(isAdminUsername("aarav_perfumes")).toBe(false);
    expect(isAdminUsername(undefined)).toBe(false);
    process.env.ADMIN_USERNAME = previous;
  });
});
