import Link from "next/link";
import { CollectionCard, PerfumeCard } from "@/components/Cards";
import { pinForm, soldForm, deletePerfumeForm } from "@/actions/form-wrappers";
import { SortSelect } from "@/components/SortSelect";
import type { FeedItem } from "@/lib/feed";

function ItemActions({
  item,
  owner,
  pinned,
}: {
  item: FeedItem;
  owner: boolean;
  pinned: boolean;
}) {
  const targetType = item.kind;
  const targetId = item.kind === "collection" ? item.collection.id : item.perfume.id;
  return (
    <div className="flex flex-wrap gap-2 p-3 pt-0 text-xs">
      {owner ? (
        <>
          <form action={pinForm}>
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />
            <button className="btn-ghost" type="submit">
              {pinned ? "Unpin" : "Pin"}
            </button>
          </form>
          {item.kind === "perfume" && item.perfume.status === "published" ? (
            <form action={soldForm}>
              <input type="hidden" name="id" value={item.perfume.id} />
              <button className="btn-ghost" type="submit">
                Mark sold
              </button>
            </form>
          ) : null}
          {item.kind === "perfume" ? (
            <form action={deletePerfumeForm}>
              <input type="hidden" name="id" value={item.perfume.id} />
              <button className="btn-ghost" type="submit">
                Delete
              </button>
            </form>
          ) : null}
          {item.kind === "perfume" ? (
            <Link href={`/me/perfumes/${item.perfume.id}/edit`}>Edit</Link>
          ) : (
            <Link href={`/me/collections/${item.collection.id}`}>Edit</Link>
          )}
        </>
      ) : null}
    </div>
  );
}

export function FeedSections({
  live,
  sold,
  username,
  owner,
  pinIds,
  showSort,
  feedSort,
}: {
  live: FeedItem[];
  sold: FeedItem[];
  username: string;
  owner: boolean;
  pinIds: Set<string>;
  showSort?: boolean;
  feedSort?: string;
}) {
  function href(item: FeedItem) {
    if (item.kind === "collection") return `/u/${username}/c/${item.collection.id}`;
    return `/p/${item.perfume.id}`;
  }
  return (
    <div className="space-y-8">
      {showSort && owner && feedSort ? <SortSelect feedSort={feedSort} /> : null}
      <section className="grid gap-4 sm:grid-cols-2">
        {live.map((item) => (
          <div key={item.kind + (item.kind === "collection" ? item.collection.id : item.perfume.id)}>
            {item.kind === "collection" ? (
              <CollectionCard
                collection={item.collection}
                perfumeCount={item.perfumeCount}
                href={href(item)}
                showStatus={owner}
              />
            ) : (
              <PerfumeCard perfume={item.perfume} href={href(item)} showStatus={owner} />
            )}
            <ItemActions
              item={item}
              owner={owner}
              pinned={pinIds.has(item.kind === "collection" ? item.collection.id : item.perfume.id)}
            />
          </div>
        ))}
      </section>
      {sold.length > 0 ? (
        <section>
          <h2 className="mb-3 text-2xl">Sold</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {sold.map((item) => (
              <div key={"sold-" + (item.kind === "collection" ? item.collection.id : item.perfume.id)}>
                {item.kind === "collection" ? (
                  <CollectionCard
                    collection={item.collection}
                    perfumeCount={item.perfumeCount}
                    href={href(item)}
                    showStatus
                  />
                ) : (
                  <PerfumeCard perfume={item.perfume} href={href(item)} showStatus />
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
