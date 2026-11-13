/** Strict input parsers. They return null for empty or malformed input; they never coerce. */

const UNSIGNED_DECIMAL = /^(\d+\.?\d*|\.\d+)$/;
const SIGNED_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
const UNSIGNED_INTEGER = /^\d+$/;

export const isBlank = (raw: string): boolean => raw.trim() === '';

/** Non-negative plain decimal such as "12", "12.5", ".5". */
export function parseUnsignedDecimal(raw: string): number | null {
  const s = raw.trim();
  if (!UNSIGNED_DECIMAL.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Any finite number, optionally signed and in scientific notation ("-1.5e-7"). */
export function parseSignedNumber(raw: string): number | null {
  const s = raw.trim();
  if (!SIGNED_NUMBER.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Digits only. Rejects "1.5", "-3", "1e3", " ", "". */
export function parseUnsignedInteger(raw: string): number | null {
  const s = raw.trim();
  if (!UNSIGNED_INTEGER.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
}
