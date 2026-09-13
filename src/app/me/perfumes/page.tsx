import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/acting";
import { PerfumeCard } from "@/components/Cards";

export default async function PerfumesPage() {
  const acting = await getActingUser();
  if (!acting?.id) redirect("/login?from=/me/perfumes");
  const perfumes = await prisma.perfume.findMany({ where: { ownerId: acting.id, NOT: { status: "deleted" } }, orderBy: { updatedAt: "desc" } });
  return <div className="space-y-7"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6"><div><p className="eyebrow">Listing studio</p><h1 className="mt-2 text-4xl">Edit perfumes</h1><p className="mt-2 text-muted">Choose a listing to update its details, pricing, or visibility.</p></div><div className="flex flex-wrap gap-2"><Link className="btn btn-ghost" href="/me/perfumes/import">Import CSV</Link><Link className="btn" href="/me/perfumes/new">Add perfume</Link></div></div>{perfumes.length ? <div className="grid gap-3 sm:grid-cols-2">{perfumes.map((perfume) => <PerfumeCard key={perfume.id} perfume={perfume} href={`/me/perfumes/${perfume.id}/edit`} showStatus />)}</div> : <p className="rounded-xl border border-dashed border-line p-5 text-muted">No perfumes yet. Add your first listing to begin.</p>}</div>;
}
