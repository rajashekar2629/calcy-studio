/**
 * Age / elapsed-time calculator for 10,000 BCE - 10,000 CE.
 *
 * - The UI uses CE/BCE years with NO year zero (1 BCE is followed by 1 CE).
 * - Internally every year is astronomical: 1 CE = 1, 1 BCE = 0, 2 BCE = -1, ...
 * - Dates follow the proleptic Gregorian calendar (leap years by the Gregorian rule applied
 *   to astronomical years). Ancient dates are mathematical calculations, not historical
 *   reconstructions of the calendars used at the time.
 * - Times are naive wall-clock values: no time zones, no daylight saving, no leap seconds.
 */
import type { DateTimeFields, Era, Result } from '../../types';
import {
  MONTH_NAMES,
  daysFromCivil,
  daysInMonth,
  fromAstronomicalYear,
  toAstronomicalYear,
} from '../../utils/calendar';
import { formatInteger, plural } from '../../utils/format';
import { isBlank, parseUnsignedInteger } from '../../utils/parse';

export const MIN_DISPLAY_YEAR = 1;
export const MAX_DISPLAY_YEAR = 10000;
const SECONDS_PER_DAY = 86400;

export interface ParsedDateTime {
  /** Astronomical year (no year zero issue). */
  astroYear: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Complete units elapsed (rounded down). */
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  fromLabel: string;
  toLabel: string;
}

export const emptyDateTime = (): DateTimeFields => ({
  year: '',
  era: 'CE',
  month: '',
  day: '',
  hour: '',
  minute: '',
  second: '',
});

/** Largest valid day for the selected year/era/month; 31 when it cannot be determined yet. */
export function getMaxDay(year: string, era: Era, month: string): number {
  const y = parseUnsignedInteger(year);
  const m = parseUnsignedInteger(month);
  if (m === null || m < 1 || m > 12) return 31;
  if (y === null || y < MIN_DISPLAY_YEAR || y > MAX_DISPLAY_YEAR) {
    return m === 2 ? 29 : daysInMonth(2001, m); // year unknown: allow the leap day
  }
  return daysInMonth(toAstronomicalYear(y, era), m);
}

function parseTimeField(
  raw: string,
  name: string,
  max: number,
  label: string,
  errors: string[],
): number {
  if (isBlank(raw)) return 0; // optional: blank means 0
  const n = parseUnsignedInteger(raw);
  if (n === null || n > max) {
    errors.push(`${label}: ${name} must be a whole number from 0 to ${max}.`);
    return 0;
  }
  return n;
}

export function validateDateTime(
  label: string,
  f: DateTimeFields,
): Result<ParsedDateTime> {
  const errors: string[] = [];

  if (isBlank(f.year) || isBlank(f.month) || isBlank(f.day)) {
    const missing = [
      isBlank(f.year) && 'year',
      isBlank(f.month) && 'month',
      isBlank(f.day) && 'day',
    ].filter(Boolean);
    return { ok: false, errors: [`${label}: select the ${missing.join(', ')}.`] };
  }

  const year = parseUnsignedInteger(f.year);
  const month = parseUnsignedInteger(f.month);
  const day = parseUnsignedInteger(f.day);

  if (year === null) errors.push(`${label}: year must be a whole number (digits only).`);
  else if (year < MIN_DISPLAY_YEAR || year > MAX_DISPLAY_YEAR) {
    errors.push(
      `${label}: year must be between ${MIN_DISPLAY_YEAR} and ${formatInteger(MAX_DISPLAY_YEAR)} ${f.era}. There is no year 0.`,
    );
  }
  if (month === null || month < 1 || month > 12) errors.push(`${label}: month must be between 1 and 12.`);
  if (day === null) errors.push(`${label}: day must be a whole number.`);

  const hour = parseTimeField(f.hour, 'hour', 23, label, errors);
  const minute = parseTimeField(f.minute, 'minute', 59, label, errors);
  const second = parseTimeField(f.second, 'second', 59, label, errors);

  if (errors.length > 0 || year === null || month === null || day === null) return { ok: false, errors };

  const astroYear = toAstronomicalYear(year, f.era);
  const max = daysInMonth(astroYear, month);
  if (day < 1 || day > max) {
    return {
      ok: false,
      errors: [
        `${label}: ${MONTH_NAMES[month - 1]} ${year} ${f.era} has ${max} days, so day ${day} is not valid.`,
      ],
    };
  }
  return { ok: true, value: { astroYear, month, day, hour, minute, second } };
}

const secondsOfDay = (d: ParsedDateTime): number => d.hour * 3600 + d.minute * 60 + d.second;

/** Seconds since 1970-01-01 00:00:00 (naive). Max magnitude ~3.2e11, exact in a double. */
export function toEpochSeconds(d: ParsedDateTime): number {
  return daysFromCivil(d.astroYear, d.month, d.day) * SECONDS_PER_DAY + secondsOfDay(d);
}

/** Start date moved forward by `months`, clamping the day to the target month's length. */
function addMonthsClamped(start: ParsedDateTime, months: number): ParsedDateTime {
  const index = start.astroYear * 12 + (start.month - 1) + months;
  const astroYear = Math.floor(index / 12);
  const month = index - astroYear * 12 + 1;
  return { ...start, astroYear, month, day: Math.min(start.day, daysInMonth(astroYear, month)) };
}

export interface Elapsed {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

/**
 * Calendar-aware difference (start <= end).
 * Finds the largest whole number of months that can be added to the start without passing
 * the end (clamping to the month's length, e.g. 31 Jan + 1 month = 28/29 Feb), then
 * expresses the remainder as days, hours, minutes and seconds.
 */
export function elapsedBetween(start: ParsedDateTime, end: ParsedDateTime): Elapsed {
  const startSec = toEpochSeconds(start);
  const endSec = toEpochSeconds(end);
  const totalSeconds = endSec - startSec;

  let months = (end.astroYear * 12 + end.month) - (start.astroYear * 12 + start.month);
  if (toEpochSeconds(addMonthsClamped(start, months)) > endSec) months -= 1;

  const anchorSec = toEpochSeconds(addMonthsClamped(start, months));
  let rest = endSec - anchorSec;
  const days = Math.floor(rest / SECONDS_PER_DAY);
  rest -= days * SECONDS_PER_DAY;
  const hours = Math.floor(rest / 3600);
  rest -= hours * 3600;
  const minutes = Math.floor(rest / 60);
  const seconds = rest - minutes * 60;

  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
  };
}

/** "5 March 44 BCE, 14:30:00" style label with the era always shown. */
export function describeDateTime(d: ParsedDateTime): string {
  const { year, era } = fromAstronomicalYear(d.astroYear);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.day} ${MONTH_NAMES[d.month - 1]} ${year} ${era}, ${pad(d.hour)}:${pad(d.minute)}:${pad(d.second)}`;
}

export function calculateAge(from: DateTimeFields, to: DateTimeFields): Result<AgeResult> {
  const a = validateDateTime('From date', from);
  const b = validateDateTime('Up to date', to);
  if (!a.ok || !b.ok) {
    return { ok: false, errors: [...(a.ok ? [] : a.errors), ...(b.ok ? [] : b.errors)] };
  }
  if (toEpochSeconds(b.value) < toEpochSeconds(a.value)) {
    return { ok: false, errors: ['The up-to date cannot be earlier than the from date.'] };
  }
  const e = elapsedBetween(a.value, b.value);
  return {
    ok: true,
    value: {
      years: e.years,
      months: e.months,
      days: e.days,
      hours: e.hours,
      minutes: e.minutes,
      seconds: e.seconds,
      totalDays: Math.floor(e.totalSeconds / SECONDS_PER_DAY),
      totalHours: Math.floor(e.totalSeconds / 3600),
      totalMinutes: Math.floor(e.totalSeconds / 60),
      totalSeconds: e.totalSeconds,
      fromLabel: describeDateTime(a.value),
      toLabel: describeDateTime(b.value),
    },
  };
}

export function formatAgeSummary(r: AgeResult): string {
  return [
    'Age / Time Difference (proleptic Gregorian calendar)',
    `From: ${r.fromLabel}`,
    `Up to: ${r.toLabel}`,
    '',
    `Calendar duration: ${plural(r.years, 'year')}, ${plural(r.months, 'month')}, ${plural(r.days, 'day')}`,
    `Time duration: ${plural(r.hours, 'hour')}, ${plural(r.minutes, 'minute')}, ${plural(r.seconds, 'second')}`,
    '',
    `Total days: ${formatInteger(r.totalDays)}`,
    `Total hours: ${formatInteger(r.totalHours)}`,
    `Total minutes: ${formatInteger(r.totalMinutes)}`,
    `Total seconds: ${formatInteger(r.totalSeconds)}`,
  ].join('\n');
}
