import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { isPublicProfile } from "@/lib/visibility";
import { parseScentShowcase } from "@/lib/showcase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PALETTES = [["#7dd3fc", "#1d4ed8"], ["#f0abfc", "#7e22ce"], ["#fda4af", "#be123c"], ["#6ee7b7", "#047857"], ["#fde68a", "#b45309"]];
function numberFor(value: string) { return Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0); }
function short(value: string, max: number) { return value.length > max ? `${value.slice(0, max - 1)}…` : value; }

export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await prisma.user.findUnique({ where: { username }, select: { username: true, profileStatus: true, scentShowcase: true, perfumes: { where: { status: { in: ["published", "sold"] } }, select: { id: true, brand: true, name: true } } } });
  if (!user || !isPublicProfile(user.profileStatus)) return new Response("Not found", { status: 404 });

  const byId = new Map(user.perfumes.map((perfume) => [perfume.id, perfume]));
  const topThree = parseScentShowcase(user.scentShowcase).top3.map((id) => byId.get(id)).filter((perfume): perfume is NonNullable<typeof perfume> => Boolean(perfume));
  if (topThree.length !== 3) return new Response("Complete your Podium first", { status: 422 });

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(145deg, #101a30 0%, #172755 52%, #362449 100%)", color: "#f7f6f3", padding: 72, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 780, height: 780, borderRadius: 9999, background: "radial-gradient(circle, rgba(142, 190, 255, .22) 0%, transparent 70%)", left: 210, top: -320 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 25, letterSpacing: 5, color: "#b9c7e7" }}><span>ATELIER</span><span>SCENT PODIUM</span></div>
      <div style={{ marginTop: 56, display: "flex", fontSize: 62, lineHeight: 1.05, fontFamily: "serif" }}>The scents that stay with me.</div>
      <div style={{ marginTop: 24, display: "flex", fontSize: 28, color: "#d9def0" }}>@{user.username}&apos;s top three</div>
      <div style={{ position: "relative", marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 28, height: 510 }}>
        {topThree.map((perfume, index) => {
          const [light, dark] = PALETTES[numberFor(`${perfume.brand ?? ""}${perfume.name}`) % PALETTES.length];
          const height = [330, 445, 375][index];
          return <div key={perfume.id} style={{ width: 290, height, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", borderRadius: "42px 42px 26px 26px", background: `linear-gradient(150deg, ${light}, ${dark})`, boxShadow: "0 24px 50px rgba(0,0,0,.35)", padding: "0 24px 32px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, width: 116, height: 52, background: "#d9dfed", borderRadius: "0 0 15px 15px", display: "flex" }} /><div style={{ position: "absolute", top: 52, width: 170, height: 188, border: "2px solid rgba(255,255,255,.34)", borderRadius: 22, background: "rgba(8,18,40,.16)", display: "flex" }} />
            <div style={{ display: "flex", fontSize: 27, color: "rgba(255,255,255,.82)", letterSpacing: 3, textAlign: "center", textTransform: "uppercase" }}>{perfume.brand ? short(perfume.brand, 16) : "ATELIER"}</div><div style={{ marginTop: 12, display: "flex", fontSize: 34, lineHeight: 1.1, textAlign: "center", fontFamily: "serif" }}>{short(perfume.name, 24)}</div><div style={{ marginTop: 22, display: "flex", fontSize: 22, color: "rgba(255,255,255,.75)" }}>0{index + 1}</div>
          </div>;
        })}
      </div>
      <div style={{ marginTop: 44, display: "flex", justifyContent: "center", fontSize: 23, letterSpacing: 2, color: "#cbd8f4" }}>atelierperfumes.in</div>
    </div>, { width: 1080, height: 1080 },
  );
}
