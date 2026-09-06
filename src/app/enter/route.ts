import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from") || "/me/profile";
  const safeFrom = from.startsWith("/") && !from.startsWith("//") ? from : "/me/profile";
  redirect(`/login?from=${encodeURIComponent(safeFrom)}`);
}
