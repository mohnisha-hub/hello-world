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
import { saveScentShowcaseAction, togglePodiumAction } from "@/actions/profile";
import { parseScentShowcase, SCENT_PROFILE_SLOTS } from "@/lib/showcase";
import { ScentHeartButton } from "@/components/ScentHeartButton";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { FRAGRANCE_CATALOG } from "@/lib/fragrance-catalog";
import { atelierBadges } from "@/lib/badges";

export default async function PublicProfilePage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ view?: string; shelfPage?: string; availablePage?: string; bidsPage?: string }> }) {
  const { username } = await params;
  const listingParams = await searchParams;
  const listingView = listingParams.view === "list" ? "list" : "cards";
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      pins: true,
      wishlist: true,
      collections: { include: { perfumes: true } },
      perfumes: { orderBy: { publishedAt: "desc" } },
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
  const shelfPerfumes = user.perfumes.filter((perfume) => perfume.status === "published" && perfume.listingIntent === "collection");
  const shelfPaging = paginate(shelfPerfumes, readPage(listingParams.shelfPage));
  const openBidListings = user.perfumes.filter((perfume) => perfume.status === "published" && perfume.listingIntent === "marketplace" && isBidListing(perfume.saleType) && !acceptedBidByPerfume.has(perfume.id));
  const acceptedBidListings = user.perfumes.filter((perfume) => perfume.status === "published" && perfume.listingIntent === "marketplace" && acceptedBidByPerfume.has(perfume.id));
  const availablePerfumes = user.perfumes.filter((perfume) => perfume.status === "published" && perfume.listingIntent === "marketplace" && !isBidListing(perfume.saleType));
  const soldPerfumes = user.perfumes.filter((perfume) => perfume.status === "sold");
  const bidHighs = openBidListings.length
    ? await prisma.bid.groupBy({
        by: ["perfumeId"],
        where: { perfumeId: { in: openBidListings.map((perfume) => perfume.id) }, kind: "bid", status: "open" },
        _max: { amountCents: true }, _count: { id: true },
      })
    : [];
  const bidStatsByPerfume = Object.fromEntries(bidHighs.map((bid) => [bid.perfumeId, { highest: bid._max.amountCents, count: bid._count.id }]));
  const availableListings = user.perfumes.filter((perfume) => perfume.status === "published" && perfume.listingIntent === "marketplace");
  const availablePaging = paginate(availablePerfumes, readPage(listingParams.availablePage));
  const bidPaging = paginate(openBidListings, readPage(listingParams.bidsPage));
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
  const scentHearts = await prisma.scentHeart.findMany({ where: { profileId: user.id }, select: { slot: true, userId: true } });
  const totalHearts = scentHearts.length;
  const heartCounts = Object.fromEntries(scentHearts.reduce((counts, heart) => counts.set(heart.slot, (counts.get(heart.slot) ?? 0) + 1), new Map<string, number>()));
  const heartedSlots = new Set(scentHearts.filter((heart) => heart.userId === session?.user?.id).map((heart) => heart.slot));
  const selectableShowcasePerfumes = [...shelfPerfumes].sort((a, b) => a.name.localeCompare(b.name));
  const shelfNotes = shelfNoteProfile(shelfPerfumes);
  const [discoveryCount, heartsGiven] = await Promise.all([
    prisma.bid.count({ where: { bidderId: user.id, kind: { in: ["bid", "buy"] } } }),
    prisma.scentHeart.count({ where: { userId: user.id } }),
  ]);
  const showcasePicks = new Set([...scentShowcase.top3, ...Object.values(scentShowcase.slots)].filter(Boolean)).size;
  const badges = atelierBadges({
    shelf: shelfPerfumes.length,
    brands: new Set(shelfPerfumes.map((perfume) => perfume.brand?.trim().toLowerCase()).filter(Boolean)).size,
    showcasePicks,
    wishlist: user.wishlist.length,
    marketplace: availableListings.length + soldPerfumes.length,
    discoveries: discoveryCount,
    heartsGiven,
    buyerRatings: rating?.count ?? 0,
    buyerRatingStars: rating ? rating.average / 2 : 0,
  });

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
          </div>
        </div>
        <div className="profile-stats">
          <div><p>{shelfPerfumes.length}</p><span>On shelf</span></div>
          <div><p>{availableListings.length}</p><span>Selling</span></div>
          <div><p>{user.wishlist.length}</p><span>Wishlist</span></div>
          <div><p>{rating ? `${rating.average.toFixed(1)} ★` : "—"}</p><span>{rating ? `${rating.count} buyer rating${rating.count === 1 ? "" : "s"}` : "Buyer ratings"}</span></div>
          <div><p>{totalHearts}</p><span>Hearts received</span></div>
        </div>
        {user.bio ? <p className="border-t border-line px-5 py-4 text-sm leading-6 sm:px-7">{user.bio}</p> : null}
      </section>
      <ProfileBadges badges={badges} username={user.username} isOwner={isOwner} />
      {isOwner && (user.profileStatus !== "published" || user.perfumes.length === 0) ? (
        <NewCollectorGuide profilePublished={user.profileStatus === "published"} />
      ) : null}
      <div className="profile-layout">
        <main className="profile-content">
          {topThree.length ? <TopThree perfumes={topThree} username={user.username} profileId={user.id} heartCounts={heartCounts} heartedSlots={heartedSlots} canHeart={Boolean(session?.user?.id && !isOwner)} /> : null}

          <ProfileSection title={isOwner ? "My shelf" : `@${user.username}'s shelf`} detail="Collection perfumes" tools={<div className="flex flex-wrap items-center gap-2"><ProfileListingControls username={user.username} view={listingView} page={shelfPaging.page} pageKey="shelfPage" />{isOwner ? <SectionTools addHref="/me/perfumes/new" editHref="/me/perfumes" addLabel="Add perfume" editLabel="Edit perfumes" /> : null}</div>}>
            {shelfPerfumes.length ? <><div className={listingView === "cards" ? "grid gap-3 sm:grid-cols-2" : "search-listings"}>{shelfPaging.items.map((perfume) => <div key={perfume.id} className="profile-shelf-perfume"><ProfilePerfumeDisplay perfume={perfume} view={listingView} username={user.username} showStatus={isOwner} />{!isOwner ? <ScentHeartButton profileId={user.id} perfumeId={perfume.id} slot={`shelf:${perfume.id}`} count={heartCounts[`shelf:${perfume.id}`] ?? 0} hearted={heartedSlots.has(`shelf:${perfume.id}`)} canHeart={Boolean(session?.user?.id)} variant="shelf" /> : null}{isOwner ? <OwnerActions targetType="perfume" targetId={perfume.id} pinned={pinIds.has(perfume.id)} editHref={`/me/perfumes/${perfume.id}/edit`} curated={scentShowcase.top3.includes(perfume.id)} canCurate={scentShowcase.top3.length < 3} /> : null}</div>)}</div><ProfilePagination username={user.username} pageKey="shelfPage" paging={shelfPaging} view={listingView} /></> : <EmptyState text={isOwner ? "Add a perfume to your shelf to share your collection." : "No shelf perfumes shared yet."} />}
          </ProfileSection>

          {availablePerfumes.length || openBidListings.length ? <section className="profile-section profile-marketplace">
            <div className="profile-section-heading"><div><p className="eyebrow">MARKETPLACE</p><h2 className="section-heading">Up for grabs</h2></div></div>
          {availablePerfumes.length ? <ProfileSection title="Buy now" detail="Ready to buy" tools={<div className="flex flex-wrap items-center gap-2"><ProfileListingControls username={user.username} view={listingView} page={availablePaging.page} pageKey="availablePage" />{isOwner ? <SectionTools addHref="/me/perfumes/new" editHref="/me/perfumes" addLabel="Add perfume" editLabel="Edit perfumes" /> : null}</div>}>
            {availablePerfumes.length ? (
              <><div className={listingView === "cards" ? "grid gap-3 sm:grid-cols-2" : "search-listings"}>
                {availablePaging.items.map((perfume) => (
                  <div key={perfume.id}>
                    <ProfilePerfumeDisplay perfume={perfume} view={listingView} username={user.username} showStatus={isOwner} />
                    {isOwner ? <OwnerActions targetType="perfume" targetId={perfume.id} pinned={pinIds.has(perfume.id)} editHref={`/me/perfumes/${perfume.id}/edit`} canSell /> : null}
                  </div>
                ))}
              </div><ProfilePagination username={user.username} pageKey="availablePage" paging={availablePaging} view={listingView} /></>
            ) : <EmptyState text="No buy-now perfumes at the moment." />}
          </ProfileSection> : null}

          {openBidListings.length ? <ProfileSection title="Accepting bids" detail={isOwner ? "Offers on your perfumes" : "Make an offer"} tools={<ProfileListingControls username={user.username} view={listingView} page={bidPaging.page} pageKey="bidsPage" />}>
            {openBidListings.length ? (
              <><div className={listingView === "cards" ? "grid gap-3 sm:grid-cols-2" : "search-listings"}>
                {bidPaging.items.map((perfume) => {
                  const minimum = listingAmountCents(perfume);
                  const stats = bidStatsByPerfume[perfume.id] ?? null;
                  const highest = stats?.highest ?? null;
                  return (
                    <div key={perfume.id} className="space-y-2">
                      <ProfilePerfumeDisplay perfume={perfume} view={listingView} username={user.username} showStatus={isOwner} />
                      <div className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm">
                        <p className="text-muted">Minimum bid {formatMoney(minimum)}</p><p className="mt-1 font-medium text-accent">{highest ? `Max bid ${formatMoney(highest)} · ${stats?.count} bid${stats?.count === 1 ? "" : "s"}` : "No bids received yet"}</p>
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
              </div><ProfilePagination username={user.username} pageKey="bidsPage" paging={bidPaging} view={listingView} /></>
            ) : <EmptyState text="No active bid listings right now." />}
          </ProfileSection> : null}
          </section> : null}

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
        </main>

        <aside className="profile-rail">
          {shelfNotes ? <ShelfNoteProfile profile={shelfNotes} /> : null}
          <section className="scent-profile-panel">
              <div className="mb-3"><p className="eyebrow">SCENT PROFILE</p><h2 className="mt-1 font-serif text-xl">{isOwner ? "My scent profile" : `@${user.username}'s scent profile`}</h2></div>
              {!isOwner && topThree.length ? <div className="scent-podium-preview"><p>Podium</p>{topThree.map((perfume, index) => <Link key={perfume.id} href={`/p/${perfume.id}`}><span>0{index + 1}</span><strong>{perfume.brand ? `${perfume.brand} · ` : ""}{perfume.name}</strong><b>↗</b></Link>)}</div> : null}
              {scentRoles.length ? <div className="scent-role-list">{scentRoles.map(({ key, label, perfume }) => <ScentRoleCard key={key} slot={key} label={label} perfume={perfume} username={user.username} profileId={user.id} heartCount={heartCounts[key] ?? 0} hearted={heartedSlots.has(key)} canHeart={Boolean(session?.user?.id && !isOwner)} />)}</div> : null}
              {isOwner ? <ScentProfileEditor perfumes={selectableShowcasePerfumes} topThree={scentShowcase.top3} slots={scentShowcase.slots} /> : null}
              {!isOwner && !topThree.length && !scentRoles.length ? <p className="text-sm leading-6 text-muted">This collector has not shared their scent picks yet.</p> : null}
          </section>
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

function ProfileBadges({ badges, username, isOwner }: { badges: ReturnType<typeof atelierBadges>; username: string; isOwner: boolean }) {
  const earned = badges.filter((badge) => badge.earned);
  const next = badges.find((badge) => !badge.earned);
  const href = (badge: (typeof badges)[number]) => badge.id === "muse" ? `/u/${username}#scent-profile` : badge.href;
  return <section className="profile-badges" aria-labelledby="profile-badges-heading">
    <div className="profile-badges-heading"><div><p className="eyebrow">ATELIER MARKS</p><h2 id="profile-badges-heading">{earned.length ? `${earned.length} badge${earned.length === 1 ? "" : "s"} collected` : "Your badge journey"}</h2></div>{isOwner && next ? <Link href={href(next)} className="profile-badge-next"><span>Next mark</span><strong><b aria-hidden="true">{next.icon}</b>{next.name} · {next.progress}</strong><em>{next.description}</em></Link> : null}</div>
    {earned.length ? <div className="profile-badge-list">{earned.map((badge) => <Link key={badge.id} className="profile-badge" href={href(badge)} title={badge.description}><span aria-hidden="true">{badge.icon}</span><strong>{badge.name}</strong></Link>)}</div> : <div className="profile-badge-empty"><span>✦</span><p>{isOwner ? "Add a perfume to your shelf to collect your first mark." : "This collector is just getting started."}</p></div>}
    {isOwner ? <details className="profile-badge-guide"><summary>See all badges you can earn</summary><div>{badges.filter((badge) => !badge.earned).map((badge) => <Link key={badge.id} href={href(badge)}><span aria-hidden="true">{badge.icon}</span><strong>{badge.name}</strong><small>{badge.progress} · {badge.description}</small></Link>)}</div></details> : null}
  </section>;
}

function ShelfNoteProfile({ profile }: { profile: { common: { note: string; count: number }[]; suggestions: string[] } }) {
  return <section className="shelf-note-profile">
    <div><p className="eyebrow">YOUR SCENT DNA</p><h2>Notes on your shelf</h2><p>Your most recurring accords, based on the perfumes you&apos;ve shared.</p></div>
    <div className="shelf-note-list">{profile.common.map(({ note, count }) => <Link key={note} href={`/explore?q=${encodeURIComponent(note)}#marketplace`}><strong>{note}</strong><span>in {count} perfumes</span></Link>)}</div>
    {profile.suggestions.length ? <div className="shelf-note-suggestions"><p>Try something new</p><div>{profile.suggestions.map((note) => <Link key={note} href={`/explore?q=${encodeURIComponent(note)}#marketplace`}>{note} ↗</Link>)}</div></div> : null}
  </section>;
}

function shelfNoteProfile(perfumes: { topNotes: string | null; middleNotes: string | null; baseNotes: string | null }[]) {
  // Three shelf entries makes this an actual profile rather than a guess.
  if (perfumes.length < 3) return null;
  const displayByKey = new Map<string, string>();
  const counts = new Map<string, number>();
  for (const perfume of perfumes) {
    for (const note of [perfume.topNotes, perfume.middleNotes, perfume.baseNotes].flatMap((value) => (value || "").split(",")).map((value) => value.trim()).filter(Boolean)) {
      const key = note.toLowerCase();
      displayByKey.set(key, displayByKey.get(key) || note);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const common = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5).map(([key, count]) => ({ note: displayByKey.get(key) || key, count }));
  if (common.length < 2) return null;
  const catalogCounts = new Map<string, { note: string; count: number }>();
  for (const entry of FRAGRANCE_CATALOG) {
    for (const note of [...entry.top, ...entry.middle, ...entry.base]) {
      const key = note.toLowerCase();
      if (counts.has(key)) continue;
      const existing = catalogCounts.get(key);
      catalogCounts.set(key, { note: existing?.note || note, count: (existing?.count ?? 0) + 1 });
    }
  }
  const suggestions = [...catalogCounts.values()].sort((a, b) => b.count - a.count || a.note.localeCompare(b.note)).slice(0, 4).map((item) => item.note);
  return { common, suggestions };
}

function NewCollectorGuide({ profilePublished }: { profilePublished: boolean }) {
  const next = profilePublished
    ? { href: "/me/perfumes/new", label: "Add your first perfume", copy: "Choose a shelf entry to share a favourite, or make a marketplace listing." }
    : { href: "/me/profile", label: "Publish your profile", copy: "A public profile is how other collectors find your shelf and listings." };
  return <section className="rounded-2xl border border-line bg-paper p-4 shadow-[0_12px_28px_rgba(46,34,23,.06)] sm:p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">YOUR ATELIER, STARTED</p><h2 className="mt-1 font-serif text-2xl">One small step at a time.</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{next.copy}</p></div><Link href={next.href} className="btn shrink-0">{next.label}</Link></div>
    <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-3"><li className={`rounded-xl border px-3 py-2 ${profilePublished ? "border-accent/30 bg-accent/5 text-muted" : "border-accent bg-accent/10"}`}><span className="eyebrow block">01</span>{profilePublished ? "Profile published" : "Publish your profile"}</li><li className={`rounded-xl border px-3 py-2 ${profilePublished ? "border-accent bg-accent/10" : "border-line text-muted"}`}><span className="eyebrow block">02</span>Add a perfume</li><li className="rounded-xl border border-line px-3 py-2 text-muted"><span className="eyebrow block">03</span>Discover collectors</li></ol>
  </section>;
}

function TopThree({ perfumes, username, profileId, heartCounts, heartedSlots, canHeart }: { perfumes: { id: string; name: string; brand: string | null; imageUrl: string | null }[]; username: string; profileId: string; heartCounts: Record<string, number>; heartedSlots: Set<string>; canHeart: boolean }) {
  return <section className="top-three"><div className="mb-4"><p className="eyebrow">THE PODIUM</p><h2 className="section-heading">Top 3 perfumes</h2></div><div className="top-three-grid">{perfumes.map((perfume, index) => { const slot = `top${index + 1}`; return <div key={perfume.id} className={`top-three-card top-three-rank-${index + 1}`}><Link href={`/p/${perfume.id}`}><span className="top-three-rank">0{index + 1}</span><span><small>{perfume.brand || "Perfume"}</small><strong>{perfume.name}</strong><em>@{username}</em></span></Link><ScentHeartButton profileId={profileId} perfumeId={perfume.id} slot={slot} count={heartCounts[slot] ?? 0} hearted={heartedSlots.has(slot)} canHeart={canHeart} variant="podium" /></div>; })}</div></section>;
}

function ScentRoleCard({ slot, label, perfume, username, profileId, heartCount, hearted, canHeart }: { slot: string; label: string; perfume: { id: string; name: string; brand: string | null }; username: string; profileId: string; heartCount: number; hearted: boolean; canHeart: boolean }) {
  return <div className="scent-role-card"><Link href={`/p/${perfume.id}`}><span>{label}</span><strong>{perfume.brand ? `${perfume.brand} · ` : ""}{perfume.name}</strong><small>@{username} ↗</small></Link><ScentHeartButton profileId={profileId} perfumeId={perfume.id} slot={slot} count={heartCount} hearted={hearted} canHeart={canHeart} variant="role" /></div>;
}

function ScentProfileEditor({ perfumes, topThree, slots }: { perfumes: { id: string; name: string; brand: string | null }[]; topThree: string[]; slots: Record<string, string | undefined> }) {
  if (!perfumes.length) return <p className="mt-3 text-sm leading-6 text-muted">Publish a perfume to start your scent profile.</p>;
  return <div className="scent-profile-editor"><p className="mb-3 text-xs leading-5 text-muted">Choose the perfumes that tell your scent story. Your Podium stays at the top of your profile.</p><form action={saveScentShowcaseAction}><fieldset><legend>Top 3</legend>{["top1", "top2", "top3"].map((name, index) => <label key={name}>#{index + 1}<ShowcaseSelect name={name} value={topThree[index]} perfumes={perfumes} /></label>)}</fieldset><fieldset><legend>Roles</legend>{SCENT_PROFILE_SLOTS.map(([key, label]) => <label key={key}>{label}<ShowcaseSelect name={key} value={slots[key]} perfumes={perfumes} /></label>)}</fieldset><button className="btn btn-compact" type="submit">Save scent profile</button></form></div>;
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

const PROFILE_PAGE_SIZE = 12;
function readPage(value?: string) { const page = Number(value); return Number.isInteger(page) && page > 0 ? page : 1; }
function paginate<T>(items: T[], requestedPage: number) { const pageCount = Math.max(1, Math.ceil(items.length / PROFILE_PAGE_SIZE)); const page = Math.min(requestedPage, pageCount); return { items: items.slice((page - 1) * PROFILE_PAGE_SIZE, page * PROFILE_PAGE_SIZE), page, pageCount, count: items.length }; }
type ProfilePageKey = "shelfPage" | "availablePage" | "bidsPage";
function listingHref(username: string, view: "list" | "cards", pageKey: ProfilePageKey, page: number) { return `/u/${username}?view=${view}&${pageKey}=${page}`; }
function ProfileListingControls({ username, view, page, pageKey }: { username: string; view: "list" | "cards"; page: number; pageKey: ProfilePageKey }) { return <div className="search-view-toggle" aria-label="Listing display"><Link className={view === "list" ? "is-active" : ""} href={listingHref(username, "list", pageKey, page)}>List</Link><Link className={view === "cards" ? "is-active" : ""} href={listingHref(username, "cards", pageKey, page)}>Cards</Link></div>; }
function ProfilePagination({ username, pageKey, paging, view }: { username: string; pageKey: ProfilePageKey; paging: { page: number; pageCount: number; count: number }; view: "list" | "cards" }) { if (paging.pageCount < 2) return null; const start = (paging.page - 1) * PROFILE_PAGE_SIZE + 1; const end = Math.min(paging.page * PROFILE_PAGE_SIZE, paging.count); return <nav className="listing-pagination" aria-label="Profile listing pages"><span>{start}–{end} of {paging.count}</span><div>{paging.page > 1 ? <Link href={listingHref(username, view, pageKey, paging.page - 1)}>Previous</Link> : <span>Previous</span>}{Array.from({ length: paging.pageCount }, (_, index) => index + 1).map((number) => <Link key={number} className={number === paging.page ? "is-active" : ""} aria-current={number === paging.page ? "page" : undefined} href={listingHref(username, view, pageKey, number)}>{number}</Link>)}{paging.page < paging.pageCount ? <Link href={listingHref(username, view, pageKey, paging.page + 1)}>Next</Link> : <span>Next</span>}</div></nav>; }
function ProfilePerfumeDisplay({ perfume, view, username, showStatus }: { perfume: Parameters<typeof PerfumeCard>[0]["perfume"]; view: "list" | "cards"; username: string; showStatus: boolean }) {
  if (view === "cards") return <PerfumeCard perfume={perfume} href={`/p/${perfume.id}`} showStatus={showStatus} />;
  const amount = listingAmountCents(perfume);
  const shelfPerfume = perfume.listingIntent === "collection";
  return <Link href={`/p/${perfume.id}`} className="search-listing">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={perfume.imageUrl || "/atelier/atelier-perfume-cover.png"} alt="" />
    <span className="search-listing-copy"><small>{perfume.brand || "Perfume"}</small><strong>{perfume.name}</strong><em>@{username}</em></span>
    <span className="search-listing-details">{shelfPerfume ? "On their shelf" : `${perfume.kind ? `${perfume.kind} · ` : ""}${perfume.ml ? `${perfume.ml} ml` : ""}`}</span>
    {!shelfPerfume ? <><span className="search-listing-price">{isBidListing(perfume.saleType) ? `From ${formatMoney(amount)}` : formatMoney(amount)}</span><span className="listing-live-dot" aria-label="Available" /></> : null}
  </Link>;
}

function WishlistMiniCard({ href, title, meta }: { href: string; title: string; meta: string }) {
  return <Link href={href} className="block rounded-lg border border-line px-3 py-2.5 transition-colors hover:border-line-strong hover:bg-bg"><p className="line-clamp-1 text-sm font-medium">{title}</p><p className="mt-0.5 text-xs text-muted">{meta}</p></Link>;
}

function OwnerActions({ targetType, targetId, pinned, editHref, canSell, curated, canCurate }: { targetType: "collection" | "perfume"; targetId: string; pinned: boolean; editHref: string; canSell?: boolean; curated?: boolean; canCurate?: boolean }) {
  return <div className="profile-owner-actions"><Link className="card-action" href={editHref}>Edit</Link>{targetType === "perfume" && (curated || canCurate) ? <form action={togglePodiumAction}><input type="hidden" name="perfumeId" value={targetId} /><button className="card-action" type="submit">{curated ? "Remove from Podium" : "Move to Podium"}</button></form> : null}<form action={pinForm}><input type="hidden" name="targetType" value={targetType} /><input type="hidden" name="targetId" value={targetId} /><button className="card-action" type="submit">{pinned ? "Unpin" : "Pin"}</button></form>{canSell ? <><form action={soldForm}><input type="hidden" name="id" value={targetId} /><button className="card-action" type="submit">Mark sold</button></form><form action={deletePerfumeForm}><input type="hidden" name="id" value={targetId} /><ConfirmDeleteButton className="card-action card-action-danger" confirmation="Remove this perfume from your public profile? It will be moved to Drafts & deleted, where you can restore it later.">Delete</ConfirmDeleteButton></form></> : null}</div>;
}
