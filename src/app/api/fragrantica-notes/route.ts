import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchFragranticaNotes, validateFragranticaPerfumeUrl } from "@/lib/fragrantica";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!(await auth())?.user?.id) return NextResponse.json({ error: "Sign in to import fragrance notes." }, { status: 401 });
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== "string" || body.url.length > 1_500) return NextResponse.json({ error: "Enter a Fragrantica perfume page link." }, { status: 400 });
    const url = validateFragranticaPerfumeUrl(body.url);
    if (!url) return NextResponse.json({ error: "Use an HTTPS Fragrantica perfume page link (fragrantica.com/perfume/…)." }, { status: 400 });
    try {
      const notes = await fetchFragranticaNotes(url.href);
      return NextResponse.json(notes, { headers: { "Cache-Control": "private, no-store" } });
    } catch (importError) {
      // A published listing is a durable, vetted fallback for a link that
      // Fragrantica currently blocks from server-side access.
      const stored = await prisma.perfume.findFirst({
        where: {
          status: "published",
          links: { contains: url.href },
          owner: { profileStatus: "published" },
        },
        orderBy: { updatedAt: "desc" },
        select: { brand: true, name: true, topNotes: true, middleNotes: true, baseNotes: true, catalogRating: true },
      });
      if (stored && (stored.topNotes || stored.middleNotes || stored.baseNotes)) {
        const split = (value: string | null) => (value || "").split(",").map((note) => note.trim()).filter(Boolean);
        return NextResponse.json({
          brand: stored.brand || "",
          name: stored.name,
          top: split(stored.topNotes),
          middle: split(stored.middleNotes),
          base: split(stored.baseNotes),
          rating: stored.catalogRating ?? undefined,
          source: "atelier-listing",
        }, { headers: { "Cache-Control": "private, no-store" } });
      }
      throw importError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not import notes from that link.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
