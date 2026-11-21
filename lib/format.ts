const nf = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹1,23,456 (Indian digit grouping). */
export function inr(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "–";
  const v = Math.round(n);
  return `${v < 0 ? "-" : ""}₹${nf.format(Math.abs(v))}`;
}

/** ₹1.69 Cr / ₹12.4 L for large numbers, otherwise full Indian grouping. */
export function inrShort(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "–";
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(1)} L`;
  return inr(n);
}

export function pct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function cleanName(name: string): string {
  return name.replace(/\s*\(synthetic\)\s*$/i, "");
}

export const FLAG_LABEL: Record<string, string> = {
  OVERBILLED: "Billed above rate card",
  DUPLICATE_BILL: "Possible double billing",
  DLP_PAID: "Paid during warranty (DLP)",
  DLP_REVIEW: "Check: drainage work on a warranty road",
};
