import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { getActingUser } from "@/lib/acting";

export default async function ProfilePage() {
  const acting = await getActingUser();
  if (!acting?.id) redirect("/login?from=/me/profile");
  const profile = await prisma.user.findUnique({ where: { id: acting.id } });
  if (!profile) redirect("/login?from=/me/profile");
  return <ProfileForm profile={profile} />;
}
