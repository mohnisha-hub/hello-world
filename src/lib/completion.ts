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
};

export function perfumeCompletion(p: PerfumeFields) {
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
  ];
  const total = checks.length;
  const done = checks.filter(Boolean).length;
  return { done, total, percent: Math.round((done / total) * 100) };
}
