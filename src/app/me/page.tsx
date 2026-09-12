import { redirect } from "next/navigation";
import { getActingUser } from "@/lib/acting";

export default async function MePage() {
  const acting = await getActingUser();
  if (!acting?.id) redirect("/login?from=/me");
  redirect(`/u/${acting.username}`);
}
