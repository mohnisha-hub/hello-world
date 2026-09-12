import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { usernameConfigured: true },
    });
    if (user && !user.usernameConfigured) redirect("/onboarding?from=/");
  }
  return (
    <iframe
      title="Atelier marketplace"
      src="/atelier/classic.html"
      className="fixed inset-0 h-screen w-screen border-0"
    />
  );
}
