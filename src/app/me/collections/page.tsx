import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/acting";
import { CollectionCard } from "@/components/Cards";

export default async function CollectionsPage() {
  const acting = await getActingUser();
  if (!acting?.id) redirect("/login?from=/me/collections");
  const collections = await prisma.collection.findMany({
    where: { ownerId: acting.id, NOT: { status: "deleted" } },
    include: { perfumes: true },
    orderBy: { updatedAt: "desc" },
  });
  return <div className="space-y-7"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6"><div><p className="eyebrow">Collection studio</p><h1 className="mt-2 text-4xl">Edit collections</h1><p className="mt-2 text-muted">Choose a collection to update its cover, visibility, and perfumes.</p></div><Link className="btn" href="/me/collections/new">Add Collection</Link></div>{collections.length ? <div className="grid gap-3 sm:grid-cols-2">{collections.map((collection) => <CollectionCard key={collection.id} collection={collection} perfumeCount={collection.perfumes.filter((perfume) => perfume.status !== "deleted").length} href={`/me/collections/${collection.id}`} showStatus />)}</div> : <p className="rounded-xl border border-dashed border-line p-5 text-muted">No collections yet. Add your first one to start curating.</p>}</div>;
}
