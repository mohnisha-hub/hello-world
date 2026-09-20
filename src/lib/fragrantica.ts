const MAX_RESPONSE_BYTES = 900_000;

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

export async function fetchFragranticaNotes(value: string) {
  const url = validateFragranticaPerfumeUrl(value);
  if (!url) throw new Error("Use an HTTPS Fragrantica perfume page link (fragrantica.com/perfume/…).");
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(8_000),
    headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "Atelier/1.0 (+https://www.atelierperfumes.in)" },
  });
  if (!response.ok) throw new Error("That Fragrantica page could not be retrieved.");
  const type = response.headers.get("content-type") || "";
  const length = Number(response.headers.get("content-length") || "0");
  if (!type.includes("text/html") || length > MAX_RESPONSE_BYTES) throw new Error("That link did not return a safe perfume page.");
  const html = (await response.text()).slice(0, MAX_RESPONSE_BYTES);
  const notes = extractFragranticaNotes(html);
  if (!notes.top.length && !notes.middle.length && !notes.base.length) throw new Error("We could not find a fragrance note pyramid on that page.");
  return notes;
}
