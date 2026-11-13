/**
 * Proleptic Gregorian calendar helpers.
 *
 * All functions work on ASTRONOMICAL years: 1 CE = 1, 1 BCE = 0, 2 BCE = -1, ...
 * The UI never shows year 0; it converts with toAstronomicalYear / fromAstronomicalYear.
 * Dates before 1582 are mathematical extensions of the Gregorian rules,
 * not reconstructions of the calendars actually used at the time.
 */
import type { Era } from '../types';
import { parseUnsignedInteger } from './parse';

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Mathematical modulo (always non-negative for positive b). */
export const mod = (a: number, b: number): number => ((a % b) + b) % b;

export function isLeapYear(astroYear: number): boolean {
  return mod(astroYear, 4) === 0 && (mod(astroYear, 100) !== 0 || mod(astroYear, 400) === 0);
}

export function daysInMonth(astroYear: number, month: number): number {
  return month === 2 && isLeapYear(astroYear) ? 29 : DAYS_IN_MONTH[month - 1];
}

/**
 * Days since 1970-01-01 for a proleptic Gregorian date (astronomical year).
 * Algorithm: Howard Hinnant's days_from_civil, valid for negative years.
 */
export function daysFromCivil(astroYear: number, month: number, day: number): number {
  const y = month <= 2 ? astroYear - 1 : astroYear;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400; // [0, 399]
  const mp = month > 2 ? month - 3 : month + 9; // March = 0
  const doy = Math.floor((153 * mp + 2) / 5) + day - 1; // [0, 365]
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy; // [0, 146096]
  return era * 146097 + doe - 719468;
}

/** Convert a displayed year + era (no year zero) to an astronomical year. */
export function toAstronomicalYear(year: number, era: Era): number {
  return era === 'CE' ? year : 1 - year;
}

/** Convert an astronomical year back to a displayed year + era. Never returns year 0. */
export function fromAstronomicalYear(astroYear: number): { year: number; era: Era } {
  return astroYear >= 1 ? { year: astroYear, era: 'CE' } : { year: 1 - astroYear, era: 'BCE' };
}

/**
 * Inline validation message for a typed year, or null when the text is empty or valid.
 * Digits only; year 0 does not exist; the range is checked against [min, max].
 */
export function validateYear(raw: string, min: number, max: number): string | null {
  if (raw.trim() === '') return null;
  const n = parseUnsignedInteger(raw);
  if (n === null) return 'Year must be digits only (no signs, decimals or spaces).';
  if (n === 0) return 'There is no year 0. Use 1 BCE or 1 CE.';
  if (n < min || n > max) return `Year must be between ${min} and ${max.toLocaleString('en-US')}.`;
  return null;
}
