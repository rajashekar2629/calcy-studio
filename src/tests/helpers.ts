import type { DateTimeFields, Era, Result } from '../types';

/** Unwrap a successful Result or fail the test with the validation errors. */
export function ok<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`Expected success but got errors: ${result.errors.join(' | ')}`);
  return result.value;
}

/** Unwrap the error list of a failed Result. */
export function errorsOf<T>(result: Result<T>): string[] {
  if (result.ok) throw new Error('Expected failure but the calculation succeeded');
  return result.errors;
}

/** Build date-time form fields from numbers (stringified, as the UI would hold them). */
export function dt(
  year: number | string,
  era: Era,
  month: number | string,
  day: number | string,
  hour: number | string = '',
  minute: number | string = '',
  second: number | string = '',
): DateTimeFields {
  return {
    year: String(year),
    era,
    month: String(month),
    day: String(day),
    hour: String(hour),
    minute: String(minute),
    second: String(second),
  };
}
