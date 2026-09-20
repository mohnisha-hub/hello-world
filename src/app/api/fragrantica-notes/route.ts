import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchFragranticaNotes } from "@/lib/fragrantica";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!(await auth())?.user?.id) return NextResponse.json({ error: "Sign in to import fragrance notes." }, { status: 401 });
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== "string" || body.url.length > 1_500) return NextResponse.json({ error: "Enter a Fragrantica perfume page link." }, { status: 400 });
    const notes = await fetchFragranticaNotes(body.url);
    return NextResponse.json(notes, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not import notes from that link.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
