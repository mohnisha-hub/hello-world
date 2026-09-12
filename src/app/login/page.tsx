import { LoginForm } from "@/components/LoginForm";
import { DATABASE_UNAVAILABLE, isDatabaseConfigured } from "@/lib/db";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const next = from?.startsWith("/") && !from.startsWith("//") ? from : "/onboarding";
  return (
    <LoginForm
      from={next}
      setupError={isDatabaseConfigured() ? null : DATABASE_UNAVAILABLE}
      googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
    />
  );
}
