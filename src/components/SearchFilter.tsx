"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatMoney, formatPricePerMl } from "@/lib/money";
import { listingAmountCents, isBidListing } from "@/lib/sale";
import { searchPerfumesAndGroupUsers, type SearchableCollection, type SearchablePerfume } from "@/lib/search";

const POPULAR_NOTES = ["Vanilla", "Oud", "Santal", "Tobacco", "Saffron", "Cognac", "Honey", "Fig", "Pineapple", "Amber"];
const CONDITIONS = ["all", "retail", "tester", "partial", "decant"] as const;
type Condition = (typeof CONDITIONS)[number];
type PriceBand = "all" | "under-3000" | "3000-10000" | "10000-25000" | "25000-plus";
type SizeBand = "all" | "under-10" | "10-30" | "30-75" | "75-plus";
type Sort = "newest" | "price-low" | "price-high" | "per-ml-low" | "per-ml-high";
const PAGE_SIZE = 12;

export function SearchFilter({ perfumes, collections = [], allUsers, ratingMap }: { perfumes: SearchablePerfume[]; collections?: SearchableCollection[]; allUsers: SearchablePerfume["owner"][]; ratingMap: Record<string, { average: number; count: number } | null> }) {
  const searchParams = useSearchParams();
  const requestedQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(requestedQuery);
  const [condition, setCondition] = useState<Condition>("all");
  const [listing, setListing] = useState<"all" | "buy" | "bid">("all");
  const [brand, setBrand] = useState("all");
  const [location, setLocation] = useState("all");
  const [size, setSize] = useState<SizeBand>("all");
  const [price, setPrice] = useState<PriceBand>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [view, setView] = useState<"list" | "cards">("list");
  const [page, setPage] = useState(1);
  useEffect(() => { setQuery(requestedQuery); }, [requestedQuery]);
  const matchedUsers = useMemo(() => {
    const term = query.trim().toLowerCase().replace(/^@/, "");
    if (!term) return [];
    return allUsers.filter((user) => user.username.toLowerCase().includes(term)).slice(0, 6);
  }, [allUsers, query]);
  const brands = useMemo(() => Array.from(new Set(perfumes.map((p) => p.brand).filter((value): value is string => Boolean(value)))).sort(), [perfumes]);
  const locations = useMemo(() => Array.from(new Set(perfumes.map((p) => p.owner.location).filter((value): value is string => Boolean(value)))).sort(), [perfumes]);
  const matchedPerfumes = useMemo(() => {
    const source = query.trim() ? searchPerfumesAndGroupUsers(perfumes, query, ratingMap).flatMap(({ matchingPerfumes }) => matchingPerfumes) : perfumes;
    const unique = Array.from(new Map(source.map((p) => [p.id, p])).values());
    const inPriceBand = (amount: number) => price === "all" || (price === "under-3000" && amount < 300000) || (price === "3000-10000" && amount >= 300000 && amount < 1000000) || (price === "10000-25000" && amount >= 1000000 && amount < 2500000) || (price === "25000-plus" && amount >= 2500000);
    const inSizeBand = (ml: number | null) => size === "all" || (ml != null && ((size === "under-10" && ml < 10) || (size === "10-30" && ml >= 10 && ml <= 30) || (size === "30-75" && ml > 30 && ml <= 75) || (size === "75-plus" && ml > 75)));
    const filtered = unique.filter((p) => {
      const amount = listingAmountCents(p);
      return (condition === "all" || p.kind === condition) && (listing === "all" || (listing === "bid" ? isBidListing(p.saleType) : !isBidListing(p.saleType))) && (brand === "all" || p.brand === brand) && (location === "all" || p.owner.location === location) && inSizeBand(p.ml) && inPriceBand(amount);
    });
    return filtered.sort((a, b) => {
      const aAmount = listingAmountCents(a); const bAmount = listingAmountCents(b);
      const aPerMl = a.ml ? aAmount / a.ml : Number.POSITIVE_INFINITY; const bPerMl = b.ml ? bAmount / b.ml : Number.POSITIVE_INFINITY;
      if (sort === "price-low") return aAmount - bAmount;
      if (sort === "price-high") return bAmount - aAmount;
      if (sort === "per-ml-low") return aPerMl - bPerMl;
      if (sort === "per-ml-high") return bPerMl - aPerMl;
      return 0;
    });
  }, [brand, condition, listing, location, perfumes, price, query, ratingMap, size, sort]);
  useEffect(() => { setPage(1); }, [brand, condition, listing, location, price, query, size, sort]);
  const pageCount = Math.max(1, Math.ceil(matchedPerfumes.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visiblePerfumes = matchedPerfumes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = Boolean(query || condition !== "all" || listing !== "all" || brand !== "all" || location !== "all" || size !== "all" || price !== "all" || sort !== "newest");
  const clear = () => { setQuery(""); setCondition("all"); setListing("all"); setBrand("all"); setLocation("all"); setSize("all"); setPrice("all"); setSort("newest"); };

  return <div className="search-marketplace">
    <div className="search-bar-shell">
      <div className="search-input-wrap"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by brand, perfume, note, or @username" aria-label="Search by brand, perfume, note, or username" />{query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button> : null}</div>
      <div className="search-note-row"><span className="eyebrow">Popular notes</span>{POPULAR_NOTES.map((note) => <button type="button" key={note} className={query.toLowerCase() === note.toLowerCase() ? "is-active" : ""} onClick={() => setQuery(query.toLowerCase() === note.toLowerCase() ? "" : note)}>{note}</button>)}</div>
      <div className="search-filter-grid" aria-label="Marketplace filters">
        <SearchSelect label="Listing" value={listing} onChange={(value) => setListing(value as typeof listing)}><option value="all">All listings</option><option value="buy">Buy now</option><option value="bid">Accepting bids</option></SearchSelect>
        <SearchSelect label="Type" value={condition} onChange={(value) => setCondition(value as Condition)}>{CONDITIONS.map((o) => <option key={o} value={o}>{o === "all" ? "Any type" : o[0].toUpperCase() + o.slice(1)}</option>)}</SearchSelect>
        <SearchSelect label="Size" value={size} onChange={(value) => setSize(value as SizeBand)}><option value="all">Any size</option><option value="under-10">Under 10 ml</option><option value="10-30">10–30 ml</option><option value="30-75">30–75 ml</option><option value="75-plus">75+ ml</option></SearchSelect>
        <SearchSelect label="Price" value={price} onChange={(value) => setPrice(value as PriceBand)}><option value="all">Any price</option><option value="under-3000">Under ₹3,000</option><option value="3000-10000">₹3,000–10,000</option><option value="10000-25000">₹10,000–25,000</option><option value="25000-plus">₹25,000+</option></SearchSelect>
        <SearchSelect label="Brand" value={brand} onChange={setBrand}><option value="all">All brands</option>{brands.map((o) => <option key={o} value={o}>{o}</option>)}</SearchSelect>
        <SearchSelect label="Location" value={location} onChange={setLocation}><option value="all">Anywhere</option>{locations.map((o) => <option key={o} value={o}>{o}</option>)}</SearchSelect>
      </div>
    </div>
    {matchedUsers.length ? <section className="collector-search-results" aria-label="Matching collectors"><div><p className="eyebrow">COLLECTORS</p><h2>People matching “{query.trim()}”</h2></div><div className="collector-search-grid">{matchedUsers.map((user) => <Link key={user.id} href={`/u/${user.username}`}><span className="collector-search-avatar" aria-hidden="true">{user.username.slice(0, 1).toUpperCase()}</span><span><strong>@{user.username}</strong><small>{user.location || "Somewhere scented"}</small></span><b>View profile →</b></Link>)}</div></section> : null}
    {!hasFilters && collections.length ? <details className="search-collectors search-collections-collapsible"><summary>Live collections <span>({collections.length})</span></summary><div className="search-collection-group search-collection-strip">{collections.slice(0, 6).map((c) => <Link key={c.id} href={`/u/${c.owner.username}/c/${c.id}`}><span>{c.name}</span><small>@{c.owner.username} · {c.perfumeCount} perfumes</small><b>↗</b></Link>)}</div></details> : null}
    <section className="search-results">
      <div className="search-results-heading"><div><p className="eyebrow">MARKETPLACE</p><h2>{matchedPerfumes.length} listing{matchedPerfumes.length === 1 ? "" : "s"}</h2></div><div className="search-result-tools"><label className="search-sort">Sort<select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="per-ml-low">Price/ml: low to high</option><option value="per-ml-high">Price/ml: high to low</option></select></label><div className="search-view-toggle"><button type="button" className={view === "list" ? "is-active" : ""} onClick={() => setView("list")}>List</button><button type="button" className={view === "cards" ? "is-active" : ""} onClick={() => setView("cards")}>Cards</button></div></div></div>
      {hasFilters ? <button type="button" className="search-clear" onClick={clear}>Clear filters</button> : null}
      {!matchedPerfumes.length ? <p className="search-empty">No perfume listings matched. Try a perfume, a house, a note, or broaden your filters.</p> : null}
      <div className={view === "list" ? "search-listings" : "search-card-grid"}>{visiblePerfumes.map((p) => <SearchListing key={p.id} perfume={p} card={view === "cards"} />)}</div>
      <ListingPagination page={currentPage} pageCount={pageCount} count={matchedPerfumes.length} onPageChange={setPage} />
      {!hasFilters ? <details className="search-collectors"><summary>Browse collectors <span>({allUsers.length})</span></summary><div>{allUsers.map((u) => <Link key={u.id} href={`/u/${u.username}`}>@{u.username}<small>{u.location || "Somewhere scented"}</small></Link>)}</div></details> : null}
    </section>
  </div>;
}

function ListingPagination({ page, pageCount, count, onPageChange }: { page: number; pageCount: number; count: number; onPageChange: (page: number) => void }) {
  if (pageCount < 2) return null;
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, count);
  return <nav className="listing-pagination" aria-label="Listing pages"><span>{start}–{end} of {count}</span><div><button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1}>Previous</button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button key={number} type="button" className={number === page ? "is-active" : ""} onClick={() => onPageChange(number)} aria-current={number === page ? "page" : undefined}>{number}</button>)}<button type="button" onClick={() => onPageChange(page + 1)} disabled={page === pageCount}>Next</button></div></nav>;
}

function SearchSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) { return <label className="search-select"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>; }
function SearchListing({ perfume, card }: { perfume: SearchablePerfume; card: boolean }) {
  const bid = isBidListing(perfume.saleType); const amount = listingAmountCents(perfume);
  return <Link href={`/p/${perfume.id}`} className={card ? "search-listing search-listing-card" : "search-listing"}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={perfume.imageUrl || "/atelier/atelier-perfume-cover.png"} alt="" />
    <span className="search-listing-copy"><small>{perfume.brand || "Perfume"}</small><strong>{perfume.name}</strong><em>@{perfume.owner.username}{perfume.owner.location ? ` · ${perfume.owner.location}` : ""}</em></span>
    <span className="search-listing-details">{perfume.kind ? `${perfume.kind} · ` : ""}{perfume.ml ? `${perfume.ml} ml · ${formatPricePerMl(amount, perfume.ml)}` : ""}</span><span className="search-listing-price">{bid ? `From ${formatMoney(amount)}` : formatMoney(amount)}</span><span className="listing-live-dot" aria-label="Available" title="Available" />
  </Link>;
}
