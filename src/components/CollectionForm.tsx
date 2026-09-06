"use client";

import { useState } from "react";
import { saveCollectionAction } from "@/actions/listings";
import { suggestedCollectionArt } from "@/lib/photos";
import { StatusBadge } from "@/components/StatusBadge";

export function CollectionForm({
  collection,
  publishedPerfumeCount = 0,
}: {
  collection?: { id: string; name: string; photoUrl: string | null; status: string };
  publishedPerfumeCount?: number;
}) {
  const [name, setName] = useState(collection?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const suggested = suggestedCollectionArt(name || "Collection");

  async function run(intent: string, fd: FormData) {
    fd.set("intent", intent);
    const res = await saveCollectionAction(fd);
    if (res?.error) setError(res.error);
  }

  return (
    <form className="space-y-4">
      {collection ? <input type="hidden" name="id" value={collection.id} /> : null}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl">{collection ? "Edit collection" : "New collection"}</h1>
        {collection ? <StatusBadge status={collection.status} /> : <StatusBadge status="draft" />}
      </div>
      <p className="text-muted">
        A name is enough to save. Add at least one perfume, publish that perfume, then publish the collection so the
        community can find it.
      </p>
      {error ? <p className="text-accent">{error}</p> : null}
      <label className="field">
        Name
        <input name="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={collection?.photoUrl || suggested} alt="" className="h-24 w-24 rounded-2xl border border-line object-cover" />
        <div className="space-y-2 text-sm">
          <label className="field">
            Photo
            <input name="photo" type="file" accept="image/*" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="useSuggested" defaultChecked={!collection?.photoUrl} />
            Use this suggested image
          </label>
        </div>
      </div>
      {collection ? (
        <p className="text-sm text-muted">
          {publishedPerfumeCount} live perfume{publishedPerfumeCount === 1 ? "" : "s"} in this collection
          {publishedPerfumeCount < 1 ? " — publish one before the collection can go live." : "."}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-ghost" formAction={(fd) => run("save", fd)} type="submit">
          Save draft
        </button>
        <button className="btn" formAction={(fd) => run("publish", fd)} type="submit">
          Publish collection
        </button>
        {collection && collection.status === "published" ? (
          <button className="btn btn-ghost" formAction={(fd) => run("unpublish", fd)} type="submit">
            Unpublish
          </button>
        ) : null}
      </div>
    </form>
  );
}
