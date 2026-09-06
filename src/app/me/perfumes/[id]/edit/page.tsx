import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PerfumeForm } from "@/components/PerfumeForm";
import { getActingUser } from "@/lib/acting";

export default async function EditPerfumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const acting = await getActingUser();
  if (!acting?.id) redirect("/login?from=/me");
  const perfume = await prisma.perfume.findFirst({ where: { id, ownerId: acting.id } });
  if (!perfume) notFound();
  const collections = await prisma.collection.findMany({
    where: { ownerId: acting.id, NOT: { status: "deleted" } },
    select: { id: true, name: true },
  });
  return <PerfumeForm perfume={perfume} collections={collections} />;
}
