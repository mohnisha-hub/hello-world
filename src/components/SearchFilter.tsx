"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { listingAmountCents, isBidListing } from "@/lib/sale";
import { StatusBadge } from "@/components/StatusBadge";
import { SaleBadge } from "@/components/SaleBadge";
import { searchCollections, searchPerfumesAndGroupUsers, type SearchableCollection, type SearchablePerfume } from "@/lib/search";
import { collectionDisplayImage } from "@/lib/photos";

const POPULAR_NOTES = [
  "Vanilla",
  "Oud",
  "Santal",
  "Tobacco",
  "Saffron",
  "Cognac",
  "Honey",
  "Fig",
  "Pineapple",
  "Amber",
];

export function SearchFilter({
  perfumes,
  collections = [],
  allUsers,
  ratingMap,
}: {
  perfumes: SearchablePerfume[];
  collections?: SearchableCollection[];
  allUsers: SearchablePerfume["owner"][];
  ratingMap: Record<string, { average: number; count: number } | null>;
}) {
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchPerfumesAndGroupUsers(perfumes, query, ratingMap);
  }, [perfumes, query, ratingMap]);

  const collectionResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchCollections(collections, query);
  }, [collections, query]);

  const isSearching = query.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search perfumes by name, brand, or notes (e.g. Baccarat, Tobacco, Oud, Santal, Vanilla)..."
            className="w-full rounded-2xl border border-line bg-paper px-4 py-3.5 pl-11 text-base text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none transition-colors"
          />
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-ink transition-colors"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ) : null}
        </div>

        {/* Quick note filter tags */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-muted">Quick filters:</span>
          {POPULAR_NOTES.map((note) => {
            const active = query.toLowerCase() === note.toLowerCase();
            return (
              <button
                key={note}
                onClick={() => setQuery(active ? "" : note)}
                className={`rounded-full px-2.5 py-1 text-xs transition-colors border ${
                  active
                    ? "bg-accent text-on-accent border-accent font-medium"
                    : "bg-paper text-muted border-line hover:border-muted hover:text-ink"
                }`}
              >
                {note}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results View */}
      {isSearching ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-xl">
              Sellers with listings for <span className="text-accent">&ldquo;{query}&rdquo;</span>
            </h2>
            <span className="text-xs text-muted">
              {searchResults.length} {searchResults.length === 1 ? "seller" : "sellers"}
              {collectionResults.length
                ? ` · ${collectionResults.length} ${collectionResults.length === 1 ? "collection" : "collections"}`
                : ""}{" "}
              found
            </span>
          </div>

          {searchResults.length === 0 && collectionResults.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-lg">No live collections or listings matched.</p>
              <p className="mt-1 text-sm text-muted">
                Drafts stay private. Try a house, note, or collection name once those listings are published.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {collectionResults.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm uppercase tracking-wider text-muted">Live collections</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {collectionResults.map((collection) => (
                      <Link
                        key={collection.id}
                        href={`/u/${collection.owner.username}/c/${collection.id}`}
                        className="card flex items-center gap-4 p-4 hover:border-muted/50 transition-colors"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={collectionDisplayImage(collection.name, collection.photoUrl)}
                          alt=""
                          className="h-16 w-16 rounded-2xl object-cover border border-line"
                        />
                        <div>
                          <p className="font-serif text-xl">{collection.name}</p>
                          <p className="text-xs text-muted">
                            @{collection.owner.username} · {collection.perfumeCount} live perfume
                            {collection.perfumeCount === 1 ? "" : "s"}
                          </p>
                          <StatusBadge status={collection.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              {searchResults.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {searchResults.map(({ user, matchingPerfumes }) => (
                <div key={user.id} className="card flex flex-col justify-between p-5 space-y-4">
                  {/* User Profile Header */}
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/u/${user.username}`}
                      className="group flex items-center gap-3 hover:opacity-90 transition-opacity"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user.photoUrl || `https://api.dicebear.com/9.x/lorelei/svg?seed=${user.username}`}
                        alt=""
                        className="h-14 w-14 rounded-full object-cover border border-line"
                      />
                      <div>
                        <p className="font-serif text-xl group-hover:text-accent transition-colors">
                          @{user.username}
                        </p>
                        <p className="text-xs text-muted">{user.location || "India"}</p>
                        {user.rating ? (
                          <p className="text-xs text-muted">
                            ★ {user.rating.average.toFixed(1)} / 10 · {user.rating.count} reviews
                          </p>
                        ) : null}
                      </div>
                    </Link>
                    <StatusBadge status={user.profileStatus} />
                  </div>

                  {user.bio ? (
                    <p className="text-xs text-muted line-clamp-2">{user.bio}</p>
                  ) : null}

                  {/* Matching Perfumes Sub-List */}
                  <div className="space-y-2 border-t border-line/60 pt-3">
                    <p className="text-xs uppercase tracking-wider text-muted font-medium">
                      Matching Public Listings ({matchingPerfumes.length}):
                    </p>
                    <div className="space-y-2">
                      {matchingPerfumes.map((perfume) => (
                        <Link
                          key={perfume.id}
                          href={`/p/${perfume.id}`}
                          className="flex items-center justify-between gap-3 rounded-xl bg-bg/50 p-2.5 border border-line/40 hover:border-line hover:bg-bg transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{perfume.name}</p>
                            <p className="text-xs text-muted">
                              {isBidListing(perfume.saleType)
                                ? `Min bid ${formatMoney(listingAmountCents(perfume))}`
                                : formatMoney(listingAmountCents(perfume))}
                              {perfume.ml ? ` · ${perfume.ml} ml` : ""}
                              {perfume.kind ? ` · ${perfume.kind}` : ""}
                              {perfume.fill ? ` (${perfume.fill})` : ""}
                              {perfume.collectionName ? ` · ${perfume.collectionName}` : ""}
                            </p>
                          </div>
                          <SaleBadge saleType={perfume.saleType} />
                        </Link>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/u/${user.username}`}
                    className="btn btn-ghost text-xs w-full text-center border border-line py-2"
                  >
                    View All from @{user.username} →
                  </Link>
                </div>
              ))}
            </div>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        /* Default Community Members Grid when not searching */
        <div className="grid gap-4 sm:grid-cols-2">
          {allUsers.length === 0 ? (
            <p className="text-muted">No published profiles yet. Publish a profile to appear here.</p>
          ) : (
            allUsers.map((user) => {
              const rating = ratingMap[user.id];
              return (
                <Link
                  key={user.id}
                  href={`/u/${user.username}`}
                  className="card flex items-center gap-4 p-4 hover:border-muted/50 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.photoUrl || `https://api.dicebear.com/9.x/lorelei/svg?seed=${user.username}`}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover border border-line"
                  />
                  <div>
                    <p className="font-serif text-2xl">@{user.username}</p>
                    <p className="text-sm text-muted">{user.location || "Somewhere scented"}</p>
                    {rating ? (
                      <p className="text-sm">
                        ★ {rating.average.toFixed(1)} / 10 · {rating.count} rating{rating.count === 1 ? "" : "s"}
                      </p>
                    ) : null}
                    <StatusBadge status={user.profileStatus} />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
