"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { addCatalogPerfumeToShelfAction } from "@/actions/listings";
import { toggleWishlistAction } from "@/actions/wishlist";
import { FRAGRANCE_CATALOG, fragranceCatalogKey, type FragranceEntry } from "@/lib/fragrance-catalog";

const STARTER_NOTES = ["Vanilla", "Oud", "Tobacco", "Saffron", "Rose", "Jasmine", "Bergamot", "Sandalwood", "Musk", "Fig", "Coffee", "Amber"];

type LiveListing = { brand: string | null; name: string };

export function PerfumeFinder({ signedIn, liveListings }: { signedIn: boolean; liveListings: LiveListing[] }) {
  const [notes, setNotes] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [visibleResults, setVisibleResults] = useState(6);
  const results = useMemo(() => recommend(FRAGRANCE_CATALOG, notes, query), [notes, query]);
  useEffect(() => setVisibleResults(6), [notes, query]);
  const toggle = (note: string) => setNotes((current) => current.includes(note) ? current.filter((value) => value !== note) : [...current, note]);
  return <section className="perfume-finder explore-zone">
    <div className="explore-zone-heading"><div><p className="eyebrow">YOUR SCENT JOURNEY</p><h2>Perfume explorer</h2><p>Choose notes you gravitate toward and discover perfumes from Atelier&apos;s saved fragrance catalogue.</p></div></div>
    <input className="perfume-finder-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a perfume or house" aria-label="Search perfume explorer" />
    <div className="perfume-note-picker" aria-label="Preferred notes">{STARTER_NOTES.map((note) => <button key={note} type="button" onClick={() => toggle(note)} className={notes.includes(note) ? "is-active" : ""}>{note}</button>)}</div>
    <div className="perfume-finder-results">{results.slice(0, visibleResults).map((entry) => <FinderResult key={fragranceCatalogKey(entry)} entry={entry} signedIn={signedIn} hasLiveListing={hasLiveListing(entry, liveListings)} />)}</div>
    {results.length > visibleResults ? <button type="button" className="perfume-finder-more" onClick={() => setVisibleResults((current) => current + 6)}>Show more perfumes <span>({results.length - visibleResults} more)</span></button> : null}
  </section>;
}

function FinderResult({ entry, signedIn, hasLiveListing }: { entry: FragranceEntry; signedIn: boolean; hasLiveListing: boolean }) {
  const key = fragranceCatalogKey(entry);
  const marketplaceQuery = encodeURIComponent(`${entry.brand} ${entry.name}`);
  return <article className="finder-result">
    <div><p className="eyebrow">{entry.brand}</p><h3>{entry.name}</h3><p className="finder-notes">{[...entry.top, ...entry.middle, ...entry.base].slice(0, 5).join(" · ")}</p></div>
    <div className="finder-actions">{hasLiveListing ? <a className="card-action finder-live-listing" href={`/explore?q=${marketplaceQuery}#marketplace`}>Live listings ↗</a> : null}{signedIn ? <><FinderSaveButton kind="shelf" catalogKey={key} /><FinderSaveButton kind="wishlist" catalogKey={key} /></> : <a className="card-action" href="/login?from=/explore">Sign in to save</a>}</div>
  </article>;
}

function FinderSaveButton({ kind, catalogKey }: { kind: "shelf" | "wishlist"; catalogKey: string }) {
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      if (kind === "shelf") await addCatalogPerfumeToShelfAction(formData);
      else await toggleWishlistAction(formData);
      setSaved(true);
    });
  };
  const label = saved ? (kind === "shelf" ? "Added to Shelf" : "Wishlisted") : pending ? "Saving…" : kind === "shelf" ? "I own" : "Wishlist";
  return <form onSubmit={submit}><input type="hidden" name={kind === "shelf" ? "catalogKey" : "targetId"} value={catalogKey} />{kind === "wishlist" ? <input type="hidden" name="targetType" value="catalog" /> : null}<button className={`card-action finder-save ${saved ? "is-saved" : ""}`} type="submit" disabled={pending || saved} aria-live="polite">{saved ? "✓ " : ""}{label}</button></form>;
}

function recommend(entries: FragranceEntry[], notes: string[], query: string) {
  const search = query.trim().toLowerCase();
  return entries.map((entry) => {
    const text = `${entry.brand} ${entry.name} ${entry.top.join(" ")} ${entry.middle.join(" ")} ${entry.base.join(" ")}`.toLowerCase();
    const score = notes.reduce((total, note) => total + (text.includes(note.toLowerCase()) ? 10 : 0), 0) + (search && text.includes(search) ? 20 : 0) + entry.rating;
    return { entry, score };
  }).filter(({ entry }) => !search || `${entry.brand} ${entry.name}`.toLowerCase().includes(search) || [...entry.top, ...entry.middle, ...entry.base].join(" ").toLowerCase().includes(search)).sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name)).map(({ entry }) => entry);
}

function hasLiveListing(entry: FragranceEntry, listings: LiveListing[]) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const label = normalize(`${entry.brand} ${entry.name}`);
  const name = normalize(entry.name);
  return listings.some((listing) => {
    const listingName = normalize(listing.name);
    const listingBrand = normalize(listing.brand || "");
    return listingBrand === normalize(entry.brand) && (listingName === name || listingName === label || listingName.includes(name));
  });
}
