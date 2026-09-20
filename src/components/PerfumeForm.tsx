"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { savePerfumeAction } from "@/actions/listings";
import { perfumeCompletion, parseLinks } from "@/lib/completion";
import { suggestedPerfumeArt } from "@/lib/photos";
import { isBidListing } from "@/lib/sale";
import { notesToText, perfumesForBrand, popularBrands, searchFragranceCatalog, type FragranceEntry } from "@/lib/fragrance-catalog";
import { StatusBadge } from "@/components/StatusBadge";

type CollectionOption = { id: string; name: string };

type Perfume = {
  id: string;
  brand?: string | null;
  name: string;
  saleType?: string | null;
  listingIntent?: string | null;
  priceCents: number;
  minBidCents?: number | null;
  bidEndsAt?: Date | string | null;
  unitsAvailable?: number;
  imageUrl: string | null;
  kind: string | null;
  fill: string | null;
  ml: number | null;
  shippingIncluded: boolean | null;
  description: string | null;
  sourcedFrom?: string | null;
  topNotes?: string | null;
  middleNotes?: string | null;
  baseNotes?: string | null;
  catalogRating?: number | null;
  links: string;
  status: string;
  collectionId: string | null;
};

export function PerfumeForm({
  perfume,
  collections,
  defaultCollectionId,
}: {
  perfume?: Perfume;
  collections: CollectionOption[];
  defaultCollectionId?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [brand, setBrand] = useState(perfume?.brand ?? "");
  const [name, setName] = useState(perfume?.name ?? "");
  const [acceptBids, setAcceptBids] = useState(isBidListing(perfume?.saleType));
  const [listingIntent, setListingIntent] = useState<"collection" | "marketplace" | null>(
    perfume ? (perfume.listingIntent === "collection" ? "collection" : "marketplace") : null,
  );
  const [price, setPrice] = useState(
    perfume && !isBidListing(perfume.saleType) ? String(perfume.priceCents / 100) : "",
  );
  const [minBid, setMinBid] = useState(
    perfume && isBidListing(perfume.saleType)
      ? String((perfume.minBidCents ?? perfume.priceCents) / 100)
      : "",
  );
  const [bidDuration, setBidDuration] = useState("24");
  const [bidDurationUnit, setBidDurationUnit] = useState<"hours" | "days">("hours");
  const [kind, setKind] = useState(perfume?.kind === "bottle" ? "retail" : perfume?.kind ?? "");
  const fill = null;
  const [ml, setMl] = useState(perfume?.ml != null ? String(perfume.ml) : "");
  const [shippingIncluded, setShippingIncluded] = useState<boolean | null>(
    perfume ? perfume.shippingIncluded : null,
  );
  const [description, setDescription] = useState(perfume?.description ?? "");
  const [sourcedFrom, setSourcedFrom] = useState(perfume?.sourcedFrom ?? "");
  const [topNotes, setTopNotes] = useState(perfume?.topNotes ?? "");
  const [middleNotes, setMiddleNotes] = useState(perfume?.middleNotes ?? "");
  const [baseNotes, setBaseNotes] = useState(perfume?.baseNotes ?? "");
  const [catalogRating, setCatalogRating] = useState(
    perfume?.catalogRating != null ? String(perfume.catalogRating) : "",
  );
  const [fragranticaUrl, setFragranticaUrl] = useState("");
  const [fragranticaStatus, setFragranticaStatus] = useState<string | null>(null);
  const [importingFragrantica, setImportingFragrantica] = useState(false);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [coverSource, setCoverSource] = useState<"atelier" | "upload">(
    perfume?.imageUrl && !perfume.imageUrl.startsWith("/atelier/") ? "upload" : "atelier",
  );
  const [hasUpload, setHasUpload] = useState(false);
  const initialLinks = parseLinks(perfume?.links);
  const [links, setLinks] = useState(
    initialLinks.length ? initialLinks : [{ label: "", url: "" }],
  );

  const suggested = suggestedPerfumeArt(name || "perfume");
  const isMarketplace = listingIntent === "marketplace";
  const previewImage = coverSource === "atelier" ? suggested : perfume?.imageUrl;
  const brandChoices = useMemo(() => popularBrands(), []);
  const brandPerfumes = useMemo(() => perfumesForBrand(brand), [brand]);
  const matches = useMemo(
    () => brand ? brandPerfumes.filter((entry) => entry.name.toLowerCase().includes(name.toLowerCase())).slice(0, 16) : searchFragranceCatalog(name),
    [brand, brandPerfumes, name],
  );

  const completion = useMemo(
    () =>
      perfumeCompletion({
        imageUrl: coverSource === "atelier" || hasUpload || perfume?.imageUrl ? previewImage || perfume?.imageUrl : null,
        kind: kind || null,
        fill: fill || null,
        ml: ml ? Number(ml) : null,
        shippingIncluded: shippingIncluded === true ? true : null,
        description,
        topNotes,
        middleNotes,
        baseNotes,
        links,
      }),
    [previewImage, perfume?.imageUrl, coverSource, hasUpload, kind, fill, ml, shippingIncluded, description, topNotes, middleNotes, baseNotes, links],
  );

  useEffect(() => {
    const match = brandPerfumes.find((entry) => entry.name.toLowerCase() === name.trim().toLowerCase());
    if (!match) return;
    if (!topNotes && !middleNotes && !baseNotes) {
      setTopNotes(notesToText(match.top));
      setMiddleNotes(notesToText(match.middle));
      setBaseNotes(notesToText(match.base));
    }
    if (isMarketplace && !catalogRating) setCatalogRating(String(match.rating));
  }, [brandPerfumes, name, topNotes, middleNotes, baseNotes, isMarketplace, catalogRating]);

  function applyCatalog(entry: FragranceEntry) {
    setBrand(entry.brand);
    setName(entry.name);
    setTopNotes(notesToText(entry.top));
    setMiddleNotes(notesToText(entry.middle));
    setBaseNotes(notesToText(entry.base));
    setCatalogRating(String(entry.rating));
    setOpenSuggest(false);
  }

  async function importFragrantica() {
    setFragranticaStatus(null);
    if (!fragranticaUrl.trim()) { setFragranticaStatus("Paste a Fragrantica perfume page link first."); return; }
    setImportingFragrantica(true);
    try {
      const response = await fetch("/api/fragrantica-notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: fragranticaUrl }) });
      const data = await response.json() as { brand?: string; name?: string; top?: string[]; middle?: string[]; base?: string[]; rating?: number; source?: "fragrantica" | "atelier-catalogue"; error?: string };
      if (!response.ok || data.error) { setFragranticaStatus(data.error || "Could not import this page."); return; }
      if (data.brand) setBrand(data.brand);
      if (data.name) setName(data.name);
      if (data.top?.length) setTopNotes(notesToText(data.top));
      if (data.middle?.length) setMiddleNotes(notesToText(data.middle));
      if (data.base?.length) setBaseNotes(notesToText(data.base));
      if (isMarketplace && data.rating != null) setCatalogRating((Math.round(data.rating * 100) / 100).toFixed(2));
      setLinks((current) => current.some((link) => link.url === fragranticaUrl.trim()) ? current : [...current.filter((link) => link.url || link.label), { label: "Fragrantica", url: fragranticaUrl.trim() }]);
      setFragranticaStatus(data.source === "atelier-catalogue" ? "Listing details and notes filled from Atelier’s reference catalogue. You can edit them before publishing." : "Listing details and notes imported. You can edit them before publishing.");
    } catch { setFragranticaStatus("Could not import this page. Please try again."); }
    finally { setImportingFragrantica(false); }
  }

  async function run(intent: string, fd: FormData) {
    if (!listingIntent) {
      setError("Choose how you want to add this perfume first.");
      return;
    }
    fd.set("intent", intent);
    if (isMarketplace && acceptBids) fd.set("acceptBids", "true");
    const res = await savePerfumeAction(fd);
    if (res?.error) setError(res.error);
  }

  return (
    <form className="space-y-4">
      {perfume ? <input type="hidden" name="id" value={perfume.id} /> : null}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl">{perfume ? "Edit perfume" : "New perfume"}</h1>
        {perfume ? <StatusBadge status={perfume.status} /> : <StatusBadge status="draft" />}
      </div>
      <p className="text-muted">
        {perfume
          ? "Update the details of this perfume."
          : "Choose where this perfume belongs before adding its details."}
      </p>
      {!perfume && !listingIntent ? (
        <div className="grid gap-3 sm:grid-cols-3" aria-label="Choose how to add this perfume">
          <button type="button" className="card p-4 text-left hover:border-accent" onClick={() => setListingIntent("collection")}>
            <p className="eyebrow">My collection</p>
            <strong className="mt-1 block font-serif text-xl">Add to my shelf</strong>
            <p className="mt-1 text-sm text-muted">Show it on your profile, collections, Podium, and scent profile. No sale actions.</p>
          </button>
          <button type="button" className="card p-4 text-left hover:border-accent" onClick={() => setListingIntent("marketplace")}>
            <p className="eyebrow">Marketplace</p>
            <strong className="mt-1 block font-serif text-xl">Sell or host bids</strong>
            <p className="mt-1 text-sm text-muted">Set a buy price or timed bid and make it discoverable in Explore.</p>
          </button>
          <Link href="/me/perfumes/import" className="card p-4 text-left hover:border-accent">
            <p className="eyebrow">Bulk upload</p>
            <strong className="mt-1 block font-serif text-xl">Import a spreadsheet</strong>
            <p className="mt-1 text-sm text-muted">Download the Atelier CSV template to add several shelf entries or listings.</p>
          </Link>
        </div>
      ) : null}
      {listingIntent ? <>
      {!perfume ? <div className="flex items-center justify-between rounded-xl border border-line bg-paper px-4 py-3 text-sm"><span><span className="eyebrow mr-2">Adding as</span>{isMarketplace ? "Marketplace listing" : "Shelf entry"}</span><button type="button" className="text-accent underline underline-offset-4" onClick={() => setListingIntent(null)}>Change</button></div> : null}
      <div className="card p-4">
        <p className="text-sm text-muted">Listing completion</p>
        <p className="font-serif text-3xl">{completion.percent}%</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-accent" style={{ width: `${completion.percent}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted">
          {completion.done}/{completion.total} optional details filled. Complete more to stand out in search.
        </p>
      </div>
      {error ? <p className="text-accent">{error}</p> : null}
      <input type="hidden" name="listingIntent" value={listingIntent} />
      <section className="fragrantica-import">
        <div><p className="eyebrow">CREATE USING FRAGRANTICA LINK</p><p>Paste a Fragrantica perfume page to fill brand, perfume name, and the note pyramid. Only secure Fragrantica perfume links are accepted.</p></div>
        <div className="fragrantica-import-controls"><input type="url" inputMode="url" placeholder="https://www.fragrantica.com/perfume/..." value={fragranticaUrl} onChange={(event) => setFragranticaUrl(event.target.value)} aria-label="Fragrantica perfume page link" /><button className="btn btn-ghost" type="button" onClick={importFragrantica} disabled={importingFragrantica}>{importingFragrantica ? "Creating…" : "Create from link"}</button></div>
        {fragranticaStatus ? <p className="text-xs text-muted" aria-live="polite">{fragranticaStatus}</p> : null}
      </section>
      <div className="space-y-3 rounded-2xl border border-line bg-paper p-4">
        <label className="field">
          Brand
          <input
            name="brand"
            list="atelier-brand-options"
            placeholder="Start with a brand"
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setName("");
            }}
          />
          <datalist id="atelier-brand-options">{brandChoices.map((choice) => <option key={choice} value={choice} />)}</datalist>
        </label>
        {brandPerfumes.length ? (
          <div>
            <p className="eyebrow mb-2">Popular {brand} perfumes</p>
            <div className="flex flex-wrap gap-2">
              {brandPerfumes.map((entry) => (
                <button key={entry.name} className="rounded-full border border-line bg-bg px-3 py-1.5 text-sm hover:border-accent hover:text-accent" type="button" onClick={() => applyCatalog(entry)}>
                  {entry.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="relative">
        <label className="field">
          Perfume
          <input
            name="name"
            required
            autoComplete="off"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setOpenSuggest(true);
            }}
            onFocus={() => setOpenSuggest(true)}
            onBlur={() => {
              window.setTimeout(() => setOpenSuggest(false), 150);
            }}
          />
        </label>
        {openSuggest && matches.length > 0 ? (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-line bg-bg p-1 shadow-lg">
            {matches.map((entry) => (
              <li key={`${entry.brand}-${entry.name}`}>
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-line/40"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyCatalog(entry)}
                >
                  {brand ? entry.name : `${entry.brand} · ${entry.name}`}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {isMarketplace ? <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="acceptBids"
          checked={acceptBids}
          onChange={(e) => setAcceptBids(e.target.checked)}
        />
        Accept bids
      </label> : null}
      {isMarketplace && acceptBids ? (
        <div className="grid gap-3 sm:grid-cols-2"><label className="field">
          Minimum bid (INR)
          <input name="minBid" type="number" min="1" step="0.01" required value={minBid} onChange={(e) => setMinBid(e.target.value)} />
        </label><label className="field">
          {perfume?.bidEndsAt ? "Bid duration for a new round" : "Bid duration"}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"><input name="bidDuration" type="number" min="1" max="30" required value={bidDuration} onChange={(e) => setBidDuration(e.target.value)} /><select name="bidDurationUnit" value={bidDurationUnit} onChange={(e) => setBidDurationUnit(e.target.value as "hours" | "days")}><option value="hours">hours</option><option value="days">days</option></select></div>
        </label>{perfume?.bidEndsAt ? <p className="sm:col-span-2 text-xs text-muted">Current round ends {new Date(perfume.bidEndsAt).toLocaleString()}. An active round keeps its existing deadline.</p> : <p className="sm:col-span-2 text-xs text-muted">At the deadline, the highest valid bid wins and Atelier opens the deal chat for both of you.</p>}</div>
      ) : isMarketplace ? (
        <label className="field">
          Price (INR)
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
      ) : null}
      <label className="field">
        Collection
        <select name="collectionId" defaultValue={perfume?.collectionId ?? defaultCollectionId ?? ""}>
          <option value="">Standalone on my feed</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewImage || suggested}
          alt=""
          className="h-24 w-24 rounded-2xl border border-line object-cover"
        />
        <div className="space-y-2 text-sm">
          <label className="field">
            Cover image <span className="text-xs text-muted">(JPEG, PNG, or WebP · max 3 MB)</span>
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setHasUpload(Boolean(e.target.files?.[0]))}
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="coverSource"
              value="atelier"
              checked={coverSource === "atelier"}
              onChange={() => setCoverSource("atelier")}
            />
            Use Atelier cover art
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="coverSource"
              value="upload"
              checked={coverSource === "upload"}
              onChange={() => setCoverSource("upload")}
            />
            Use my uploaded image
          </label>
        </div>
      </div>
      {isMarketplace ? <label className="field">
        Listing type {isMarketplace ? null : <span className="text-xs text-muted">(optional)</span>}
        <select name="kind" required={isMarketplace} value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Select a type</option>
          <option value="retail">Retail</option>
          <option value="tester">Tester</option>
          <option value="partial">Partial</option>
          <option value="decant">Decant</option>
        </select>
      </label> : null}
      {isMarketplace ? <label className="field">
        Millilitres {isMarketplace ? null : <span className="text-xs text-muted">(optional)</span>}
        <input name="ml" type="number" min="0.1" step="0.1" required={isMarketplace} value={ml} onChange={(e) => setMl(e.target.value)} />
      </label> : null}
      {isMarketplace ? <label className="field">
        Units available
        <input name="unitsAvailable" type="number" min="1" step="1" required defaultValue={perfume?.unitsAvailable ?? 1} />
      </label> : null}
      {isMarketplace ? <><input type="hidden" name="shippingIncluded" value="false" />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="shippingIncluded"
          value="true"
          checked={shippingIncluded === true}
          onChange={(e) => setShippingIncluded(e.target.checked)}
        />
        Shipping included
      </label></> : null}
      {isMarketplace ? <label className="field">
        Community rating (out of 5)
        <input
          name="catalogRating"
          type="number"
          min="0"
          max="5"
          step="0.01"
          value={catalogRating}
          onChange={(e) => setCatalogRating(e.target.value)}
        />
      </label> : null}
      <div className="grid gap-3 md:grid-cols-3">
        <label className="field">
          Top notes
          <textarea name="topNotes" rows={3} value={topNotes} onChange={(e) => setTopNotes(e.target.value)} />
        </label>
        <label className="field">
          Middle notes
          <textarea name="middleNotes" rows={3} value={middleNotes} onChange={(e) => setMiddleNotes(e.target.value)} />
        </label>
        <label className="field">
          Base notes
          <textarea name="baseNotes" rows={3} value={baseNotes} onChange={(e) => setBaseNotes(e.target.value)} />
        </label>
      </div>
      <label className="field">
        Description
        <textarea name="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="field">
        Sourced from <span className="text-xs text-muted">(optional)</span>
        <input name="sourcedFrom" placeholder="A gift, a boutique, a swap…" value={sourcedFrom} onChange={(e) => setSourcedFrom(e.target.value)} />
      </label>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3"><p className="text-sm">External links <span className="text-xs text-muted">(optional)</span></p><button className="text-sm text-accent underline underline-offset-4" type="button" onClick={() => setLinks([...links, { label: "", url: "" }])}>Add link</button></div>
        {links.map((link, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <input
              name="linkLabel"
              placeholder="Label"
              value={link.label}
              onChange={(e) => {
                const next = [...links];
                next[i] = { ...next[i], label: e.target.value };
                setLinks(next);
              }}
            />
            <input
              name="linkUrl"
              placeholder="https://"
              value={link.url}
              onChange={(e) => {
                const next = [...links];
                next[i] = { ...next[i], url: e.target.value };
                setLinks(next);
              }}
            />
            <button type="button" className="btn-ghost px-3 text-sm" aria-label={`Remove link ${i + 1}`} onClick={() => setLinks(links.filter((_, index) => index !== i))}>Remove</button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-ghost" formAction={(fd) => run("save", fd)} type="submit">
          Save draft
        </button>
        <button className="btn" formAction={(fd) => run("publish", fd)} type="submit">
          Publish perfume
        </button>
        {perfume && perfume.status === "published" ? (
          <button className="btn btn-ghost" formAction={(fd) => run("unpublish", fd)} type="submit">
            Unpublish
          </button>
        ) : null}
      </div>
      </> : null}
    </form>
  );
}
