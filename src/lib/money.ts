export function rupeesToPaise(value: string | number) {
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** @deprecated use rupeesToPaise — same conversion (major units × 100) */
export function dollarsToCents(value: string | number) {
  return rupeesToPaise(value);
}

export function formatMoney(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
}

export function pricePerMl(paise: number, ml?: number | null) {
  if (!ml || ml <= 0) return null;
  return paise / 100 / ml;
}

export function formatPricePerMl(paise: number, ml?: number | null) {
  const v = pricePerMl(paise, ml);
  if (v == null) return null;
  return `${formatMoney(Math.round(v * 100))}/ml`;
}
