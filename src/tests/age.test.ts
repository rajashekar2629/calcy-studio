import { describe, expect, it } from 'vitest';
import {
  calculateAge,
  emptyDateTime,
  formatAgeSummary,
  getMaxDay,
  toEpochSeconds,
  validateDateTime,
} from '../calculations/age';
import { daysFromCivil } from '../utils/calendar';
import { dt, errorsOf, ok } from './helpers';

const diff = (a: ReturnType<typeof dt>, b: ReturnType<typeof dt>) => ok(calculateAge(a, b));

describe('age calculator: basic differences', () => {
  it('returns zero for the same instant', () => {
    const r = diff(dt(2025, 'CE', 6, 15), dt(2025, 'CE', 6, 15));
    expect(r).toMatchObject({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
  });

  it('measures hours, minutes and seconds on the same day', () => {
    const r = diff(dt(2025, 'CE', 6, 15, 0, 0, 0), dt(2025, 'CE', 6, 15, 12, 30, 45));
    expect([r.days, r.hours, r.minutes, r.seconds]).toEqual([0, 12, 30, 45]);
    expect(r.totalSeconds).toBe(45045);
    expect(r.totalMinutes).toBe(750);
    expect(r.totalHours).toBe(12);
    expect(r.totalDays).toBe(0);
  });

  it('borrows across the time of day', () => {
    const r = diff(dt(2025, 'CE', 1, 1, 18), dt(2025, 'CE', 1, 2, 6));
    expect([r.days, r.hours]).toEqual([0, 12]);
    const s = diff(dt(2025, 'CE', 1, 1, 10, 59, 59), dt(2025, 'CE', 1, 1, 11, 0, 0));
    expect([s.hours, s.minutes, s.seconds, s.totalSeconds]).toEqual([0, 0, 1, 1]);
    const m = diff(dt(2025, 'CE', 1, 31, 23), dt(2025, 'CE', 2, 1, 1));
    expect([m.months, m.days, m.hours]).toEqual([0, 0, 2]);
  });

  it('does not count a month until its time of day is reached', () => {
    const r = diff(dt(2025, 'CE', 1, 15, 10), dt(2025, 'CE', 2, 15, 9));
    expect([r.months, r.days, r.hours]).toEqual([0, 30, 23]);
    const t = diff(dt(2025, 'CE', 1, 15, 10), dt(2025, 'CE', 2, 15, 10));
    expect([t.months, t.days, t.hours]).toEqual([1, 0, 0]);
  });

  it('computes consistent totals', () => {
    const r = diff(dt(2020, 'CE', 3, 4, 5, 6, 7), dt(2025, 'CE', 11, 6, 8, 9, 10));
    expect(r.totalMinutes).toBe(Math.floor(r.totalSeconds / 60));
    expect(r.totalHours).toBe(Math.floor(r.totalSeconds / 3600));
    expect(r.totalDays).toBe(Math.floor(r.totalSeconds / 86400));
  });
});

describe('age calculator: leap years and boundaries', () => {
  it('handles 29 February', () => {
    expect(diff(dt(2024, 'CE', 2, 28), dt(2024, 'CE', 3, 1)).totalDays).toBe(2);
    expect(diff(dt(2023, 'CE', 2, 28), dt(2023, 'CE', 3, 1)).totalDays).toBe(1);
    const a = diff(dt(2024, 'CE', 2, 29), dt(2025, 'CE', 2, 28));
    expect([a.years, a.months, a.days, a.totalDays]).toEqual([1, 0, 0, 365]);
    const b = diff(dt(2024, 'CE', 2, 29), dt(2028, 'CE', 2, 29));
    expect([b.years, b.months, b.days, b.totalDays]).toEqual([4, 0, 0, 1461]);
  });

  it('applies the century rule (1900 is not a leap year, 2000 is)', () => {
    expect(diff(dt(1900, 'CE', 2, 28), dt(1900, 'CE', 3, 1)).totalDays).toBe(1);
    expect(diff(dt(2000, 'CE', 2, 28), dt(2000, 'CE', 3, 1)).totalDays).toBe(2);
  });

  it('crosses month and year boundaries', () => {
    const a = diff(dt(2023, 'CE', 12, 31), dt(2024, 'CE', 1, 1));
    expect([a.years, a.months, a.days]).toEqual([0, 0, 1]);
    const b = diff(dt(2025, 'CE', 1, 31), dt(2025, 'CE', 3, 1));
    expect([b.years, b.months, b.days, b.totalDays]).toEqual([0, 1, 1, 29]);
    const c = diff(dt(2025, 'CE', 1, 1), dt(2026, 'CE', 1, 1));
    expect([c.years, c.months, c.days, c.totalDays]).toEqual([1, 0, 0, 365]);
    expect(diff(dt(2000, 'CE', 1, 1), dt(2025, 'CE', 1, 1)).totalDays).toBe(9132);
  });

  it('computes a typical birthday age', () => {
    const r = diff(dt(1990, 'CE', 8, 15), dt(2026, 'CE', 11, 6));
    expect([r.years, r.months, r.days]).toEqual([36, 2, 22]);
  });
});

describe('age calculator: CE, BCE and era transitions', () => {
  it('handles CE-only ranges', () => {
    const r = diff(dt(1, 'CE', 1, 1), dt(2000, 'CE', 1, 1));
    expect([r.years, r.months, r.days, r.totalDays]).toEqual([1999, 0, 0, 730119]);
  });

  it('handles BCE-only ranges (counting backwards in the UI)', () => {
    const r = diff(dt(10, 'BCE', 1, 1), dt(1, 'BCE', 1, 1));
    expect([r.years, r.months, r.days]).toEqual([9, 0, 0]);
    expect(r.totalDays).toBe(9 * 365 + 2); // leap years: 8 BCE and 4 BCE
  });

  it('treats 1 BCE -> 1 CE as exactly one year (there is no year 0)', () => {
    const r = diff(dt(1, 'BCE', 1, 1), dt(1, 'CE', 1, 1));
    expect([r.years, r.months, r.days]).toEqual([1, 0, 0]);
    expect(r.totalDays).toBe(366); // 1 BCE is a leap year in the proleptic Gregorian calendar
    const two = diff(dt(2, 'BCE', 1, 1), dt(1, 'CE', 1, 1));
    expect([two.years, two.totalDays]).toEqual([2, 365 + 366]);
  });

  it('connects the last day of 1 BCE to the first day of 1 CE', () => {
    const r = diff(dt(1, 'BCE', 12, 31), dt(1, 'CE', 1, 1));
    expect([r.years, r.months, r.days, r.totalDays]).toEqual([0, 0, 1, 1]);
    const t = diff(dt(1, 'BCE', 12, 31, 23, 59, 59), dt(1, 'CE', 1, 1, 0, 0, 0));
    expect(t.totalSeconds).toBe(1);
  });

  it('spans multiple eras', () => {
    const r = diff(dt(44, 'BCE', 3, 15), dt(2026, 'CE', 11, 6));
    expect([r.years, r.months, r.days]).toEqual([2069, 7, 22]);
    const s = diff(dt(10000, 'BCE', 1, 1), dt(10000, 'CE', 1, 1));
    expect([s.years, s.months, s.days]).toEqual([19999, 0, 0]);
  });

  it('supports the maximum range 10,000 BCE to 10,000 CE', () => {
    const r = diff(dt(10000, 'BCE', 1, 1, 0, 0, 0), dt(10000, 'CE', 12, 31, 23, 59, 59));
    expect([r.years, r.months, r.days, r.hours, r.minutes, r.seconds]).toEqual([19999, 11, 30, 23, 59, 59]);
    // Independent check with the JavaScript Date engine (proleptic Gregorian, astronomical years).
    expect(r.totalSeconds).toBe(utcSeconds(-9999, 1, 1, 0, 0, 0, 10000, 12, 31, 23, 59, 59));
  });

  it('allows 29 February in leap BCE years only', () => {
    expect(ok(calculateAge(dt(1, 'BCE', 2, 29), dt(1, 'BCE', 3, 1))).totalDays).toBe(1); // astronomical year 0
    expect(ok(calculateAge(dt(5, 'BCE', 2, 29), dt(5, 'BCE', 3, 1))).totalDays).toBe(1); // astronomical year -4
    expect(errorsOf(calculateAge(dt(2, 'BCE', 2, 29), dt(1, 'CE', 1, 1))).join(' ')).toMatch(/28 days/);
    expect(errorsOf(calculateAge(dt(1, 'CE', 2, 29), dt(2, 'CE', 1, 1))).join(' ')).toMatch(/28 days/);
  });

  it('shows the era in the labels', () => {
    const r = diff(dt(44, 'BCE', 3, 15, 12), dt(2026, 'CE', 11, 6));
    expect(r.fromLabel).toBe('15 March 44 BCE, 12:00:00');
    expect(r.toLabel).toBe('6 November 2026 CE, 00:00:00');
    expect(formatAgeSummary(r)).toContain('44 BCE');
  });
});

/** Seconds between two instants using JavaScript's own proleptic-Gregorian Date (astronomical years). */
function utcSeconds(...a: number[]): number {
  const make = (y: number, mo: number, d: number, h: number, mi: number, s: number) => {
    const date = new Date(0);
    date.setUTCFullYear(y, mo - 1, d);
    date.setUTCHours(h, mi, s, 0);
    return date.getTime() / 1000;
  };
  return make(a[6], a[7], a[8], a[9], a[10], a[11]) - make(a[0], a[1], a[2], a[3], a[4], a[5]);
}

describe('age calculator: cross-check against the JavaScript Date engine', () => {
  it('matches 3,000 pseudo-random date pairs across the whole range', () => {
    let seed = 123456789;
    const rand = (n: number) => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return Math.floor((seed / 4294967296) * n);
    };
    const pick = () => {
      const astro = rand(19999) - 9999; // -9999 .. 9999, plus 10000 below
      const year = rand(40) === 0 ? 10000 : astro;
      const month = rand(12) + 1;
      const dim = new Date(Date.UTC(2001, month, 0)).getUTCDate(); // month length in a non-leap year
      const day = rand(dim) + 1;
      return { year, month, day, h: rand(24), mi: rand(60), s: rand(60) };
    };
    for (let i = 0; i < 3000; i++) {
      const a = pick();
      const b = pick();
      const expected = utcSeconds(a.year, a.month, a.day, a.h, a.mi, a.s, b.year, b.month, b.day, b.h, b.mi, b.s);
      const toFields = (p: typeof a) =>
        dt(p.year >= 1 ? p.year : 1 - p.year, p.year >= 1 ? 'CE' : 'BCE', p.month, p.day, p.h, p.mi, p.s);
      const [from, to] = expected >= 0 ? [toFields(a), toFields(b)] : [toFields(b), toFields(a)];
      const r = ok(calculateAge(from, to));
      expect(r.totalSeconds).toBe(Math.abs(expected));
    }
  });
});

describe('age calculator: validation', () => {
  it('rejects an up-to date earlier than the from date', () => {
    expect(errorsOf(calculateAge(dt(2025, 'CE', 6, 15), dt(2025, 'CE', 6, 14))).join(' ')).toMatch(/earlier/);
    expect(errorsOf(calculateAge(dt(2025, 'CE', 6, 15, 10), dt(2025, 'CE', 6, 15, 9, 59, 59))).join(' ')).toMatch(/earlier/);
    expect(errorsOf(calculateAge(dt(1, 'CE', 1, 1), dt(1, 'BCE', 1, 1))).join(' ')).toMatch(/earlier/);
    expect(errorsOf(calculateAge(dt(5, 'CE', 1, 1), dt(5, 'BCE', 1, 1))).join(' ')).toMatch(/earlier/);
  });

  it('requires both dates (empty by default)', () => {
    const errors = errorsOf(calculateAge(emptyDateTime(), emptyDateTime()));
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('From date');
    expect(errors[1]).toContain('Up to date');
    expect(errorsOf(calculateAge(dt(2025, 'CE', 1, 1), emptyDateTime()))).toHaveLength(1);
    expect(errorsOf(calculateAge(emptyDateTime(), dt(2025, 'CE', 1, 1)))).toHaveLength(1);
    expect(errorsOf(calculateAge(dt(2025, 'CE', '', 1), dt(2025, 'CE', 1, 1))).join(' ')).toMatch(/month/);
    expect(errorsOf(calculateAge(dt('', 'CE', 1, 1), dt(2025, 'CE', 1, 1))).join(' ')).toMatch(/year/);
    expect(errorsOf(calculateAge(dt(2025, 'CE', 1, ''), dt(2025, 'CE', 1, 1))).join(' ')).toMatch(/day/);
  });

  it('is empty by default and defaults to CE', () => {
    expect(emptyDateTime()).toEqual({ year: '', era: 'CE', month: '', day: '', hour: '', minute: '', second: '' });
  });

  it('rejects years outside 1..10,000 and year zero', () => {
    for (const era of ['CE', 'BCE'] as const) {
      expect(errorsOf(validateDateTime('Date', dt(0, era, 1, 1))).join(' ')).toMatch(/no year 0/);
      expect(errorsOf(validateDateTime('Date', dt(10001, era, 1, 1))).join(' ')).toMatch(/between 1 and 10,000/);
      expect(errorsOf(validateDateTime('Date', dt('00', era, 1, 1))).length).toBe(1);
      expect(ok(validateDateTime('Date', dt(10000, era, 1, 1))).month).toBe(1);
      expect(ok(validateDateTime('Date', dt(1, era, 1, 1))).month).toBe(1);
    }
    for (const bad of ['abc', '-5', '1.5', '12e3', ' ', '１２']) {
      expect(validateDateTime('Date', dt(bad, 'CE', 1, 1)).ok).toBe(false);
    }
  });

  it('rejects impossible dates without correcting them', () => {
    const bad: Array<[number, number, number]> = [
      [2023, 2, 29],
      [2023, 2, 30],
      [1900, 2, 29],
      [2023, 4, 31],
      [2023, 6, 31],
      [2023, 13, 1],
      [2023, 0, 1],
      [2023, 1, 0],
      [2023, 1, 32],
    ];
    for (const [y, m, d] of bad) expect(validateDateTime('Date', dt(y, 'CE', m, d)).ok).toBe(false);
    expect(validateDateTime('Date', dt(2000, 'CE', 2, 29)).ok).toBe(true);
    expect(validateDateTime('Date', dt(2024, 'CE', 2, 29)).ok).toBe(true);
  });

  it('rejects out-of-range or malformed time fields', () => {
    expect(validateDateTime('Date', dt(2025, 'CE', 1, 1, 24)).ok).toBe(false);
    expect(validateDateTime('Date', dt(2025, 'CE', 1, 1, 0, 60)).ok).toBe(false);
    expect(validateDateTime('Date', dt(2025, 'CE', 1, 1, 0, 0, 60)).ok).toBe(false);
    expect(validateDateTime('Date', dt(2025, 'CE', 1, 1, 'x')).ok).toBe(false);
    expect(validateDateTime('Date', dt(2025, 'CE', 1, 1, -1)).ok).toBe(false);
    expect(validateDateTime('Date', dt(2025, 'CE', 1, 1, 23, 59, 59)).ok).toBe(true);
  });

  it('treats blank time fields as 00:00:00', () => {
    const v = ok(validateDateTime('Date', dt(2025, 'CE', 1, 1)));
    expect([v.hour, v.minute, v.second]).toEqual([0, 0, 0]);
  });

  it('reports errors from both dates together', () => {
    expect(errorsOf(calculateAge(dt(2023, 'CE', 2, 30), dt(2023, 'CE', 4, 31)))).toHaveLength(2);
  });
});

describe('age calculator: day selector helper', () => {
  it('adapts the available days to month, year and era', () => {
    expect(getMaxDay('2024', 'CE', '2')).toBe(29);
    expect(getMaxDay('2023', 'CE', '2')).toBe(28);
    expect(getMaxDay('1900', 'CE', '2')).toBe(28);
    expect(getMaxDay('2000', 'CE', '2')).toBe(29);
    expect(getMaxDay('2024', 'CE', '4')).toBe(30);
    expect(getMaxDay('2024', 'CE', '12')).toBe(31);
    expect(getMaxDay('1', 'BCE', '2')).toBe(29);
    expect(getMaxDay('2', 'BCE', '2')).toBe(28);
    expect(getMaxDay('', 'CE', '2')).toBe(29);
    expect(getMaxDay('', 'CE', '')).toBe(31);
    expect(getMaxDay('abc', 'CE', '9')).toBe(30);
  });
});

describe('age calculator: epoch arithmetic', () => {
  it('converts to epoch seconds', () => {
    const v = ok(validateDateTime('Date', dt(1970, 'CE', 1, 2, 0, 0, 1)));
    expect(toEpochSeconds(v)).toBe(86401);
    expect(daysFromCivil(1970, 1, 2)).toBe(1);
  });
});
