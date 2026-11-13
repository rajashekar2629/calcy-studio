/** Display formatting helpers. Rounding happens here only, never in calculation code. */

/** Round to N significant digits to remove floating-point noise (0.30000000000000004 -> 0.3). */
export function normalizeSignificant(n: number, digits = 15): number {
  if (!Number.isFinite(n) || n === 0) return n;
  return Number(n.toPrecision(digits));
}

/** Plain decimal for mid-range values, exponent notation for very large or very small ones. */
export function formatPlain(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e15 || abs < 1e-6) return n.toExponential();
  return String(n);
}

/** Indian-grouped rupee amount with exactly two decimals. */
export function formatMoney(n: number): string {
  const sign = n < 0 ? '-' : '';
  return (
    sign +
    '₹' +
    Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

/** Whole number with thousands separators (international grouping, easier for huge counts). */
export function formatInteger(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}
