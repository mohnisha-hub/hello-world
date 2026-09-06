import { redirect } from "next/navigation";
import { CollectionForm } from "@/components/CollectionForm";
import { getActingUser } from "@/lib/acting";

export default async function NewCollectionPage() {
  const acting = await getActingUser();
  if (!acting?.id) redirect("/login?from=/me/collections/new");
  return <CollectionForm />;
}
