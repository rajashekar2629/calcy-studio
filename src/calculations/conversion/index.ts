import { CATEGORIES, UNITS, type Category, type UnitDef } from '../../constants/units';
import { formatPlain, normalizeSignificant } from '../../utils/format';
import { isBlank, parseSignedNumber } from '../../utils/parse';

/** Converted values are rounded to this many significant digits to remove float noise. */
export const CONVERSION_DIGITS = 14;

export interface UnitSelection {
  category: Category;
  fromId: string;
  toId: string;
}

export interface ConversionOutput {
  value: number;
  /** Size of 1 source unit expressed in the target unit. */
  factor: number;
  from: UnitDef;
  to: UnitDef;
  inputText: string;
  outputText: string;
  /** e.g. "10 cm = 100 mm" */
  equation: string;
  /** e.g. "1 cm = 10 mm" */
  factorText: string;
}

export type ConversionState =
  | { status: 'empty' }
  | { status: 'error'; error: string }
  | { status: 'ok'; output: ConversionOutput };

export function findUnit(category: Category, id: string): UnitDef | undefined {
  return UNITS[category].find((u) => u.id === id);
}

export function getDefaultSelection(category: Category): UnitSelection {
  const units = UNITS[category];
  // Common, recognisable defaults per category.
  const defaults: Record<Category, [string, string]> = {
    length: ['cm', 'mm'],
    weight: ['kg', 'g'],
    volume: ['l', 'ml'],
  };
  const [fromId, toId] = defaults[category];
  return units.some((u) => u.id === fromId) ? { category, fromId, toId } : { category, fromId: units[0].id, toId: units[1].id };
}

export function swapUnits(sel: UnitSelection): UnitSelection {
  return { ...sel, fromId: sel.toId, toId: sel.fromId };
}

/** Convert a number between two units of the same category. */
export function convertValue(value: number, from: UnitDef, to: UnitDef): number {
  // Multiply by the unit ratio (not value * from / to) so huge or tiny inputs don't overflow early.
  return normalizeSignificant(value * (from.factor / to.factor), CONVERSION_DIGITS);
}

export function convertInput(raw: string, sel: UnitSelection): ConversionState {
  if (isBlank(raw)) return { status: 'empty' };
  const from = findUnit(sel.category, sel.fromId);
  const to = findUnit(sel.category, sel.toId);
  if (!from || !to) return { status: 'error', error: 'Choose two units from the same category.' };
  const value = parseSignedNumber(raw);
  if (value === null) return { status: 'error', error: 'Enter a valid number (for example 12.5 or 1e-6).' };

  const result = convertValue(value, from, to);
  if (!Number.isFinite(result)) return { status: 'error', error: 'The result is too large to display.' };

  const factor = convertValue(1, from, to);
  const inputText = formatPlain(value);
  const outputText = formatPlain(result);
  return {
    status: 'ok',
    output: {
      value: result,
      factor,
      from,
      to,
      inputText,
      outputText,
      equation: `${inputText} ${from.symbol} = ${outputText} ${to.symbol}`,
      factorText: `1 ${from.symbol} = ${formatPlain(factor)} ${to.symbol}`,
    },
  };
}

export { CATEGORIES };
