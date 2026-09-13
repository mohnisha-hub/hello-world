"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { listingAmountCents, isBidListing } from "@/lib/sale";
import { searchCollections, searchPerfumesAndGroupUsers, type SearchableCollection, type SearchablePerfume } from "@/lib/search";

const POPULAR_NOTES = ["Vanilla", "Oud", "Santal", "Tobacco", "Saffron", "Cognac", "Honey", "Fig", "Pineapple", "Amber"];
const FORMATS = ["all", "retail", "tester", "partial", "decant"] as const;
type Format = (typeof FORMATS)[number];

export function SearchFilter({ perfumes, collections = [], allUsers, ratingMap }: { perfumes: SearchablePerfume[]; collections?: SearchableCollection[]; allUsers: SearchablePerfume["owner"][]; ratingMap: Record<string, { average: number; count: number } | null> }) {
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<Format>("all");
  const [listing, setListing] = useState<"all" | "buy" | "bid">("all");
  const [view, setView] = useState<"list" | "cards">("list");
  const active = Boolean(query.trim() || format !== "all" || listing !== "all");
  const matchedPerfumes = useMemo(() => {
    const source = query.trim() ? searchPerfumesAndGroupUsers(perfumes, query, ratingMap).flatMap(({ matchingPerfumes }) => matchingPerfumes) : perfumes;
    return Array.from(new Map(source.map((perfume) => [perfume.id, perfume])).values()).filter((perfume) =>
      (format === "all" || perfume.kind === format) && (listing === "all" || (listing === "bid" ? isBidListing(perfume.saleType) : !isBidListing(perfume.saleType))),
    );
  }, [format, listing, perfumes, query, ratingMap]);
  const matchedCollections = useMemo(() => query.trim() ? searchCollections(collections, query) : [], [collections, query]);
  const brands = useMemo(() => Array.from(new Set(matchedPerfumes.map((perfume) => perfume.brand).filter(Boolean))).slice(0, 8) as string[], [matchedPerfumes]);

  return <div className="search-marketplace">
    <div className="search-bar-shell">
      <div className="search-input-wrap"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search perfumes, brands, notes, or collections" aria-label="Search Atelier" />{query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button> : null}</div>
      <div className="search-filter-row" aria-label="Listing filters"><span>Format</span>{FORMATS.map((option) => <button type="button" key={option} className={format === option ? "is-active" : ""} onClick={() => setFormat(option)}>{option === "all" ? "All" : option}</button>)}<i /><button type="button" className={listing === "all" ? "is-active" : ""} onClick={() => setListing("all")}>All listings</button><button type="button" className={listing === "buy" ? "is-active" : ""} onClick={() => setListing("buy")}>Buy now</button><button type="button" className={listing === "bid" ? "is-active" : ""} onClick={() => setListing("bid")}>Open to bids</button></div>
      <div className="search-note-row"><span className="eyebrow">Popular notes</span>{POPULAR_NOTES.map((note) => <button type="button" key={note} className={query.toLowerCase() === note.toLowerCase() ? "is-active" : ""} onClick={() => setQuery(query.toLowerCase() === note.toLowerCase() ? "" : note)}>{note}</button>)}</div>
    </div>
    {active ? <section className="search-results">
      <div className="search-results-heading"><div><p className="eyebrow">DISCOVERY</p><h2>{matchedPerfumes.length} listing{matchedPerfumes.length === 1 ? "" : "s"}</h2></div><div className="search-view-toggle"><button type="button" className={view === "list" ? "is-active" : ""} onClick={() => setView("list")}>List</button><button type="button" className={view === "cards" ? "is-active" : ""} onClick={() => setView("cards")}>Cards</button></div></div>
      {brands.length ? <div className="search-brand-row"><span>Brands</span>{brands.map((brand) => <button key={brand} type="button" onClick={() => setQuery(brand)}>{brand}</button>)}</div> : null}
      {matchedCollections.length ? <div className="search-collection-group"><p className="eyebrow">COLLECTIONS</p>{matchedCollections.map((collection) => <Link key={collection.id} href={`/u/${collection.owner.username}/c/${collection.id}`}><span>{collection.name}</span><small>@{collection.owner.username} · {collection.perfumeCount} perfumes</small><b>↗</b></Link>)}</div> : null}
      {!matchedPerfumes.length && !matchedCollections.length ? <p className="search-empty">Nothing matched that search. Try a perfume, a house, a note, or remove a filter.</p> : null}
      <div className={view === "list" ? "search-listings" : "search-card-grid"}>{matchedPerfumes.map((perfume) => <SearchListing key={perfume.id} perfume={perfume} card={view === "cards"} />)}</div>
    </section> : <details className="search-collectors"><summary>Browse collectors <span>({allUsers.length})</span></summary><div>{allUsers.map((user) => <Link key={user.id} href={`/u/${user.username}`}>@{user.username}<small>{user.location || "Somewhere scented"}</small></Link>)}</div></details>}
  </div>;
}

function SearchListing({ perfume, card }: { perfume: SearchablePerfume; card: boolean }) {
  const bid = isBidListing(perfume.saleType);
  const amount = listingAmountCents(perfume);
  return <Link href={`/p/${perfume.id}`} className={card ? "search-listing search-listing-card" : "search-listing"}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={perfume.imageUrl || "/atelier/atelier-perfume-cover.png"} alt="" />
    <span className="search-listing-copy"><small>{perfume.brand || "Perfume"}</small><strong>{perfume.name}</strong><em>@{perfume.owner.username}</em></span>
    <span className="search-listing-details">{perfume.kind ? `${perfume.kind} · ` : ""}{perfume.ml ? `${perfume.ml} ml` : ""}</span><span className="search-listing-price">{bid ? `From ${formatMoney(amount)}` : formatMoney(amount)}</span><span className="listing-live-dot" aria-label="Available" title="Available" />
  </Link>;
}
