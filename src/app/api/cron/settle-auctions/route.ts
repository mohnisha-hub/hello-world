import { NextResponse } from "next/server";
import { settleExpiredAuctions } from "@/lib/auctions";
import { clearExpiredRateLimits } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse("Unauthorized", { status: 401 });
  await Promise.all([settleExpiredAuctions(), clearExpiredRateLimits()]);
  return NextResponse.json({ ok: true });
}
