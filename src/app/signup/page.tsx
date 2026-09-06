import { SignupForm } from "@/components/SignupForm";
import { DATABASE_UNAVAILABLE, isDatabaseConfigured } from "@/lib/db";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const next = from?.startsWith("/") && !from.startsWith("//") ? from : "/me/profile";
  return <SignupForm from={next} setupError={isDatabaseConfigured() ? null : DATABASE_UNAVAILABLE} />;
}
