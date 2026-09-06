export type PerfumeFields = {
  imageUrl?: string | null;
  kind?: string | null;
  fill?: string | null;
  ml?: number | null;
  shippingIncluded?: boolean | null;
  description?: string | null;
  topNotes?: string | null;
  middleNotes?: string | null;
  baseNotes?: string | null;
  links?: { label: string; url: string }[] | string | null;
};

export function parseLinks(raw: string | { label: string; url: string }[] | null | undefined) {
  if (!raw) return [] as { label: string; url: string }[];
  if (Array.isArray(raw)) return raw.filter((l) => l.url);
  try {
    const parsed = JSON.parse(raw) as { label: string; url: string }[];
    return Array.isArray(parsed) ? parsed.filter((l) => l.url) : [];
  } catch {
    return [];
  }
}

export function perfumeCompletion(p: PerfumeFields) {
  const links = parseLinks(p.links);
  const needsFill = p.kind === "bottle" || p.kind === "tester";
  const hasNotes = Boolean(p.topNotes?.trim() || p.middleNotes?.trim() || p.baseNotes?.trim());
  const checks = [
    Boolean(p.imageUrl),
    Boolean(p.kind),
    ...(needsFill ? [Boolean(p.fill)] : []),
    p.ml != null && Number(p.ml) > 0,
    p.shippingIncluded === true,
    Boolean(p.description?.trim()),
    hasNotes,
    links.length > 0,
  ];
  const total = checks.length;
  const done = checks.filter(Boolean).length;
  return { done, total, percent: Math.round((done / total) * 100) };
}
