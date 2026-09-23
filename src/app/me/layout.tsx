import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/me");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true, usernameConfigured: true },
  });
  if (!user) redirect("/login?from=/me");
  if (!user.usernameConfigured) redirect("/onboarding?from=/me");
  return <>{children}</>;
}
