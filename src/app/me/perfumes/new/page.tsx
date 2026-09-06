import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PerfumeForm } from "@/components/PerfumeForm";
import { getActingUser } from "@/lib/acting";

export default async function NewPerfumePage({
  searchParams,
}: {
  searchParams: Promise<{ collectionId?: string }>;
}) {
  const acting = await getActingUser();
  if (!acting?.id) redirect("/login?from=/me/perfumes/new");
  const { collectionId } = await searchParams;
  const collections = await prisma.collection.findMany({
    where: { ownerId: acting.id, NOT: { status: "deleted" } },
    select: { id: true, name: true },
  });
  return <PerfumeForm collections={collections} defaultCollectionId={collectionId} />;
}
