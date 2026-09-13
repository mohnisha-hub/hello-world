"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { addCatalogPerfumeToShelfAction } from "@/actions/listings";
import { toggleWishlistAction } from "@/actions/wishlist";
import { FRAGRANCE_CATALOG, fragranceCatalogKey, type FragranceEntry } from "@/lib/fragrance-catalog";

const STARTER_NOTES = ["Vanilla", "Oud", "Tobacco", "Saffron", "Rose", "Jasmine", "Bergamot", "Sandalwood", "Musk", "Fig", "Coffee", "Amber"];

export function PerfumeFinder({ signedIn }: { signedIn: boolean }) {
  const [notes, setNotes] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const results = useMemo(() => recommend(FRAGRANCE_CATALOG, notes, query), [notes, query]);
  const toggle = (note: string) => setNotes((current) => current.includes(note) ? current.filter((value) => value !== note) : [...current, note]);
  return <section className="perfume-finder">
    <div className="perfume-finder-heading"><div><p className="eyebrow">PERFUME FINDER</p><h2 className="section-heading">Find a scent for your story.</h2><p>Choose notes you gravitate toward; recommendations come from Atelier&apos;s saved fragrance catalogue.</p></div></div>
    <input className="perfume-finder-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a perfume or house" aria-label="Search perfume finder" />
    <div className="perfume-note-picker" aria-label="Preferred notes">{STARTER_NOTES.map((note) => <button key={note} type="button" onClick={() => toggle(note)} className={notes.includes(note) ? "is-active" : ""}>{note}</button>)}</div>
    <div className="perfume-finder-results">{results.slice(0, 12).map((entry) => <FinderResult key={fragranceCatalogKey(entry)} entry={entry} signedIn={signedIn} />)}</div>
  </section>;
}

function FinderResult({ entry, signedIn }: { entry: FragranceEntry; signedIn: boolean }) {
  const key = fragranceCatalogKey(entry);
  return <article className="finder-result">
    <div><p className="eyebrow">{entry.brand}</p><h3>{entry.name}</h3><p className="finder-notes">{[...entry.top, ...entry.middle, ...entry.base].slice(0, 5).join(" · ")}</p></div>
    <div className="finder-actions">{signedIn ? <><FinderSaveButton kind="shelf" catalogKey={key} /><FinderSaveButton kind="wishlist" catalogKey={key} /></> : <a className="card-action" href="/login?from=/explore">Sign in to save</a>}</div>
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
  const label = saved ? (kind === "shelf" ? "On your shelf" : "Wishlisted") : pending ? "Saving…" : kind === "shelf" ? "Add to shelf" : "Wishlist";
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
