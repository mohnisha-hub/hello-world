import Link from "next/link";

export default function CreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Atelier studio</p>
        <h1 className="mt-2 text-4xl">Create a listing or collection</h1>
        <p className="mt-2 text-muted">Start with a standalone perfume, or create a collection and add a published perfume before taking it live.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/me/perfumes/new" className="card p-6 transition-colors hover:border-muted">
          <h2 className="text-2xl">List a perfume</h2>
          <p className="mt-2 text-muted">Set a buy price or minimum bid, then add as much provenance and scent detail as you have.</p>
        </Link>
        <Link href="/me/collections/new" className="card p-6 transition-colors hover:border-muted">
          <h2 className="text-2xl">Create a collection</h2>
          <p className="mt-2 text-muted">Save its name and image first, then add and publish at least one perfume before publishing the collection.</p>
        </Link>
      </div>
    </div>
  );
}
