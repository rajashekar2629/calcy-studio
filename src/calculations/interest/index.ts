/**
 * Traditional (local) simple interest.
 *
 *  - The rate is rupees per Rs.100 per month: a rate of 2 means Rs.2 for every Rs.100, every month.
 *  - Monthly interest = principal / 100 x rate.
 *  - For the interest, a month is always 30 days (February too) and a year is 12 months,
 *    so daily interest = monthly interest / 30 and yearly interest = monthly interest x 12.
 *  - MAIN calculation: count the whole calendar months between the two dates, then the days
 *    left over. Interest = months x monthly interest + leftover days x daily interest.
 *  - EXACT calculation (shown on request): every real day from the first date to the last date
 *    earns the daily interest, so months of 31, 30, 29 and 28 days earn different amounts.
 *
 * The end date is not counted as a day taken: 1 Jan to 1 Feb is 31 days and exactly 1 month.
 * Full floating-point precision is kept internally; rounding happens only when formatting.
 */
import type { DateFields, Result } from '../../types';
import { daysFromCivil, daysInMonth } from '../../utils/calendar';
import { formatInteger, formatMoney, plural } from '../../utils/format';
import { isBlank, parseUnsignedDecimal, parseUnsignedInteger } from '../../utils/parse';

export const MIN_YEAR = 1;
export const MAX_YEAR = 9999;
export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;

export interface InterestInput {
  principal: string;
  /** Rupees of interest per Rs.100 per month. */
  rate: string;
  from: DateFields;
  to: DateFields;
}

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export interface Duration {
  years: number;
  /** Months left over after the whole years (0 to 11). */
  months: number;
  /** Days left over after the whole months (0 to 30). */
  days: number;
  /** All whole months in the period (years x 12 + months). */
  totalMonths: number;
  /** Real days from the first date to the last date. */
  totalDays: number;
}

/** Months of the same real length, e.g. all the 31-day months in the period. */
export interface MonthGroup {
  /** Real days in each month of this group (28, 29, 30 or 31). */
  length: number;
  months: number;
  days: number;
  interestPerMonth: number;
  interest: number;
}

export interface ExactBreakdown {
  totalDays: number;
  dailyInterest: number;
  groups: MonthGroup[];
  extraDays: number;
  extraDaysInterest: number;
  totalInterest: number;
  finalAmount: number;
}

export interface InterestResult {
  principal: number;
  rate: number;
  from: CalendarDate;
  to: CalendarDate;
  duration: Duration;
  yearlyInterest: number;
  monthlyInterest: number;
  dailyInterest: number;
  totalInterest: number;
  finalAmount: number;
  exact: ExactBreakdown;
}

const toDayNumber = (d: CalendarDate): number => daysFromCivil(d.year, d.month, d.day);

/**
 * The date n months after d, keeping the day of the month. When that day does not exist in the
 * target month (31 Jan + 1 month) it becomes the last day of that month.
 */
export function addMonths(d: CalendarDate, n: number): CalendarDate {
  const index = d.year * 12 + (d.month - 1) + n;
  const year = Math.floor(index / 12);
  const month = index - year * 12 + 1;
  return { year, month, day: Math.min(d.day, daysInMonth(year, month)) };
}

/** Whole months from `from` to `to` (to must not be before from). */
export function countWholeMonths(from: CalendarDate, to: CalendarDate): number {
  let n = (to.year - from.year) * 12 + (to.month - from.month);
  if (n > 0 && toDayNumber(addMonths(from, n)) > toDayNumber(to)) n -= 1;
  return Math.max(n, 0);
}

export interface PeriodMeasure {
  totalMonths: number;
  leftoverDays: number;
  totalDays: number;
  /** Real month length -> how many whole months of that length. */
  lengths: Map<number, number>;
}

/** Whole months, leftover days, real total days and the real length of every whole month. */
export function measurePeriod(from: CalendarDate, to: CalendarDate): PeriodMeasure {
  const totalMonths = countWholeMonths(from, to);
  const startDay = toDayNumber(from);
  let previous = startDay;
  const lengths = new Map<number, number>();
  for (let k = 1; k <= totalMonths; k++) {
    const next = toDayNumber(addMonths(from, k));
    lengths.set(next - previous, (lengths.get(next - previous) ?? 0) + 1);
    previous = next;
  }
  const endDay = toDayNumber(to);
  return { totalMonths, leftoverDays: endDay - previous, totalDays: endDay - startDay, lengths };
}

export function splitMonths(totalMonths: number): { years: number; months: number } {
  const years = Math.floor(totalMonths / MONTHS_PER_YEAR);
  return { years, months: totalMonths - years * MONTHS_PER_YEAR };
}

/** Interest for a number of days at the daily rate (monthly interest / 30). Multiplies first. */
export function interestForDays(principal: number, rate: number, days: number): number {
  return (principal * rate * days) / (100 * DAYS_PER_MONTH);
}

/** Main calculation: whole months at the monthly interest plus leftover days at the daily interest. */
export function computeInterest(principal: number, rate: number, wholeMonths: number, leftoverDays: number) {
  const monthlyInterest = (principal * rate) / 100;
  const dailyInterest = monthlyInterest / DAYS_PER_MONTH;
  const yearlyInterest = monthlyInterest * MONTHS_PER_YEAR;
  const totalInterest = interestForDays(principal, rate, wholeMonths * DAYS_PER_MONTH + leftoverDays);
  return { monthlyInterest, dailyInterest, yearlyInterest, totalInterest, finalAmount: principal + totalInterest };
}

function parseDate(label: string, f: DateFields, errors: string[]): CalendarDate | null {
  if (isBlank(f.year) || isBlank(f.month) || isBlank(f.day)) {
    errors.push(`${label}: enter year, month and day.`);
    return null;
  }
  const year = parseUnsignedInteger(f.year);
  const month = parseUnsignedInteger(f.month);
  const day = parseUnsignedInteger(f.day);
  if (year === null || month === null || day === null) {
    errors.push(`${label}: year, month and day must be whole numbers.`);
    return null;
  }
  if (year < MIN_YEAR || year > MAX_YEAR) {
    errors.push(`${label}: year must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
    return null;
  }
  if (month < 1 || month > 12) {
    errors.push(`${label}: month must be between 1 and 12.`);
    return null;
  }
  if (day < 1 || day > daysInMonth(year, month)) {
    errors.push(`${label}: day ${day} does not exist in month ${month} of ${year}.`);
    return null;
  }
  return { year, month, day };
}

const before = (a: CalendarDate, b: CalendarDate): boolean => toDayNumber(a) < toDayNumber(b);

export function calculateInterest(input: InterestInput): Result<InterestResult> {
  const errors: string[] = [];

  let principal: number | null = null;
  if (isBlank(input.principal)) errors.push('Enter the principal amount.');
  else {
    principal = parseUnsignedDecimal(input.principal);
    if (principal === null) errors.push('Principal must be a positive number.');
    else if (principal <= 0) {
      errors.push('Principal must be greater than zero.');
      principal = null;
    }
  }

  let rate: number | null = null;
  if (isBlank(input.rate)) errors.push('Enter the interest rate (rupees per Rs.100 per month).');
  else {
    rate = parseUnsignedDecimal(input.rate);
    if (rate === null) errors.push('Interest rate must be a number of zero or more.');
  }

  const from = parseDate('From date', input.from, errors);
  const to = parseDate('Up to date', input.to, errors);
  if (from && to && before(to, from)) errors.push('The up-to date cannot be earlier than the from date.');

  if (errors.length > 0 || principal === null || rate === null || !from || !to) {
    return { ok: false, errors };
  }

  const period = measurePeriod(from, to);
  const main = computeInterest(principal, rate, period.totalMonths, period.leftoverDays);

  const groups: MonthGroup[] = [...period.lengths.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([length, months]) => ({
      length,
      months,
      days: length * months,
      interestPerMonth: interestForDays(principal, rate, length),
      interest: interestForDays(principal, rate, length * months),
    }));
  const exactTotal = interestForDays(principal, rate, period.totalDays);
  const exact: ExactBreakdown = {
    totalDays: period.totalDays,
    dailyInterest: main.dailyInterest,
    groups,
    extraDays: period.leftoverDays,
    extraDaysInterest: interestForDays(principal, rate, period.leftoverDays),
    totalInterest: exactTotal,
    finalAmount: principal + exactTotal,
  };

  if (![main.yearlyInterest, main.totalInterest, main.finalAmount, exactTotal].every(Number.isFinite)) {
    return { ok: false, errors: ['Values are too large to calculate.'] };
  }

  const { years, months } = splitMonths(period.totalMonths);
  return {
    ok: true,
    value: {
      principal,
      rate,
      from,
      to,
      duration: { years, months, days: period.leftoverDays, totalMonths: period.totalMonths, totalDays: period.totalDays },
      yearlyInterest: main.yearlyInterest,
      monthlyInterest: main.monthlyInterest,
      dailyInterest: main.dailyInterest,
      totalInterest: main.totalInterest,
      finalAmount: main.finalAmount,
      exact,
    },
  };
}

/** "1 year, 2 months, 14 days" */
export function formatDuration(d: Duration): string {
  return `${plural(d.years, 'year')}, ${plural(d.months, 'month')}, ${plural(d.days, 'day')}`;
}

/** "14 months and 14 days" */
export function formatTotalMonths(d: Duration): string {
  return `${plural(d.totalMonths, 'month')} and ${plural(d.days, 'day')}`;
}

/** Rupees with up to four decimals, so a daily figure like 6.6667 can be checked by hand. */
export function formatMoneyPrecise(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

/** Main calculation: explanation lines with the entered values substituted into each formula. */
export function buildExplanation(r: InterestResult): string[] {
  const d = r.duration;
  return [
    `Principal = ${formatMoney(r.principal)}`,
    `Interest rate = ₹${r.rate} per ₹100 per month`,
    `Monthly interest = Principal ÷ 100 × rate = ${formatMoney(r.principal)} ÷ 100 × ${r.rate} = ${formatMoney(r.monthlyInterest)}`,
    `Daily interest = Monthly interest ÷ 30 = ${formatMoney(r.monthlyInterest)} ÷ 30 = ${formatMoneyPrecise(r.dailyInterest)}`,
    `Yearly interest = Monthly interest × 12 = ${formatMoney(r.monthlyInterest)} × 12 = ${formatMoney(r.yearlyInterest)}`,
    `Duration = ${formatDuration(d)} (${formatTotalMonths(d)}; ${plural(d.totalDays, 'day')} from the first date to the last date)`,
    `Total interest = ${plural(d.totalMonths, 'month')} × ${formatMoney(r.monthlyInterest)} + ${plural(d.days, 'day')} × ${formatMoneyPrecise(r.dailyInterest)} = ${formatMoney(r.totalInterest)}`,
    `Final amount = Principal + Total interest = ${formatMoney(r.principal)} + ${formatMoney(r.totalInterest)} = ${formatMoney(r.finalAmount)}`,
  ];
}

/** Exact calculation (real days): the lines shown after "Show exact calculation". */
export function buildExactLines(r: InterestResult): string[] {
  const e = r.exact;
  const lines = [
    `Total days from the first date to the last date = ${formatInteger(e.totalDays)}`,
    `Daily interest = Monthly interest ÷ 30 = ${formatMoneyPrecise(e.dailyInterest)} (the same on every day, whatever the month length)`,
  ];
  for (const g of e.groups) {
    lines.push(
      `${g.length}-day months: ${plural(g.months, 'month')} (${plural(g.days, 'day')}) × ${formatMoneyPrecise(g.interestPerMonth)} per month = ${formatMoney(g.interest)}`,
    );
  }
  if (e.extraDays > 0) {
    lines.push(`Extra days: ${plural(e.extraDays, 'day')} × ${formatMoneyPrecise(e.dailyInterest)} = ${formatMoney(e.extraDaysInterest)}`);
  }
  lines.push(
    `Total interest = ${plural(e.totalDays, 'day')} × ${formatMoneyPrecise(e.dailyInterest)} = ${formatMoney(e.totalInterest)}`,
    `Final amount = Principal + Total interest = ${formatMoney(r.principal)} + ${formatMoney(e.totalInterest)} = ${formatMoney(e.finalAmount)}`,
  );
  return lines;
}

/** Text for the Copy button. The exact calculation is included only when it is being shown. */
export function formatInterestSummary(r: InterestResult, includeExact = false): string {
  const d = r.duration;
  const lines = [
    'Interest Calculation (simple interest, rate per ₹100 per month)',
    `Duration: ${formatDuration(d)} (${formatTotalMonths(d)}; ${plural(d.totalDays, 'day')} in total)`,
    `Principal: ${formatMoney(r.principal)}`,
    `Interest rate: ₹${r.rate} per ₹100 per month`,
    `Interest per year: ${formatMoney(r.yearlyInterest)}`,
    `Interest per month: ${formatMoney(r.monthlyInterest)}`,
    `Interest per day: ${formatMoneyPrecise(r.dailyInterest)}`,
    `Total interest: ${formatMoney(r.totalInterest)}`,
    `Final amount: ${formatMoney(r.finalAmount)}`,
  ];
  if (includeExact) lines.push('', 'Exact calculation (real days)', ...buildExactLines(r));
  return lines.join('\n');
}
