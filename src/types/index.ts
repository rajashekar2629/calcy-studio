/** Discriminated result used by every calculation module. No exceptions for user errors. */
export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

export type Era = 'CE' | 'BCE';

/** Raw (string) date fields exactly as typed/selected in the UI. */
export interface DateFields {
  year: string;
  month: string;
  day: string;
}

export interface DateTimeFields extends DateFields {
  era: Era;
  hour: string;
  minute: string;
  second: string;
}

export interface HistoryEntry {
  id: number;
  expression: string;
  result: string;
}
