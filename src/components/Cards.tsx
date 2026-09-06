import Link from "next/link";
import { collectionDisplayImage } from "@/lib/photos";
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
    <Link href={href} className="card block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={collectionDisplayImage(collection.name, collection.photoUrl)} alt="" className="h-40 w-full object-cover" />
      <div className="space-y-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl">{collection.name}</h3>
          {showStatus ? <StatusBadge status={collection.status} /> : null}
        </div>
        <p className="text-sm text-muted">
          {perfumeCount} perfume{perfumeCount === 1 ? "" : "s"}
        </p>
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
    <Link href={href} className="card block">
      <div className="h-40 bg-line/40">
        {perfume.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={perfume.imageUrl} alt="" className="h-40 w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-2xl">{perfume.name}</div>
        )}
      </div>
      <div className="space-y-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl">{perfume.name}</h3>
          <div className="flex items-center gap-1">
            <SaleBadge saleType={perfume.saleType} />
            {showStatus ? <StatusBadge status={perfume.status} /> : null}
          </div>
        </div>
        <p>
          {bid ? `Min bid ${formatMoney(amount)}` : formatMoney(amount)}
          {perfume.ml ? ` · ${perfume.ml} ml · ${formatPricePerMl(amount, perfume.ml)}` : ""}
        </p>
        {username ? <p className="text-sm text-muted">@{username}</p> : null}
        {showStatus ? <p className="text-xs text-muted">Completion {completion.percent}%</p> : null}
      </div>
    </Link>
  );
}

export function parseLinksSafe(raw: string) {
  return parseLinks(raw);
}
