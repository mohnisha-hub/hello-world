import Link from "next/link";
import { cardInitials, cardTone } from "@/lib/photos";
import { formatMoney, formatPricePerMl } from "@/lib/money";
import { StatusBadge } from "@/components/StatusBadge";
import { SaleBadge } from "@/components/SaleBadge";
import { perfumeCompletion, parseLinks } from "@/lib/completion";
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
    <Link href={href} className="card group flex gap-3 p-3">
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
        <p className="text-xs uppercase tracking-wider text-muted">{perfumeCount} perfume{perfumeCount === 1 ? "" : "s"}</p>
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
    name: string;
    priceCents: number;
    saleType?: string | null;
    minBidCents?: number | null;
    ml: number | null;
    imageUrl: string | null;
    status: string;
    links?: string;
    kind?: string | null;
    fill?: string | null;
    shippingIncluded?: boolean | null;
    description?: string | null;
  };
  href: string;
  showStatus?: boolean;
  username?: string;
}) {
  const amount = listingAmountCents(perfume);
  const bid = isBidListing(perfume.saleType);
  const completion = perfumeCompletion(perfume);
  return (
    <Link href={href} className="card group flex gap-3 p-3">
      <div className={`card-art art-tone-${cardTone(perfume.name)}`} aria-hidden="true">
        <span>{cardInitials(perfume.name)}</span>
        {perfume.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={perfume.imageUrl} alt="" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 py-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-2 text-xl leading-tight group-hover:text-accent">{perfume.name}</h3>
          <div className="flex items-center gap-1">
            <SaleBadge saleType={perfume.saleType} />
            {showStatus ? <StatusBadge status={perfume.status} /> : null}
          </div>
        </div>
        <p className="text-sm font-medium">
          {bid ? `Min bid ${formatMoney(amount)}` : formatMoney(amount)}
          {perfume.ml ? ` · ${perfume.ml} ml · ${formatPricePerMl(amount, perfume.ml)}` : ""}
        </p>
        {username ? <p className="text-xs text-muted">Offered by @{username}</p> : null}
        {showStatus ? <p className="text-xs text-muted">Completion {completion.percent}%</p> : null}
      </div>
    </Link>
  );
}

export function parseLinksSafe(raw: string) {
  return parseLinks(raw);
}
