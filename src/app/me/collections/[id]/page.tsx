import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { CollectionForm } from "@/components/CollectionForm";
import { PerfumeCard } from "@/components/Cards";
import Link from "next/link";
import { deleteCollectionForm } from "@/actions/form-wrappers";
import { getActingUser } from "@/lib/acting";

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const acting = await getActingUser();
  if (!acting?.id) redirect("/login?from=/me");
  const collection = await prisma.collection.findFirst({
    where: { id, ownerId: acting.id },
    include: { perfumes: true },
  });
  if (!collection) notFound();
  return (
    <div className="space-y-8">
      <CollectionForm
        collection={collection}
        publishedPerfumeCount={collection.perfumes.filter((p) => p.status === "published").length}
      />
      <div className="flex gap-3">
        <Link className="btn" href={`/me/perfumes/new?collectionId=${collection.id}`}>
          Add perfume to this collection
        </Link>
        <form action={deleteCollectionForm}>
          <input type="hidden" name="id" value={collection.id} />
          <button className="btn btn-ghost" type="submit">
            Delete collection
          </button>
        </form>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {collection.perfumes
          .filter((p) => p.status !== "deleted")
          .map((p) => (
          <PerfumeCard key={p.id} perfume={p} href={`/me/perfumes/${p.id}/edit`} showStatus />
        ))}
      </div>
    </div>
  );
}
