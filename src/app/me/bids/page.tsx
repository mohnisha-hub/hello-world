import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { listingAmountCents } from "@/lib/sale";
import { acceptBidForm, archiveBidForm, declineBidForm, rateForm } from "@/actions/form-wrappers";
import { Notice } from "@/components/Notice";

type BidTab = "received" | "sent" | "archives";
type BidRow = { perfumeId: string; amountCents: number; status: string; perfume: { id: string; name: string } };

function asRupees(value?: string) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function filterBids<T extends BidRow>(rows: T[], perfumeId: string, minimum: number | null, maximum: number | null, status: string) {
  return rows.filter((bid) => {
    if (perfumeId && bid.perfumeId !== perfumeId) return false;
    if (minimum != null && bid.amountCents < minimum) return false;
    if (maximum != null && bid.amountCents > maximum) return false;
    return !status || bid.status === status;
  });
}

export default async function BidsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; perfume?: string; min?: string; max?: string; status?: string; notice?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/me/bids");
  const params = await searchParams;
  const tab: BidTab = params.tab === "sent" || params.tab === "archives" ? params.tab : "received";
  const selectedPerfume = params.perfume ?? "";
  const minimum = asRupees(params.min);
  const maximum = asRupees(params.max);
  const selectedStatus = params.status ?? "";
  const bidWhere = { kind: "bid" as const };
  const [sent, received, archived, ratings] = await Promise.all([
    prisma.bid.findMany({
      where: { ...bidWhere, bidderId: session.user.id, status: { in: ["open", "accepted", "declined"] } },
      include: { perfume: true, seller: true }, orderBy: { createdAt: "desc" },
    }),
    prisma.bid.findMany({
      where: { ...bidWhere, sellerId: session.user.id, status: { in: ["open", "accepted", "declined"] } },
      include: { perfume: true, bidder: true, conversation: true }, orderBy: [{ amountCents: "desc" }, { createdAt: "desc" }],
    }),
    prisma.bid.findMany({
      where: { ...bidWhere, status: "archived", OR: [{ bidderId: session.user.id }, { sellerId: session.user.id }] },
      include: { perfume: true, bidder: true, seller: true, conversation: true }, orderBy: { createdAt: "desc" },
    }),
    prisma.rating.findMany({ where: { raterId: session.user.id } }),
  ]);
  const sentRows = filterBids(sent, selectedPerfume, minimum, maximum, selectedStatus);
  const receivedRows = filterBids(received, selectedPerfume, minimum, maximum, selectedStatus);
  const archivedRows = filterBids(archived, selectedPerfume, minimum, maximum, selectedStatus);
  const activeRows = tab === "sent" ? sent : tab === "archives" ? archived : received;
  const visibleCount = tab === "sent" ? sentRows.length : tab === "archives" ? archivedRows.length : receivedRows.length;
  const rated = new Set(ratings.map((rating) => rating.perfumeId));
  const highestByPerfume = new Map<string, number>();
  const bidCountByPerfume = new Map<string, number>();
  for (const bid of received.filter((row) => row.status === "open")) {
    const current = highestByPerfume.get(bid.perfumeId) ?? 0;
    if (bid.amountCents > current) highestByPerfume.set(bid.perfumeId, bid.amountCents);
    bidCountByPerfume.set(bid.perfumeId, (bidCountByPerfume.get(bid.perfumeId) ?? 0) + 1);
  }
  const topOffers = Array.from(highestByPerfume.entries())
    .map(([perfumeId, amount]) => ({ perfumeId, amount, count: bidCountByPerfume.get(perfumeId) ?? 0, perfume: received.find((bid) => bid.perfumeId === perfumeId)?.perfume }))
    .filter((item) => Boolean(item.perfume))
    .map((item) => ({ ...item, perfume: item.perfume! }))
    .sort((a, b) => b.amount - a.amount).slice(0, 4);
  const perfumeOptions = Array.from(new Map(activeRows.map((bid) => [bid.perfume.id, bid.perfume])).values()).sort((a, b) => a.name.localeCompare(b.name));
  const tabs: Array<[BidTab, string]> = [["received", "Received"], ["sent", "Sent"], ["archives", "Archives"]];
  const tabHref = (nextTab: BidTab) => {
    const query = new URLSearchParams({ tab: nextTab });
    if (selectedPerfume) query.set("perfume", selectedPerfume);
    if (params.min) query.set("min", params.min);
    if (params.max) query.set("max", params.max);
    if (selectedStatus) query.set("status", selectedStatus);
    return `/me/bids?${query.toString()}`;
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div><p className="eyebrow">Deal desk</p><h1 className="mt-2 text-4xl sm:text-5xl">Bids</h1><p className="mt-2 text-muted">Review offers across every bid listing, then decide with context.</p></div>
        <Link href="/me/create" className="btn btn-compact">Create listing</Link>
      </div>
      <Notice message={params.notice} />
      <div className="flex flex-wrap gap-2">{tabs.map(([id, label]) => <Link key={id} href={tabHref(id)} className={tab === id ? "btn" : "btn btn-ghost"}>{label}</Link>)}</div>
      {tab === "received" && topOffers.length ? <section><div className="mb-3 flex items-baseline justify-between"><h2 className="section-heading">Top live offers</h2><p className="text-xs text-muted">Highest bid per perfume</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{topOffers.map((offer, index) => <Link key={offer.perfumeId} href={`/me/bids?tab=received&perfume=${offer.perfumeId}`} className="card p-4"><p className="eyebrow">#{index + 1} · {offer.count} open offer{offer.count === 1 ? "" : "s"}</p><p className="mt-2 line-clamp-2 font-serif text-lg">{offer.perfume.name}</p><p className="mt-3 text-lg font-medium text-accent">{formatMoney(offer.amount)}</p></Link>)}</div></section> : null}
      <form method="get" className="grid gap-3 rounded-2xl border border-line bg-paper p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_1fr_1fr_1fr_auto]">
        <input type="hidden" name="tab" value={tab} />
        <label className="field text-xs">Perfume<select name="perfume" defaultValue={selectedPerfume}><option value="">All perfumes</option>{perfumeOptions.map((perfume) => <option key={perfume.id} value={perfume.id}>{perfume.name}</option>)}</select></label>
        <label className="field text-xs">Min bid (INR)<input name="min" type="number" min="0" step="0.01" defaultValue={params.min ?? ""} placeholder="No minimum" /></label>
        <label className="field text-xs">Max bid (INR)<input name="max" type="number" min="0" step="0.01" defaultValue={params.max ?? ""} placeholder="No maximum" /></label>
        <label className="field text-xs">Status<select name="status" defaultValue={selectedStatus}><option value="">Any status</option><option value="open">Open</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="archived">Archived</option></select></label>
        <div className="flex items-end gap-2"><button className="btn btn-compact" type="submit">Filter</button><Link className="nav-link" href={`/me/bids?tab=${tab}`}>Clear</Link></div>
      </form>
      <p className="text-sm text-muted">Showing {visibleCount} bid{visibleCount === 1 ? "" : "s"}.</p>
      {tab === "sent" ? <ul className="space-y-3">{sentRows.length === 0 ? <Empty text="You have not placed a bid matching these filters." /> : null}{sentRows.map((bid) => <li key={bid.id} className="card p-4"><Link href={`/p/${bid.perfume.id}`} className="font-serif text-xl">{bid.perfume.name}</Link><p className="mt-1 text-sm">You bid {formatMoney(bid.amountCents)} · min {formatMoney(listingAmountCents(bid.perfume))} · @{bid.seller.username}</p><p className="mt-2 text-xs uppercase tracking-wider text-muted">{bid.status}</p></li>)}</ul> : null}
      {tab === "received" ? <ul className="space-y-3">{receivedRows.length === 0 ? <Empty text="No received bids match these filters." /> : null}{receivedRows.map((bid) => <li key={bid.id} className="card space-y-3 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={`/p/${bid.perfume.id}`} className="font-serif text-xl">{bid.perfume.name}</Link><p className="mt-1 text-sm">@{bid.bidder.username} offers <span className="font-medium">{formatMoney(bid.amountCents)}</span> · min {formatMoney(listingAmountCents(bid.perfume))}</p></div>{highestByPerfume.get(bid.perfumeId) === bid.amountCents && bid.status === "open" ? <span className="badge badge-live">Highest</span> : null}</div><div className="flex flex-wrap gap-2">{bid.status === "open" ? <><form action={acceptBidForm}><input type="hidden" name="id" value={bid.id} /><button className="btn" type="submit">Accept & open chat</button></form><form action={declineBidForm}><input type="hidden" name="id" value={bid.id} /><button className="btn btn-ghost" type="submit">Decline</button></form></> : null}<Link className="btn btn-ghost" href={`/me/bids?tab=received&perfume=${bid.perfume.id}`}>All bids for this perfume</Link>{bid.conversation ? <Link className="nav-link" href={`/me/messages/${bid.conversation.id}`}>Open chat</Link> : null}{bid.status === "accepted" ? <form action={archiveBidForm}><input type="hidden" name="id" value={bid.id} /><button className="nav-link" type="submit">Close deal & mark sold</button></form> : null}</div></li>)}</ul> : null}
      {tab === "archives" ? <ul className="space-y-3">{archivedRows.length === 0 ? <Empty text="No archived bids match these filters." /> : null}{archivedRows.map((bid) => <li key={bid.id} className="card space-y-3 p-4"><Link href={`/p/${bid.perfume.id}`} className="font-serif text-xl">{bid.perfume.name}</Link><p className="text-sm">{formatMoney(bid.amountCents)} · @{bid.bidder.username} → @{bid.seller.username}</p>{bid.bidderId === session.user.id && !rated.has(bid.perfumeId) ? <form action={rateForm} className="flex flex-wrap items-end gap-2"><input type="hidden" name="perfumeId" value={bid.perfumeId} /><label className="field">Purchase<input name="purchaseScore" type="number" min={1} max={10} required /></label><label className="field">Delivery<input name="deliveryScore" type="number" min={1} max={10} required /></label><button className="btn" type="submit">Rate seller</button></form> : null}{bid.conversation ? <Link className="nav-link" href={`/me/messages/${bid.conversation.id}`}>Chat</Link> : null}</li>)}</ul> : null}
    </div>
  );
}

function Empty({ text }: { text: string }) { return <p className="rounded-xl border border-dashed border-line p-5 text-sm text-muted">{text}</p>; }
