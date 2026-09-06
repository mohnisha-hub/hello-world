import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CollectionCard, PerfumeCard } from "@/components/Cards";
import { restoreForm } from "@/actions/form-wrappers";
import Link from "next/link";
import { getActingUser } from "@/lib/acting";

export default async function DraftsPage() {
  const acting = await getActingUser();
  if (!acting?.id) redirect("/login?from=/me/drafts");
  const [collections, perfumes] = await Promise.all([
    prisma.collection.findMany({
      where: { ownerId: acting.id, status: { in: ["draft", "deleted"] } },
      include: { perfumes: true },
    }),
    prisma.perfume.findMany({
      where: { ownerId: acting.id, status: { in: ["draft", "deleted"] } },
    }),
  ]);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl">Drafts & deleted</h1>
        <p className="text-muted">Nothing here is visible to the community until you publish it again.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2">
        {collections.map((c) => (
          <div key={c.id}>
            <CollectionCard
              collection={c}
              perfumeCount={c.perfumes.length}
              href={`/me/collections/${c.id}`}
              showStatus
            />
            {c.status === "deleted" ? (
              <form action={restoreForm} className="p-2">
                <input type="hidden" name="type" value="collection" />
                <input type="hidden" name="id" value={c.id} />
                <button className="btn-ghost text-sm" type="submit">
                  Restore to draft
                </button>
              </form>
            ) : null}
          </div>
        ))}
        {perfumes.map((p) => (
          <div key={p.id}>
            <PerfumeCard perfume={p} href={`/me/perfumes/${p.id}/edit`} showStatus />
            {p.status === "deleted" ? (
              <form action={restoreForm} className="p-2">
                <input type="hidden" name="type" value="perfume" />
                <input type="hidden" name="id" value={p.id} />
                <button className="btn-ghost text-sm" type="submit">
                  Restore to draft
                </button>
              </form>
            ) : (
              <p className="p-2 text-sm">
                <Link href={`/me/perfumes/${p.id}/edit`}>Keep editing</Link>
              </p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
