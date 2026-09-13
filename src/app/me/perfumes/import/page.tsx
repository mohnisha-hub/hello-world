import Link from "next/link";
import { redirect } from "next/navigation";
import { getActingUser } from "@/lib/acting";
import { importPerfumesAction } from "@/actions/listings";

export default async function ImportPerfumesPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const acting = await getActingUser();
  if (!acting?.id) redirect("/login?from=/me/perfumes/import");
  const { notice } = await searchParams;
  return <div className="mx-auto max-w-2xl space-y-6"><Link href="/me/perfumes">← Perfumes</Link><div><p className="eyebrow">BULK LISTINGS</p><h1 className="mt-2 text-4xl">Import perfumes</h1><p className="mt-2 text-muted">Download the template, fill one row per perfume, then import. Every row arrives as a draft for review.</p></div>{notice ? <p className="rounded-xl border border-line bg-paper p-3 text-sm">{notice}</p> : null}<div className="card space-y-4 p-5"><a className="btn btn-ghost" href="/api/templates/perfume-import">Download CSV template</a><form action={importPerfumesAction} className="space-y-4"><label className="field">Completed CSV <input name="file" type="file" accept=".csv,text/csv" required /></label><button className="btn" type="submit">Import as drafts</button></form><p className="text-xs leading-5 text-muted">Required: name, listing_type (buy or bid), kind (retail, tester, partial, or decant), ml, plus price_inr for buy listings or min_bid_inr for bids. Images use Atelier cover art.</p></div></div>;
}
