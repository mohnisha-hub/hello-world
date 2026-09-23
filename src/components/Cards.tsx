import Link from "next/link";
import { cardInitials, cardTone } from "@/lib/photos";
import { formatMoney, formatPricePerMl } from "@/lib/money";
import { StatusBadge } from "@/components/StatusBadge";
import { perfumeCompletion } from "@/lib/completion";
import { isBidListing, listingAmountCents } from "@/lib/sale";

export function CollectionCard({
  collection,
  perfumeCount,
  href,
  showStatus,
}: {
  collection: { id: string; name: string; photoUrl: string | null; status: string };
  perfumeCount: number;
  href: string;
  showStatus?: boolean;
}) {
  return (
    <Link href={href} className="card group flex cursor-pointer gap-3 p-3">
      <div className={`card-art art-tone-${cardTone(collection.name)}`} aria-hidden="true">
        <span>{cardInitials(collection.name)}</span>
        {collection.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={collection.photoUrl} alt="" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 py-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-2 text-xl leading-tight group-hover:text-accent">{collection.name}</h3>
          {showStatus ? <StatusBadge status={collection.status} /> : null}
        </div>
        <div className="flex items-center justify-between gap-2"><span className="collection-count">{perfumeCount} perfume{perfumeCount === 1 ? "" : "s"}</span><span className="card-arrow" aria-hidden="true">↗</span></div>
      </div>
    </Link>
  );
}

export function PerfumeCard({
  perfume,
  href,
  showStatus,
  username,
}: {
  perfume: {
    id: string;
    brand?: string | null;
    name: string;
    priceCents: number;
    saleType?: string | null;
    listingIntent?: string | null;
    minBidCents?: number | null;
    ml: number | null;
    imageUrl: string | null;
    status: string;
    kind?: string | null;
    fill?: string | null;
    shippingIncluded?: boolean | null;
    description?: string | null;
  };
  href: string;
  showStatus?: boolean;
  username?: string;
}) {
  const isShelfPerfume = perfume.listingIntent === "collection";
  const amount = listingAmountCents(perfume);
  const bid = isBidListing(perfume.saleType);
  const completion = perfumeCompletion(perfume);
  const details = [
    perfume.ml ? `${perfume.ml} ml` : null,
    perfume.ml ? formatPricePerMl(amount, perfume.ml) : null,
    perfume.kind || null,
    perfume.shippingIncluded ? "Shipping included" : null,
  ].filter(Boolean);
  return (
    <Link href={href} className="card group listing-card flex cursor-pointer gap-3 p-3">
      <div className={`card-art art-tone-${cardTone(perfume.name)}`} aria-hidden="true">
        <span>{cardInitials(perfume.name)}</span>
        {perfume.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={perfume.imageUrl} alt="" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 py-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0"><p className="eyebrow line-clamp-1">{perfume.brand || "Perfume"}</p><h3 className="line-clamp-2 text-xl leading-tight group-hover:text-accent">{perfume.name}</h3></div>
          {perfume.status === "published" && !isShelfPerfume ? <span className="listing-live-dot" aria-label="Available" title="Available" /> : showStatus ? <StatusBadge status={perfume.status} /> : null}
        </div>
        <div className="listing-summary">
          <span className={isShelfPerfume ? "listing-detail" : "listing-amount"}>{isShelfPerfume ? "On their shelf" : bid ? `From ${formatMoney(amount)}` : formatMoney(amount)}</span>
          {details.length ? <span className="listing-meta">{details.join(" · ")}</span> : null}
        </div>
        {username ? <p className="text-xs text-muted">Offered by @{username}</p> : null}
        {showStatus ? <p className="text-xs text-muted">Completion {completion.percent}%</p> : null}
      </div>
    </Link>
  );
}
