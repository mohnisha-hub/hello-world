export const SCENT_PROFILE_SLOTS = [
  ["daily", "Daily driver"],
  ["dateNight", "Date night"],
  ["office", "Office"],
  ["blue", "Blue scent"],
  ["gourmand", "Gourmand"],
  ["signature", "Signature"],
  ["summer", "Summer pick"],
  ["winter", "Winter pick"],
  ["compliment", "Most complimented"],
] as const;

export type ScentProfileSlot = (typeof SCENT_PROFILE_SLOTS)[number][0];
export type ScentShowcase = { top3: string[]; slots: Partial<Record<ScentProfileSlot, string>> };

export function parseScentShowcase(value?: string | null): ScentShowcase {
  try {
    const parsed = JSON.parse(value || "{}") as Partial<ScentShowcase>;
    const top3 = Array.isArray(parsed.top3) ? parsed.top3.filter((id): id is string => typeof id === "string").slice(0, 3) : [];
    const slots = Object.fromEntries(
      SCENT_PROFILE_SLOTS.flatMap(([key]) => typeof parsed.slots?.[key] === "string" ? [[key, parsed.slots[key]]] : []),
    ) as ScentShowcase["slots"];
    return { top3, slots };
  } catch {
    return { top3: [], slots: {} };
  }
}
