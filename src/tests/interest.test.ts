import { describe, expect, it } from 'vitest';
import {
  addMonths,
  buildExactLines,
  buildExplanation,
  calculateInterest,
  computeInterest,
  countWholeMonths,
  formatInterestSummary,
  formatMoneyPrecise,
  interestForDays,
  measurePeriod,
  splitMonths,
  type InterestInput,
} from '../calculations/interest';
import { formatMoney } from '../utils/format';
import { errorsOf, ok } from './helpers';

const d = (year: number | string, month: number | string, day: number | string) => ({
  year: String(year),
  month: String(month),
  day: String(day),
});

const input = (
  principal: string,
  rate: string,
  from: [number, number, number],
  to: [number, number, number],
): InterestInput => ({ principal, rate, from: d(...from), to: d(...to) });

const cd = (year: number, month: number, day: number) => ({ year, month, day });

describe('interest calculator: the worked example', () => {
  // Rs.10,000 at Rs.2 per Rs.100 per month, 1 Jan 2025 to 15 Mar 2026
  const r = ok(calculateInterest(input('10000', '2', [2025, 1, 1], [2026, 3, 15])));

  it('counts the duration', () => {
    expect(r.duration).toEqual({ years: 1, months: 2, days: 14, totalMonths: 14, totalDays: 438 });
  });

  it('computes monthly, daily and yearly interest', () => {
    expect(r.monthlyInterest).toBe(200);
    expect(r.dailyInterest).toBeCloseTo(6.6666666667, 8);
    expect(r.yearlyInterest).toBe(2400);
  });

  it('adds whole months and leftover days (the main calculation)', () => {
    expect(r.totalInterest).toBeCloseTo(2893.3333333333, 8); // 14 x 200 + 14 x 6.6667
    expect(r.finalAmount).toBeCloseTo(12893.3333333333, 8);
  });

  it('keeps the exact (real days) calculation separately', () => {
    expect(r.exact.totalDays).toBe(438);
    expect(r.exact.totalInterest).toBeCloseTo(2920, 8); // 438 x 6.6667
    expect(r.exact.finalAmount).toBeCloseTo(12920, 8);
    expect(r.exact.extraDays).toBe(14);
    expect(r.exact.extraDaysInterest).toBeCloseTo(93.3333333333, 8);
  });

  it('groups the exact calculation by real month length', () => {
    expect(r.exact.groups.map((g) => [g.length, g.months, g.days])).toEqual([
      [31, 8, 248],
      [30, 4, 120],
      [28, 2, 56],
    ]);
    const g31 = r.exact.groups[0];
    expect(g31.interestPerMonth).toBeCloseTo(206.6666666667, 8);
    expect(g31.interest).toBeCloseTo(1653.3333333333, 8);
    expect(r.exact.groups[1].interestPerMonth).toBeCloseTo(200, 8);
    expect(r.exact.groups[2].interestPerMonth).toBeCloseTo(186.6666666667, 8);
  });

  it('group interest plus extra days equals the exact total', () => {
    const sum = r.exact.groups.reduce((acc, g) => acc + g.interest, 0) + r.exact.extraDaysInterest;
    expect(sum).toBeCloseTo(r.exact.totalInterest, 8);
    const days = r.exact.groups.reduce((acc, g) => acc + g.days, 0) + r.exact.extraDays;
    expect(days).toBe(r.exact.totalDays);
  });
});

describe('interest calculator: the rate is rupees per Rs.100 per month', () => {
  it('Rs.1000 at Rs.2 gives Rs.20 a month (10 hundreds x Rs.2)', () => {
    const r = ok(calculateInterest(input('1000', '2', [2025, 1, 1], [2025, 2, 1])));
    expect(r.monthlyInterest).toBe(20);
    expect(r.duration).toEqual({ years: 0, months: 1, days: 0, totalMonths: 1, totalDays: 31 });
    expect(r.totalInterest).toBe(20);
    expect(r.finalAmount).toBe(1020);
  });

  it('computeInterest applies the formulas', () => {
    const m = computeInterest(10000, 2, 14, 14);
    expect(m.monthlyInterest).toBe(200);
    expect(m.yearlyInterest).toBe(2400);
    expect(m.totalInterest).toBeCloseTo(2893.3333333333, 8);
    expect(interestForDays(10000, 2, 30)).toBeCloseTo(200, 10);
  });

  it('supports decimal principal and rates', () => {
    const r = ok(calculateInterest(input('2500.50', '1.5', [2025, 1, 1], [2025, 7, 1])));
    expect(r.duration.totalMonths).toBe(6);
    expect(r.monthlyInterest).toBeCloseTo(37.5075, 10);
    expect(r.totalInterest).toBeCloseTo(225.045, 8);
    expect(r.finalAmount).toBeCloseTo(2725.545, 8);
  });

  it('supports zero interest', () => {
    const r = ok(calculateInterest(input('5000', '0', [2025, 1, 1], [2026, 1, 1])));
    expect(r.totalInterest).toBe(0);
    expect(r.finalAmount).toBe(5000);
    expect(r.exact.totalInterest).toBe(0);
  });

  it('is simple interest, never compound', () => {
    const r = ok(calculateInterest(input('1000', '1', [2020, 1, 1], [2030, 1, 1])));
    expect(r.duration.totalMonths).toBe(120);
    expect(r.totalInterest).toBeCloseTo(1200, 8); // 120 x Rs.10
  });
});

describe('interest calculator: months and days', () => {
  it('handles whole years', () => {
    const r = ok(calculateInterest(input('1000', '2', [2020, 5, 10], [2023, 5, 10])));
    expect(r.duration).toEqual({ years: 3, months: 0, days: 0, totalMonths: 36, totalDays: 1095 });
    expect(r.totalInterest).toBeCloseTo(720, 8);
  });

  it('handles whole months only', () => {
    const r = ok(calculateInterest(input('1000', '2', [2025, 1, 15], [2025, 6, 15])));
    expect(r.duration).toEqual({ years: 0, months: 5, days: 0, totalMonths: 5, totalDays: 151 });
    expect(r.totalInterest).toBeCloseTo(100, 8);
  });

  it('handles days only', () => {
    const r = ok(calculateInterest(input('1000', '2', [2025, 1, 1], [2025, 1, 20])));
    expect(r.duration).toEqual({ years: 0, months: 0, days: 19, totalMonths: 0, totalDays: 19 });
    expect(r.totalInterest).toBeCloseTo(12.6666666667, 8);
    expect(r.exact.groups).toEqual([]);
    expect(r.exact.totalInterest).toBeCloseTo(12.6666666667, 8);
  });

  it('30 days inside a 31-day month earn one full month', () => {
    const r = ok(calculateInterest(input('1000', '2', [2025, 1, 1], [2025, 1, 31])));
    expect(r.duration.days).toBe(30);
    expect(r.totalInterest).toBeCloseTo(20, 8);
  });

  it('handles mixed years, months and days', () => {
    const r = ok(calculateInterest(input('1000', '2', [2024, 2, 10], [2026, 5, 25])));
    expect(r.duration).toEqual({ years: 2, months: 3, days: 15, totalMonths: 27, totalDays: 835 });
  });

  it('returns zero for identical dates', () => {
    const r = ok(calculateInterest(input('1000', '2', [2025, 6, 1], [2025, 6, 1])));
    expect(r.duration).toEqual({ years: 0, months: 0, days: 0, totalMonths: 0, totalDays: 0 });
    expect(r.totalInterest).toBe(0);
    expect(r.exact.totalInterest).toBe(0);
  });

  it('a leap year still counts as 12 months', () => {
    const r = ok(calculateInterest(input('1000', '2', [2023, 5, 10], [2024, 5, 10])));
    expect(r.duration.totalMonths).toBe(12);
    expect(r.duration.totalDays).toBe(366);
    expect(r.totalInterest).toBeCloseTo(240, 8); // main: 12 months
    expect(r.exact.totalInterest).toBeCloseTo(244, 8); // exact: 366 x 20 / 30
  });

  it('splits months into years and months', () => {
    expect(splitMonths(14)).toEqual({ years: 1, months: 2 });
    expect(splitMonths(11)).toEqual({ years: 0, months: 11 });
    expect(splitMonths(24)).toEqual({ years: 2, months: 0 });
    expect(splitMonths(0)).toEqual({ years: 0, months: 0 });
  });
});

describe('interest calculator: month ends', () => {
  it('addMonths keeps the day, or the last day of a shorter month', () => {
    expect(addMonths(cd(2025, 1, 15), 1)).toEqual(cd(2025, 2, 15));
    expect(addMonths(cd(2025, 1, 31), 1)).toEqual(cd(2025, 2, 28));
    expect(addMonths(cd(2024, 1, 31), 1)).toEqual(cd(2024, 2, 29));
    expect(addMonths(cd(2025, 1, 31), 2)).toEqual(cd(2025, 3, 31)); // no drift after a short month
    expect(addMonths(cd(2025, 11, 30), 3)).toEqual(cd(2026, 2, 28));
    expect(addMonths(cd(2025, 12, 5), 1)).toEqual(cd(2026, 1, 5));
    expect(addMonths(cd(2025, 12, 5), 24)).toEqual(cd(2027, 12, 5));
  });

  it('counts whole months across month ends', () => {
    expect(countWholeMonths(cd(2025, 1, 31), cd(2025, 2, 27))).toBe(0);
    expect(countWholeMonths(cd(2025, 1, 31), cd(2025, 2, 28))).toBe(1);
    expect(countWholeMonths(cd(2025, 1, 31), cd(2025, 3, 30))).toBe(1);
    expect(countWholeMonths(cd(2025, 1, 31), cd(2025, 3, 31))).toBe(2);
    expect(countWholeMonths(cd(2024, 2, 29), cd(2025, 2, 28))).toBe(12);
    expect(countWholeMonths(cd(2025, 1, 1), cd(2025, 1, 1))).toBe(0);
  });

  it('measures leftover days after the last whole month', () => {
    const m = measurePeriod(cd(2025, 1, 31), cd(2025, 3, 30));
    expect(m.totalMonths).toBe(1);
    expect(m.leftoverDays).toBe(30);
    expect(m.totalDays).toBe(58);
  });
});

describe('interest calculator: exact calculation and February', () => {
  it('shows a leap-year February (29 days) separately from a normal one (28 days)', () => {
    // 1 Dec 2023 to 1 Apr 2025 contains Feb 2024 (29 days) and Feb 2025 (28 days)
    const r = ok(calculateInterest(input('10000', '2', [2023, 12, 1], [2025, 4, 1])));
    expect(r.duration.totalMonths).toBe(16);
    expect(r.duration.totalDays).toBe(487);
    expect(r.exact.groups.map((g) => [g.length, g.months])).toEqual([
      [31, 10],
      [30, 4],
      [29, 1],
      [28, 1],
    ]);
    expect(r.exact.groups[2].interestPerMonth).toBeCloseTo(193.3333333333, 8);
    expect(r.exact.groups[3].interestPerMonth).toBeCloseTo(186.6666666667, 8);
    expect(r.exact.totalInterest).toBeCloseTo(3246.6666666667, 8); // 487 x 6.6667
    expect(r.totalInterest).toBeCloseTo(3200, 8); // main: 16 x 200
  });

  it('a single February period', () => {
    const leap = ok(calculateInterest(input('1000', '2', [2024, 2, 1], [2024, 3, 1])));
    expect(leap.exact.groups.map((g) => [g.length, g.months, g.days])).toEqual([[29, 1, 29]]);
    expect(leap.exact.totalInterest).toBeCloseTo(19.3333333333, 8);
    const normal = ok(calculateInterest(input('1000', '2', [2025, 2, 1], [2025, 3, 1])));
    expect(normal.exact.groups.map((g) => [g.length, g.months, g.days])).toEqual([[28, 1, 28]]);
    expect(normal.totalInterest).toBeCloseTo(20, 8); // main still charges a full month
  });

  it('lists month lengths from longest to shortest', () => {
    const r = ok(calculateInterest(input('1000', '2', [2024, 1, 1], [2026, 1, 1])));
    const lengths = r.exact.groups.map((g) => g.length);
    expect(lengths).toEqual([...lengths].sort((a, b) => b - a));
    expect(r.exact.groups.reduce((n, g) => n + g.months, 0)).toBe(24);
  });
});

describe('interest calculator: display text', () => {
  const r = ok(calculateInterest(input('10000', '2', [2025, 1, 1], [2026, 3, 15])));

  it('formats rupee amounts', () => {
    expect(formatMoney(11400)).toBe('₹11,400.00');
    expect(formatMoney(3.3333333)).toBe('₹3.33');
    expect(formatMoney(1234567.5)).toBe('₹12,34,567.50');
    expect(formatMoneyPrecise(6.6666666667)).toBe('₹6.6667');
    expect(formatMoneyPrecise(200)).toBe('₹200.00');
    expect(formatMoneyPrecise(206.6666666667)).toBe('₹206.6667');
  });

  it('explains the main calculation with the entered values', () => {
    const text = buildExplanation(r).join('\n');
    expect(text).toContain('Principal = ₹10,000.00');
    expect(text).toContain('Interest rate = ₹2 per ₹100 per month');
    expect(text).toContain('Monthly interest = Principal ÷ 100 × rate = ₹10,000.00 ÷ 100 × 2 = ₹200.00');
    expect(text).toContain('Daily interest = Monthly interest ÷ 30 = ₹200.00 ÷ 30 = ₹6.6667');
    expect(text).toContain('Yearly interest = Monthly interest × 12 = ₹200.00 × 12 = ₹2,400.00');
    expect(text).toContain('1 year, 2 months, 14 days (14 months and 14 days; 438 days from the first date to the last date)');
    expect(text).toContain('Total interest = 14 months × ₹200.00 + 14 days × ₹6.6667 = ₹2,893.33');
    expect(text).toContain('Final amount = Principal + Total interest = ₹10,000.00 + ₹2,893.33 = ₹12,893.33');
  });

  it('lists the exact calculation by month length', () => {
    const lines = buildExactLines(r);
    expect(lines).toContain('Total days from the first date to the last date = 438');
    expect(lines).toContain('31-day months: 8 months (248 days) × ₹206.6667 per month = ₹1,653.33');
    expect(lines).toContain('30-day months: 4 months (120 days) × ₹200.00 per month = ₹800.00');
    expect(lines).toContain('28-day months: 2 months (56 days) × ₹186.6667 per month = ₹373.33');
    expect(lines).toContain('Extra days: 14 days × ₹6.6667 = ₹93.33');
    expect(lines).toContain('Total interest = 438 days × ₹6.6667 = ₹2,920.00');
    expect(lines).toContain('Final amount = Principal + Total interest = ₹10,000.00 + ₹2,920.00 = ₹12,920.00');
    expect(lines.some((l) => l.startsWith('29-day'))).toBe(false); // only months that occur are listed
  });

  it('omits the extra-days line when there are none', () => {
    const exactMonths = ok(calculateInterest(input('1000', '2', [2025, 1, 1], [2025, 4, 1])));
    expect(buildExactLines(exactMonths).some((l) => l.startsWith('Extra days'))).toBe(false);
  });

  it('builds the copy text, adding the exact calculation only when asked', () => {
    const plain = formatInterestSummary(r);
    expect(plain).toContain('Duration: 1 year, 2 months, 14 days (14 months and 14 days; 438 days in total)');
    expect(plain).toContain('Interest per month: ₹200.00');
    expect(plain).toContain('Interest per day: ₹6.6667');
    expect(plain).toContain('Final amount: ₹12,893.33');
    expect(plain).not.toContain('Exact calculation');
    const withExact = formatInterestSummary(r, true);
    expect(withExact).toContain('Exact calculation (real days)');
    expect(withExact).toContain('Total interest = 438 days × ₹6.6667 = ₹2,920.00');
  });
});

describe('interest calculator: validation', () => {
  it('rejects an up-to date earlier than the from date', () => {
    const errors = errorsOf(calculateInterest(input('1000', '2', [2025, 3, 1], [2025, 2, 28])));
    expect(errors.join(' ')).toMatch(/earlier/);
    expect(errorsOf(calculateInterest(input('1000', '2', [2026, 1, 1], [2025, 12, 31]))).join(' ')).toMatch(/earlier/);
  });

  it('rejects impossible calendar dates', () => {
    expect(errorsOf(calculateInterest(input('1000', '2', [2025, 2, 30], [2026, 1, 1]))).join(' ')).toMatch(/From date/);
    expect(errorsOf(calculateInterest(input('1000', '2', [2025, 2, 29], [2026, 1, 1]))).length).toBe(1);
    expect(errorsOf(calculateInterest(input('1000', '2', [2025, 1, 1], [2026, 4, 31]))).join(' ')).toMatch(/Up to date/);
    expect(ok(calculateInterest(input('1000', '2', [2024, 2, 29], [2026, 1, 1])))).toBeTruthy();
    expect(errorsOf(calculateInterest(input('1000', '2', [2025, 13, 1], [2026, 1, 1]))).length).toBe(1);
    expect(errorsOf(calculateInterest(input('1000', '2', [2025, 0, 1], [2026, 1, 1]))).length).toBe(1);
    expect(errorsOf(calculateInterest(input('1000', '2', [2025, 1, 0], [2026, 1, 1]))).length).toBe(1);
    expect(errorsOf(calculateInterest(input('1000', '2', [0, 1, 1], [2026, 1, 1]))).length).toBe(1);
    expect(errorsOf(calculateInterest(input('1000', '2', [2025, 1, 1], [10000, 1, 1]))).length).toBe(1);
  });

  it('rejects empty and non-numeric dates', () => {
    const base = input('1000', '2', [2025, 1, 1], [2026, 1, 1]);
    expect(errorsOf(calculateInterest({ ...base, from: d('', '', '') })).length).toBe(1);
    expect(errorsOf(calculateInterest({ ...base, to: d(2026, '', 1) })).length).toBe(1);
    expect(errorsOf(calculateInterest({ ...base, from: d('abc', 1, 1) })).length).toBe(1);
    expect(errorsOf(calculateInterest({ ...base, from: d('2025.5', 1, 1) })).length).toBe(1);
    expect(errorsOf(calculateInterest({ ...base, from: d('-2025', 1, 1) })).length).toBe(1);
  });

  it('rejects invalid principal and rate', () => {
    const dates = { from: d(2025, 1, 1), to: d(2026, 1, 1) };
    expect(errorsOf(calculateInterest({ principal: '', rate: '2', ...dates })).join(' ')).toMatch(/principal/i);
    expect(errorsOf(calculateInterest({ principal: '0', rate: '2', ...dates })).join(' ')).toMatch(/greater than zero/);
    expect(errorsOf(calculateInterest({ principal: '-100', rate: '2', ...dates })).join(' ')).toMatch(/principal/i);
    expect(errorsOf(calculateInterest({ principal: 'abc', rate: '2', ...dates })).join(' ')).toMatch(/principal/i);
    expect(errorsOf(calculateInterest({ principal: '1,000', rate: '2', ...dates })).join(' ')).toMatch(/principal/i);
    expect(errorsOf(calculateInterest({ principal: '1000', rate: '', ...dates })).join(' ')).toMatch(/rate/i);
    expect(errorsOf(calculateInterest({ principal: '1000', rate: '-2', ...dates })).join(' ')).toMatch(/rate/i);
    expect(errorsOf(calculateInterest({ principal: '1000', rate: 'x', ...dates })).join(' ')).toMatch(/rate/i);
  });

  it('reports every problem at once', () => {
    const errors = errorsOf(
      calculateInterest({ principal: '', rate: '', from: d('', '', ''), to: d('', '', '') }),
    );
    expect(errors).toHaveLength(4);
  });
});
