import { LoginForm } from "@/components/LoginForm";
import { DATABASE_UNAVAILABLE, isDatabaseConfigured } from "@/lib/db";

// The database URL is supplied by Vercel at request time. Rendering this page
// dynamically prevents a build-time environment snapshot from showing a false
// “database not connected” warning in production.
export const dynamic = "force-dynamic";

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
