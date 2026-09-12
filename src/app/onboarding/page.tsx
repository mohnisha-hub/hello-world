import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/OnboardingForm";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/onboarding");
  const [profile, params] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    searchParams,
  ]);
  if (!profile) redirect("/login?from=/onboarding");
  const from = params.from?.startsWith("/") && !params.from.startsWith("//") ? params.from : "/me/profile";
  if (profile.usernameConfigured) redirect(from);
  return <OnboardingForm email={profile.email} photoUrl={profile.photoUrl} returnTo={from} />;
}
