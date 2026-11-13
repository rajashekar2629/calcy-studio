import { describe, expect, it } from 'vitest';
import {
  daysFromCivil,
  daysInMonth,
  fromAstronomicalYear,
  isLeapYear,
  toAstronomicalYear,
  validateYear,
} from '../utils/calendar';

describe('calendar utilities', () => {
  it('applies the Gregorian leap rule to astronomical years', () => {
    for (const y of [2024, 2000, 1600, 0, -4, -400, 4]) expect(isLeapYear(y)).toBe(true);
    for (const y of [2023, 1900, 2100, -1, -100, 1, 100]) expect(isLeapYear(y)).toBe(false);
  });

  it('knows month lengths', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(2023, 4)).toBe(30);
    expect(daysInMonth(2023, 12)).toBe(31);
  });

  it('counts days from the Unix epoch', () => {
    expect(daysFromCivil(1970, 1, 1)).toBe(0);
    expect(daysFromCivil(1970, 1, 2)).toBe(1);
    expect(daysFromCivil(1969, 12, 31)).toBe(-1);
    expect(daysFromCivil(2000, 3, 1)).toBe(11017);
    expect(daysFromCivil(1, 1, 1)).toBe(-719162);
  });

  it('is consecutive across the 1 BCE / 1 CE boundary', () => {
    expect(daysFromCivil(1, 1, 1) - daysFromCivil(0, 12, 31)).toBe(1);
    expect(daysFromCivil(1, 1, 1) - daysFromCivil(0, 1, 1)).toBe(366);
  });

  it('maps CE/BCE to astronomical years with no year zero', () => {
    expect(toAstronomicalYear(1, 'CE')).toBe(1);
    expect(toAstronomicalYear(1, 'BCE')).toBe(0);
    expect(toAstronomicalYear(2, 'BCE')).toBe(-1);
    expect(toAstronomicalYear(10000, 'BCE')).toBe(-9999);
    expect(fromAstronomicalYear(0)).toEqual({ year: 1, era: 'BCE' });
    expect(fromAstronomicalYear(1)).toEqual({ year: 1, era: 'CE' });
    expect(fromAstronomicalYear(-9999)).toEqual({ year: 10000, era: 'BCE' });
    for (let y = -20; y <= 20; y++) expect(fromAstronomicalYear(y).year).toBeGreaterThanOrEqual(1);
  });
});

describe('validateYear', () => {
  it('accepts empty text (not an error yet) and valid years', () => {
    expect(validateYear('', 1, 10000)).toBeNull();
    expect(validateYear('  ', 1, 10000)).toBeNull();
    expect(validateYear('1', 1, 10000)).toBeNull();
    expect(validateYear('10000', 1, 10000)).toBeNull();
  });

  it('rejects year zero, out-of-range and malformed text', () => {
    expect(validateYear('0', 1, 10000)).toMatch(/no year 0/);
    expect(validateYear('00', 1, 10000)).toMatch(/no year 0/);
    expect(validateYear('10001', 1, 10000)).toMatch(/between 1 and 10,000/);
    expect(validateYear('10000', 1, 9999)).toMatch(/between 1 and 9,999/);
    for (const bad of ['-5', '1.5', '2e3', '12a', '+7', '１２']) {
      expect(validateYear(bad, 1, 10000)).toMatch(/digits only/);
    }
  });
});

