"use client";

import { useMemo, useState } from "react";
import { savePerfumeAction } from "@/actions/listings";
import { perfumeCompletion, parseLinks } from "@/lib/completion";
import { suggestedPerfumeArt } from "@/lib/photos";
import { isBidListing } from "@/lib/sale";
import { fragranceLabel, notesToText, searchFragranceCatalog, type FragranceEntry } from "@/lib/fragrance-catalog";
import { StatusBadge } from "@/components/StatusBadge";

type CollectionOption = { id: string; name: string };

type Perfume = {
  id: string;
  name: string;
  saleType?: string | null;
  priceCents: number;
  minBidCents?: number | null;
  imageUrl: string | null;
  kind: string | null;
  fill: string | null;
  ml: number | null;
  shippingIncluded: boolean | null;
  description: string | null;
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
  const [name, setName] = useState(perfume?.name ?? "");
  const [acceptBids, setAcceptBids] = useState(isBidListing(perfume?.saleType));
  const [price, setPrice] = useState(
    perfume && !isBidListing(perfume.saleType) ? String(perfume.priceCents / 100) : "",
  );
  const [minBid, setMinBid] = useState(
    perfume && isBidListing(perfume.saleType)
      ? String((perfume.minBidCents ?? perfume.priceCents) / 100)
      : "",
  );
  const [kind, setKind] = useState(perfume?.kind ?? "");
  const [fill, setFill] = useState(perfume?.fill ?? "");
  const [ml, setMl] = useState(perfume?.ml != null ? String(perfume.ml) : "");
  const [shippingIncluded, setShippingIncluded] = useState<boolean | null>(
    perfume ? perfume.shippingIncluded : null,
  );
  const [description, setDescription] = useState(perfume?.description ?? "");
  const [topNotes, setTopNotes] = useState(perfume?.topNotes ?? "");
  const [middleNotes, setMiddleNotes] = useState(perfume?.middleNotes ?? "");
  const [baseNotes, setBaseNotes] = useState(perfume?.baseNotes ?? "");
  const [catalogRating, setCatalogRating] = useState(
    perfume?.catalogRating != null ? String(perfume.catalogRating) : "",
  );
  const [catalogImage, setCatalogImage] = useState("");
  const [openSuggest, setOpenSuggest] = useState(false);
  const [useSuggested, setUseSuggested] = useState(!perfume?.imageUrl);
  const [hasUpload, setHasUpload] = useState(false);
  const initialLinks = parseLinks(perfume?.links);
  const [links, setLinks] = useState(
    initialLinks.length ? initialLinks : [{ label: "", url: "" }],
  );

  const suggested = suggestedPerfumeArt(name || "perfume");
  const previewImage = hasUpload
    ? perfume?.imageUrl
    : catalogImage && !useSuggested
      ? catalogImage
      : useSuggested
        ? suggested
        : perfume?.imageUrl;
  const matches = useMemo(() => searchFragranceCatalog(name), [name]);

  const completion = useMemo(
    () =>
      perfumeCompletion({
        imageUrl: hasUpload || catalogImage || perfume?.imageUrl ? previewImage || perfume?.imageUrl || catalogImage : null,
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
    [previewImage, perfume?.imageUrl, hasUpload, catalogImage, kind, fill, ml, shippingIncluded, description, topNotes, middleNotes, baseNotes, links],
  );

  function applyCatalog(entry: FragranceEntry) {
    setName(fragranceLabel(entry));
    setTopNotes(notesToText(entry.top));
    setMiddleNotes(notesToText(entry.middle));
    setBaseNotes(notesToText(entry.base));
    setCatalogRating(String(entry.rating));
    if (entry.imageUrl) {
      setCatalogImage(entry.imageUrl);
      setUseSuggested(false);
    }
    setOpenSuggest(false);
  }

  async function run(intent: string, fd: FormData) {
    fd.set("intent", intent);
    if (acceptBids) fd.set("acceptBids", "true");
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
        Name and either a buy price or a minimum bid are required. Type a bottle name for catalog suggestions — choosing
        one fills notes, a community score, and a photo when we have one.
      </p>
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
      <div className="relative">
        <label className="field">
          Name
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
              <li key={fragranceLabel(entry)}>
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-line/40"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyCatalog(entry)}
                >
                  {fragranceLabel(entry)}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {catalogImage ? <input type="hidden" name="catalogImage" value={catalogImage} /> : null}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="acceptBids"
          checked={acceptBids}
          onChange={(e) => setAcceptBids(e.target.checked)}
        />
        Accept bids
      </label>
      {acceptBids ? (
        <label className="field">
          Minimum bid (INR)
          <input
            name="minBid"
            type="number"
            min="1"
            step="0.01"
            required
            value={minBid}
            onChange={(e) => setMinBid(e.target.value)}
          />
        </label>
      ) : (
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
      )}
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
            Photo
            <input
              name="photo"
              type="file"
              accept="image/*"
              onChange={(e) => setHasUpload(Boolean(e.target.files?.[0]))}
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="useSuggested"
              checked={useSuggested && !hasUpload}
              onChange={(e) => setUseSuggested(e.target.checked)}
            />
            Use a generated image from the name
          </label>
        </div>
      </div>
      <label className="field">
        Type
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Not specified</option>
          <option value="bottle">Bottle</option>
          <option value="tester">Tester</option>
          <option value="decant">Decant</option>
        </select>
      </label>
      {kind === "bottle" || kind === "tester" ? (
        <label className="field">
          Fill
          <select name="fill" value={fill} onChange={(e) => setFill(e.target.value)}>
            <option value="">Not specified</option>
            <option value="full">Full</option>
            <option value="partial">Partial</option>
          </select>
        </label>
      ) : null}
      <label className="field">
        Millilitres
        <input name="ml" type="number" min="0" step="0.1" value={ml} onChange={(e) => setMl(e.target.value)} />
      </label>
      <input type="hidden" name="shippingIncluded" value="false" />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="shippingIncluded"
          value="true"
          checked={shippingIncluded === true}
          onChange={(e) => setShippingIncluded(e.target.checked)}
        />
        Shipping included
      </label>
      <label className="field">
        Community rating (out of 5)
        <input
          name="catalogRating"
          type="number"
          min="0"
          max="5"
          step="0.1"
          value={catalogRating}
          onChange={(e) => setCatalogRating(e.target.value)}
        />
      </label>
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
      <div className="space-y-2">
        <p className="text-sm">External links</p>
        {links.map((link, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
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
          </div>
        ))}
        <button className="btn-ghost text-sm" type="button" onClick={() => setLinks([...links, { label: "", url: "" }])}>
          Add another link
        </button>
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
    </form>
  );
}
