import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPublicProfile } from "@/lib/visibility";
import { CollectionCard, PerfumeCard } from "@/components/Cards";
import { sellerRating } from "@/lib/listings";
import { StatusBadge } from "@/components/StatusBadge";
import { bidForm, deletePerfumeForm, pinForm, soldForm } from "@/actions/form-wrappers";
import { isBidListing, listingAmountCents } from "@/lib/sale";
import { formatMoney } from "@/lib/money";
import { saveScentShowcaseAction } from "@/actions/profile";
import { parseScentShowcase, SCENT_PROFILE_SLOTS } from "@/lib/showcase";

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      pins: true,
      wishlist: true,
      collections: { include: { perfumes: true } },
      perfumes: true,
    },
  });
  if (!user) notFound();
  const isOwner = session?.user?.id === user.id;
  if (!isPublicProfile(user.profileStatus) && !isOwner) notFound();

  const liveCollections = user.collections.filter((c) => c.status === "published" || c.status === "sold");
  const pinIds = new Set(user.pins.map((p) => p.targetId));
  const rating = await sellerRating(user.id);
  const wishlistPerfumeIds = user.wishlist.filter((item) => item.targetType === "perfume").map((item) => item.targetId);
  const wishlistCollectionIds = user.wishlist.filter((item) => item.targetType === "collection").map((item) => item.targetId);
  const [publicWishlistPerfumes, publicWishlistCollections] = await Promise.all([
    prisma.perfume.findMany({
      where: { id: { in: wishlistPerfumeIds }, status: "published", owner: { profileStatus: "published" } },
      include: { owner: true },
    }),
    prisma.collection.findMany({
      where: { id: { in: wishlistCollectionIds }, status: "published", owner: { profileStatus: "published" } },
      include: { owner: true, perfumes: { where: { status: "published" } } },
    }),
  ]);
  const acceptedBidRows = await prisma.bid.findMany({
    where: { sellerId: user.id, kind: "bid", status: "accepted" },
    select: { perfumeId: true, id: true },
  });
  const acceptedBidByPerfume = new Map(acceptedBidRows.map((bid) => [bid.perfumeId, bid.id]));
  const openBidListings = user.perfumes.filter((perfume) => perfume.status === "published" && isBidListing(perfume.saleType) && !acceptedBidByPerfume.has(perfume.id));
  const acceptedBidListings = user.perfumes.filter((perfume) => perfume.status === "published" && acceptedBidByPerfume.has(perfume.id));
  const availablePerfumes = user.perfumes.filter((perfume) => perfume.status === "published" && !isBidListing(perfume.saleType));
  const soldPerfumes = user.perfumes.filter((perfume) => perfume.status === "sold");
  const bidHighs = openBidListings.length
    ? await prisma.bid.groupBy({
        by: ["perfumeId"],
        where: { perfumeId: { in: openBidListings.map((perfume) => perfume.id) }, kind: "bid", status: "open" },
        _max: { amountCents: true },
      })
    : [];
  const bidHighByPerfume = Object.fromEntries(bidHighs.map((bid) => [bid.perfumeId, bid._max.amountCents]));
  const availableListings = user.perfumes.filter((perfume) => perfume.status === "published");
  const scentShowcase = parseScentShowcase(user.scentShowcase);
  const showcasePerfumes = new Map(user.perfumes.filter((perfume) => perfume.status === "published" || perfume.status === "sold").map((perfume) => [perfume.id, perfume]));
  const topThree = scentShowcase.top3.flatMap((id) => {
    const perfume = showcasePerfumes.get(id);
    return perfume ? [perfume] : [];
  });
  const scentRoles = SCENT_PROFILE_SLOTS.flatMap(([key, label]) => {
    const perfumeId = scentShowcase.slots[key];
    const perfume = perfumeId ? showcasePerfumes.get(perfumeId) : null;
    return perfume ? [{ key, label, perfume }] : [];
  });
  const selectableShowcasePerfumes = [...showcasePerfumes.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="profile-page space-y-8">
      <section className="profile-hero">
        <div className="profile-cover" />
        <div className="profile-identity-row">
          <div className="profile-identity">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.photoUrl || `https://api.dicebear.com/9.x/lorelei/svg?seed=${user.username}`}
          alt=""
          className="h-20 w-20 rounded-full border-4 border-paper object-cover sm:h-24 sm:w-24"
        />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl">@{user.username}</h1>
            {isOwner ? <StatusBadge status={user.profileStatus} /> : null}
          </div>
          <p className="mt-1 text-sm text-muted">{user.location || "Somewhere scented"}</p>
          {rating ? (
            <p className="text-sm">
              {rating.average.toFixed(1)} / 10 · {rating.count} rating{rating.count === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
          </div>
          <div className="profile-primary-actions">
            {isOwner ? <Link className="btn btn-ghost" href="/me/profile">Edit profile</Link> : null}
            {!isOwner ? <Link className="btn btn-ghost" href="/explore">Explore scents</Link> : null}
          </div>
        </div>
        <div className="profile-stats">
          <div><p>{liveCollections.length}</p><span>Collections</span></div>
          <div><p>{availableListings.length}</p><span>Available</span></div>
          <div><p>{publicWishlistCollections.length + publicWishlistPerfumes.length}</p><span>Wishlist</span></div>
        </div>
        {user.bio ? <p className="border-t border-line px-5 py-4 text-sm leading-6 sm:px-7">{user.bio}</p> : null}
      </section>
      <div className="profile-layout">
        <main className="profile-content">
          {topThree.length ? <TopThree perfumes={topThree} username={user.username} /> : null}

          <ProfileSection title="Collections" detail="Curated shelves" tools={isOwner ? <SectionTools addHref="/me/collections/new" editHref="/me/collections" addLabel="Add collection" editLabel="Edit collections" /> : null}>
            {liveCollections.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {liveCollections.map((collection) => (
                  <div key={collection.id}>
                    <CollectionCard collection={collection} perfumeCount={collection.perfumes.filter((perfume) => perfume.status === "published").length} href={`/u/${user.username}/c/${collection.id}`} />
                    {isOwner ? <OwnerActions targetType="collection" targetId={collection.id} pinned={pinIds.has(collection.id)} editHref={`/me/collections/${collection.id}`} /> : null}
                  </div>
                ))}
              </div>
            ) : <EmptyState text="No published collections yet." />}
          </ProfileSection>

          <ProfileSection title="Available now" detail="Ready to buy" tools={isOwner ? <SectionTools addHref="/me/perfumes/new" editHref="/me/perfumes" addLabel="Add perfume" editLabel="Edit perfumes" /> : null}>
            {availablePerfumes.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {availablePerfumes.map((perfume) => (
                  <div key={perfume.id}>
                    <PerfumeCard perfume={perfume} href={`/p/${perfume.id}`} showStatus={isOwner} />
                    {isOwner ? <OwnerActions targetType="perfume" targetId={perfume.id} pinned={pinIds.has(perfume.id)} editHref={`/me/perfumes/${perfume.id}/edit`} canSell /> : null}
                  </div>
                ))}
              </div>
            ) : <EmptyState text="No buy-now perfumes at the moment." />}
          </ProfileSection>

          <ProfileSection title="Bidding floor" detail={isOwner ? "Offers on your perfumes" : "Make an offer"}>
            {openBidListings.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {openBidListings.map((perfume) => {
                  const minimum = listingAmountCents(perfume);
                  const highest = bidHighByPerfume[perfume.id] ?? null;
                  return (
                    <div key={perfume.id} className="space-y-2">
                      <PerfumeCard perfume={perfume} href={`/p/${perfume.id}`} showStatus={isOwner} />
                      <div className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm">
                        <p className="text-muted">{highest ? `Current high ${formatMoney(highest)}` : `Minimum bid ${formatMoney(minimum)}`}</p>
                        {!isOwner && session?.user ? (
                          <form action={bidForm} className="mt-2 flex gap-2">
                            <input type="hidden" name="perfumeId" value={perfume.id} />
                            <input className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm" name="amount" type="number" min={(highest ?? minimum) / 100 + 0.01} step="0.01" placeholder="Your INR bid" required />
                            <button className="btn btn-compact" type="submit">Bid</button>
                          </form>
                        ) : null}
                      </div>
                      {isOwner ? <OwnerActions targetType="perfume" targetId={perfume.id} pinned={pinIds.has(perfume.id)} editHref={`/me/perfumes/${perfume.id}/edit`} canSell /> : null}
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState text="No active bid listings right now." />}
          </ProfileSection>

          {isOwner && acceptedBidListings.length ? (
            <ProfileSection title="Accepted deals" detail="Ready to close">
              <div className="grid gap-3 sm:grid-cols-2">{acceptedBidListings.map((perfume) => <PerfumeCard key={perfume.id} perfume={perfume} href={`/p/${perfume.id}`} showStatus />)}</div>
            </ProfileSection>
          ) : null}

          {isOwner && soldPerfumes.length ? (
            <details className="rounded-xl border border-line bg-paper p-4">
              <summary className="cursor-pointer text-sm text-muted">Sold listings ({soldPerfumes.length})</summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">{soldPerfumes.map((perfume) => <PerfumeCard key={perfume.id} perfume={perfume} href={`/p/${perfume.id}`} showStatus />)}</div>
            </details>
          ) : null}
        </main>

        <aside className="profile-rail">
          {isOwner || scentRoles.length ? (
            <section className="scent-profile-panel">
              <div className="mb-3"><p className="eyebrow">SCENT PROFILE</p><h2 className="mt-1 font-serif text-xl">{isOwner ? "My scent profile" : `@${user.username}'s picks`}</h2></div>
              {scentRoles.length ? <div className="scent-role-list">{scentRoles.map(({ key, label, perfume }) => <ScentRoleCard key={key} label={label} perfume={perfume} username={user.username} />)}</div> : null}
              {isOwner ? <ScentProfileEditor perfumes={selectableShowcasePerfumes} topThree={scentShowcase.top3} slots={scentShowcase.slots} /> : null}
              {!isOwner && !scentRoles.length ? null : null}
            </section>
          ) : null}
          <section className="rounded-2xl border border-line bg-paper p-4">
            <div className="mb-3"><p className="eyebrow">WISHLIST</p><h2 className="mt-1 font-serif text-xl">{isOwner ? "My wishlist" : `@${user.username}'s wishlist`}</h2></div>
            <div className="space-y-2">
              {publicWishlistCollections.map((collection) => <WishlistMiniCard key={collection.id} href={`/u/${collection.owner.username}/c/${collection.id}`} title={collection.name} meta={`${collection.perfumes.length} perfumes`} />)}
              {publicWishlistPerfumes.map((perfume) => <WishlistMiniCard key={perfume.id} href={`/p/${perfume.id}`} title={perfume.name} meta={`@${perfume.owner.username}`} />)}
              {publicWishlistCollections.length + publicWishlistPerfumes.length === 0 ? <p className="text-sm leading-6 text-muted">No saved finds to show yet.</p> : null}
            </div>
            {isOwner ? <Link className="mt-4 inline-block text-sm text-muted hover:text-ink" href="/me/wishlist">Open wishlist →</Link> : null}
          </section>
        </aside>
      </div>
    </div>
  );
}

function TopThree({ perfumes, username }: { perfumes: { id: string; name: string; brand: string | null; imageUrl: string | null }[]; username: string }) {
  return <section className="top-three"><div className="mb-4"><p className="eyebrow">THE PODIUM</p><h2 className="section-heading">Top 3 perfumes</h2></div><div className="top-three-grid">{perfumes.map((perfume, index) => <Link key={perfume.id} href={`/p/${perfume.id}`} className={`top-three-card top-three-rank-${index + 1}`}><span className="top-three-rank">0{index + 1}</span><span><small>{perfume.brand || "Perfume"}</small><strong>{perfume.name}</strong><em>@{username}</em></span></Link>)}</div></section>;
}

function ScentRoleCard({ label, perfume, username }: { label: string; perfume: { id: string; name: string; brand: string | null }; username: string }) {
  return <Link href={`/p/${perfume.id}`} className="scent-role-card"><span>{label}</span><strong>{perfume.brand ? `${perfume.brand} · ` : ""}{perfume.name}</strong><small>@{username} ↗</small></Link>;
}

function ScentProfileEditor({ perfumes, topThree, slots }: { perfumes: { id: string; name: string; brand: string | null }[]; topThree: string[]; slots: Record<string, string | undefined> }) {
  if (!perfumes.length) return <p className="mt-3 text-sm leading-6 text-muted">Publish a perfume to start your scent profile.</p>;
  return <details className="scent-profile-editor"><summary>Curate your picks</summary><form action={saveScentShowcaseAction}><fieldset><legend>Top 3</legend>{["top1", "top2", "top3"].map((name, index) => <label key={name}>#{index + 1}<ShowcaseSelect name={name} value={topThree[index]} perfumes={perfumes} /></label>)}</fieldset><fieldset><legend>Roles</legend>{SCENT_PROFILE_SLOTS.map(([key, label]) => <label key={key}>{label}<ShowcaseSelect name={key} value={slots[key]} perfumes={perfumes} /></label>)}</fieldset><button className="btn btn-compact" type="submit">Save scent profile</button></form></details>;
}

function ShowcaseSelect({ name, value, perfumes }: { name: string; value?: string; perfumes: { id: string; name: string; brand: string | null }[] }) {
  return <select name={name} defaultValue={value || ""}><option value="">Not set</option>{perfumes.map((perfume) => <option key={perfume.id} value={perfume.id}>{perfume.brand ? `${perfume.brand} · ` : ""}{perfume.name}</option>)}</select>;
}

function ProfileSection({ title, detail, tools, children }: { title: string; detail: string; tools?: React.ReactNode; children: React.ReactNode }) {
  return <section className="profile-section"><div className="profile-section-heading"><div><p className="eyebrow">{detail || "ATELIER"}</p><h2 className="section-heading">{title}</h2></div><div className="flex items-center gap-2">{tools}</div></div>{children}</section>;
}

function SectionTools({ addHref, editHref, addLabel, editLabel }: { addHref: string; editHref: string; addLabel: string; editLabel: string }) {
  return <div className="flex gap-1"><Link className="section-tool" href={addHref} aria-label={addLabel} title={addLabel}>+</Link><Link className="section-tool" href={editHref} aria-label={editLabel} title={editLabel}>✎</Link></div>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-line px-4 py-5 text-sm text-muted">{text}</p>;
}

function WishlistMiniCard({ href, title, meta }: { href: string; title: string; meta: string }) {
  return <Link href={href} className="block rounded-lg border border-line px-3 py-2.5 transition-colors hover:border-line-strong hover:bg-bg"><p className="line-clamp-1 text-sm font-medium">{title}</p><p className="mt-0.5 text-xs text-muted">{meta}</p></Link>;
}

function OwnerActions({ targetType, targetId, pinned, editHref, canSell }: { targetType: "collection" | "perfume"; targetId: string; pinned: boolean; editHref: string; canSell?: boolean }) {
  return <div className="profile-owner-actions"><Link className="card-action" href={editHref}>Edit</Link><form action={pinForm}><input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetId" value={targetId} /><button className="card-action" type="submit">{pinned ? "Unpin" : "Pin"}</button></form>{canSell ? <><form action={soldForm}><input type="hidden" name="id" value={targetId} /><button className="card-action" type="submit">Mark sold</button></form><form action={deletePerfumeForm}><input type="hidden" name="id" value={targetId} /><button className="card-action" type="submit">Delete</button></form></> : null}</div>;
}
