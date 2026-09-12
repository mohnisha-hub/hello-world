import Link from "next/link";

export default function CreatePage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-line pb-7">
        <p className="eyebrow">Atelier studio</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">What are you bringing in?</h1>
        <p className="mt-3 max-w-xl text-muted">Start with one perfume, or build a collection around a point of view.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/me/perfumes/new" className="card group p-6 transition-colors hover:border-muted">
          <p className="eyebrow">01 · Individual listing</p>
          <h2 className="mt-2 text-2xl group-hover:text-accent">List a perfume</h2>
          <p className="mt-2 text-sm text-muted">Set a buy price or minimum bid, then add the details that make it yours.</p>
        </Link>
        <Link href="/me/collections/new" className="card group p-6 transition-colors hover:border-muted">
          <p className="eyebrow">02 · Curated set</p>
          <h2 className="mt-2 text-2xl group-hover:text-accent">Create a collection</h2>
          <p className="mt-2 text-sm text-muted">Set a name and image, then add at least one perfume before you publish.</p>
        </Link>
      </div>
    </div>
  );
}
