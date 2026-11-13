import { describe, expect, it } from 'vitest';
import { CATEGORIES, UNITS, type Category } from '../constants/units';
import {
  convertInput,
  convertValue,
  findUnit,
  getDefaultSelection,
  swapUnits,
  type UnitSelection,
} from '../calculations/conversion';

function conv(category: Category, fromId: string, toId: string, raw: string) {
  return convertInput(raw, { category, fromId, toId });
}

function value(category: Category, fromId: string, toId: string, raw: string): number {
  const r = conv(category, fromId, toId, raw);
  if (r.status !== 'ok') throw new Error(`Expected ok, got ${r.status}`);
  return r.output.value;
}

describe('unit converter: specification example', () => {
  it('converts 10 cm to 100 mm with a factor line', () => {
    const r = conv('length', 'cm', 'mm', '10');
    if (r.status !== 'ok') throw new Error('expected ok');
    expect(r.output.equation).toBe('10 cm = 100 mm');
    expect(r.output.factorText).toBe('1 cm = 10 mm');
    expect(r.output.value).toBe(100);
  });
});

describe('unit converter: exact known relationships', () => {
  const cases: Array<[Category, string, string, number]> = [
    ['length', 'km', 'mm', 1e6],
    ['length', 'km', 'm', 1000],
    ['length', 'm', 'cm', 100],
    ['length', 'in', 'mm', 25.4],
    ['length', 'ft', 'in', 12],
    ['length', 'yd', 'ft', 3],
    ['length', 'mi', 'ft', 5280],
    ['length', 'mi', 'yd', 1760],
    ['length', 'mi', 'km', 1.609344],
    ['length', 'ft', 'm', 0.3048],
    ['weight', 'kg', 'mg', 1e6],
    ['weight', 'kg', 'g', 1000],
    ['weight', 't', 'kg', 1000],
    ['weight', 'lb', 'oz', 16],
    ['weight', 'lb', 'g', 453.59237],
    ['weight', 'oz', 'g', 28.349523125],
    ['weight', 'kg', 'lb', 2.2046226218488],
    ['volume', 'l', 'ml', 1000],
    ['volume', 'l', 'cm3', 1000],
    ['volume', 'ml', 'cm3', 1],
    ['volume', 'm3', 'l', 1000],
    ['volume', 'usgal', 'usfloz', 128],
    ['volume', 'usgal', 'l', 3.785411784],
    ['volume', 'usfloz', 'ml', 29.5735295625],
  ];
  for (const [category, from, to, expected] of cases) {
    it(`1 ${from} = ${expected} ${to}`, () => {
      const got = value(category, from, to, '1');
      expect(Math.abs(got - expected) / expected).toBeLessThan(1e-12);
    });
  }
});

describe('unit converter: every supported unit pair', () => {
  for (const category of CATEGORIES) {
    const units = UNITS[category];
    it(`${category}: all ${units.length * units.length} ordered pairs are consistent`, () => {
      for (const from of units) {
        for (const to of units) {
          const forward = convertValue(1, from, to);
          const back = convertValue(1, to, from);
          expect(Number.isFinite(forward)).toBe(true);
          expect(forward).toBeGreaterThan(0);
          // Same unit is the identity.
          if (from.id === to.id) expect(forward).toBe(1);
          // a->b and b->a are reciprocal.
          expect(Math.abs(forward * back - 1)).toBeLessThan(1e-12);
          // Chain through the base unit.
          const expected = from.factor / to.factor;
          expect(Math.abs(forward - expected) / expected).toBeLessThan(1e-12);
          // A value round-trips.
          const x = convertValue(convertValue(123.456, from, to), to, from);
          expect(Math.abs(x - 123.456) / 123.456).toBeLessThan(1e-12);
        }
      }
    });
  }
});

describe('unit converter: numbers', () => {
  it('converts decimals', () => {
    expect(value('length', 'm', 'cm', '2.5')).toBe(250);
    expect(value('length', 'km', 'm', '0.1')).toBe(100);
    expect(value('length', 'cm', 'mm', '.5')).toBe(5);
    expect(value('weight', 'g', 'kg', '1500.5')).toBe(1.5005);
    expect(value('volume', 'ml', 'l', '250')).toBe(0.25);
  });

  it('converts negative values', () => {
    expect(value('length', 'm', 'cm', '-5')).toBe(-500);
  });

  it('converts very large values', () => {
    expect(value('length', 'm', 'km', '1e300')).toBe(1e297);
    const r = conv('length', 'm', 'km', '1e300');
    if (r.status !== 'ok') throw new Error('expected ok');
    expect(r.output.equation).toBe('1e+300 m = 1e+297 km');
    expect(value('length', 'km', 'mm', '123456789012')).toBe(1.23456789012e17);
  });

  it('converts very small values', () => {
    expect(value('length', 'm', 'mm', '1e-300')).toBe(1e-297);
    expect(value('weight', 'mg', 't', '1')).toBe(1e-9);
  });

  it('reports overflow instead of Infinity', () => {
    expect(conv('length', 'km', 'mm', '1e308').status).toBe('error');
  });

  it('returns empty for blank input and errors for malformed input', () => {
    expect(conv('length', 'cm', 'mm', '').status).toBe('empty');
    expect(conv('length', 'cm', 'mm', '   ').status).toBe('empty');
    for (const bad of ['abc', '1,000', '1e', '--5', '5 5', '1.2.3', 'Infinity', 'NaN']) {
      expect(conv('length', 'cm', 'mm', bad).status).toBe('error');
    }
  });

  it('rejects units from another category', () => {
    expect(conv('length', 'cm', 'kg', '1').status).toBe('error');
    expect(conv('weight', 'ml', 'g', '1').status).toBe('error');
  });
});

describe('unit converter: swapping and categories', () => {
  it('swaps units and reverses the conversion', () => {
    const sel: UnitSelection = { category: 'length', fromId: 'cm', toId: 'mm' };
    const swapped = swapUnits(sel);
    expect(swapped).toEqual({ category: 'length', fromId: 'mm', toId: 'cm' });
    const r = convertInput('100', swapped);
    if (r.status !== 'ok') throw new Error('expected ok');
    expect(r.output.equation).toBe('100 mm = 10 cm');
    expect(swapUnits(swapped)).toEqual(sel);
  });

  it('keeps categories separate with the required units', () => {
    expect(UNITS.length.map((u) => u.id)).toEqual(['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi']);
    expect(UNITS.weight.map((u) => u.id)).toEqual(['mg', 'g', 'kg', 't', 'oz', 'lb']);
    expect(UNITS.volume.map((u) => u.id)).toEqual(['ml', 'l', 'cm3', 'm3', 'usfloz', 'usgal']);
    const all = CATEGORIES.flatMap((c) => UNITS[c].map((u) => u.id));
    expect(new Set(all).size).toBe(all.length); // no unit id shared between categories
  });

  it('labels US gallons and US fluid ounces explicitly', () => {
    expect(findUnit('volume', 'usgal')?.label).toContain('US');
    expect(findUnit('volume', 'usfloz')?.label).toContain('US');
  });

  it('provides valid default selections for every category', () => {
    for (const category of CATEGORIES) {
      const sel = getDefaultSelection(category);
      expect(findUnit(category, sel.fromId)).toBeTruthy();
      expect(findUnit(category, sel.toId)).toBeTruthy();
      expect(sel.fromId === sel.toId).toBe(false);
    }
  });
});
