import { FRAGRANCE_CATALOG, type FragranceEntry } from "@/lib/fragrance-catalog";

const MAX_RESPONSE_BYTES = 900_000;

export type FragranticaImport = {
  brand: string;
  name: string;
  top: string[];
  middle: string[];
  base: string[];
  rating?: number;
  source: "fragrantica" | "atelier-catalogue";
};

export function validateFragranticaPerfumeUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.port || url.username || url.password) return null;
    if (hostname !== "fragrantica.com" && hostname !== "www.fragrantica.com") return null;
    if (!url.pathname.toLowerCase().startsWith("/perfume/")) return null;
    return url;
  } catch {
    return null;
  }
}

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleCaseSlug(value: string) {
  return decodeURIComponent(value)
    .replace(/\.html$/i, "")
    .replace(/-\d+$/, "")
    .split("-")
    .filter(Boolean)
    .map((part) => (/^(edp|edt|parfum|eau|de|du|le|la|pour|and|the|ii|iii|iv)$/i.test(part) ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`))
    .join(" ");
}

function detailsFromUrl(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);
  // Validated paths always start /perfume/<brand>/<perfume-slug>.
  return {
    brand: titleCaseSlug(parts[1] || ""),
    name: titleCaseSlug(parts[2] || ""),
  };
}

function catalogueMatch(url: URL): FragranceEntry | null {
  const fromUrl = detailsFromUrl(url);
  const brand = normalize(fromUrl.brand);
  const name = normalize(fromUrl.name);
  const candidates = FRAGRANCE_CATALOG.filter((entry) => normalize(entry.brand) === brand);
  return candidates
    .map((entry) => {
      const candidate = normalize(entry.name);
      const score = candidate === name ? 100 : candidate.startsWith(`${name} `) ? 90 : candidate.includes(name) ? 70 : 0;
      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.entry.rating - a.entry.rating)[0]?.entry ?? null;
}

function plain(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function notesIn(section: string) {
  const notes: string[] = [];
  for (const match of section.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
    const note = plain(match[1]);
    if (note && note.length <= 80 && !/^notes?$/i.test(note) && !notes.includes(note)) notes.push(note);
  }
  return notes.slice(0, 24);
}

function between(html: string, starts: RegExp, ends: RegExp[]) {
  const start = html.search(starts);
  if (start < 0) return "";
  const after = html.slice(start);
  const endAt = ends.map((end) => after.search(end)).filter((index) => index > 0).sort((a, b) => a - b)[0] ?? 6000;
  return after.slice(0, Math.min(endAt, 6000));
}

export function extractFragranticaNotes(html: string) {
  // Fragrantica's perfume pyramid is semantic HTML. We only retain visible
  // anchor text from each labelled section; scripts and attributes are ignored.
  const top = notesIn(between(html, /\btop\s+notes?\b/i, [/\bmiddle\s+notes?\b/i, /\bheart\s+notes?\b/i, /\bbase\s+notes?\b/i]));
  const middle = notesIn(between(html, /\b(?:middle|heart)\s+notes?\b/i, [/\bbase\s+notes?\b/i]));
  const base = notesIn(between(html, /\bbase\s+notes?\b/i, [/<\/main>/i, /<footer/i]));
  return { top, middle, base };
}

function pageTitle(html: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (!title) return null;
  const clean = plain(title).replace(/\s*\|\s*Fragrantica.*$/i, "").trim();
  // Typical title: "Sì Giorgio Armani perfume - a fragrance for women 2013"
  const match = clean.match(/^(.+?)\s+(.+?)\s+perfume\b/i);
  return match ? { name: match[1].trim(), brand: match[2].trim() } : null;
}

function isChallengePage(html: string) {
  return /just a moment|challenge-platform|cf_chl_opt|enable javascript and cookies/i.test(html);
}

export async function fetchFragranticaNotes(value: string): Promise<FragranticaImport> {
  const url = validateFragranticaPerfumeUrl(value);
  if (!url) throw new Error("Use an HTTPS Fragrantica perfume page link (fragrantica.com/perfume/…).");
  const fallback = catalogueMatch(url);

  // Most shared links are already in our curated catalogue. Return these
  // immediately: it is faster, dependable, and avoids making every creation
  // flow wait on Fragrantica's anti-bot challenge.
  if (fallback) {
    return {
      brand: fallback.brand,
      name: fallback.name,
      top: fallback.top,
      middle: fallback.middle,
      base: fallback.base,
      rating: fallback.rating,
      source: "atelier-catalogue",
    };
  }

  try {
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
      headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "Atelier/1.0 (+https://www.atelierperfumes.in)" },
    });
    const type = response.headers.get("content-type") || "";
    const length = Number(response.headers.get("content-length") || "0");
    if (!response.ok || !type.includes("text/html") || length > MAX_RESPONSE_BYTES) throw new Error("unavailable");
    const html = (await response.text()).slice(0, MAX_RESPONSE_BYTES);
    if (isChallengePage(html)) throw new Error("challenge");
    const notes = extractFragranticaNotes(html);
    if (!notes.top.length && !notes.middle.length && !notes.base.length) throw new Error("no-notes");
    const details = pageTitle(html) ?? detailsFromUrl(url);
    return { ...details, ...notes, source: "fragrantica" };
  } catch {
    // Fragrantica sometimes serves bot protection to a server request. The
    // bundled reference catalogue gives users a dependable, non-network
    // fallback without weakening the URL allow-list or acting as an open proxy.
  }

  const details = detailsFromUrl(url);
  throw new Error(`Fragrantica could not be reached for this page. We could not find ${details.brand} · ${details.name} in Atelier’s reference catalogue yet.`);
}
