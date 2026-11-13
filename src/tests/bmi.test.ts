import { describe, expect, it } from 'vitest';
import {
  calculateBmi,
  categorize,
  feetInchesToMeters,
  formatBmi,
  poundsToKilograms,
  scalePercent,
  type BmiInput,
} from '../calculations/bmi';
import { errorsOf, ok } from './helpers';

const metric = (height: string, weight: string, heightUnit: 'cm' | 'm' = 'cm'): BmiInput => ({
  heightUnit,
  height,
  feet: '',
  inches: '',
  weightUnit: 'kg',
  weight,
  age: '',
  gender: '',
});

const imperial = (feet: string, inches: string, pounds: string): BmiInput => ({
  heightUnit: 'ftin',
  height: '',
  feet,
  inches,
  weightUnit: 'lb',
  weight: pounds,
  age: '',
  gender: '',
});

describe('BMI calculator: metric', () => {
  it('calculates from centimeters and kilograms', () => {
    const r = ok(calculateBmi(metric('175', '70')));
    expect(r.bmi).toBeCloseTo(22.857142857, 8);
    expect(r.category).toBe('Normal weight');
    expect(r.heightM).toBeCloseTo(1.75, 10);
    expect(r.heightLabel).toBe('175 cm');
    expect(r.weightLabel).toBe('70 kg');
  });

  it('calculates from meters', () => {
    const r = ok(calculateBmi(metric('1.75', '70', 'm')));
    expect(r.bmi).toBeCloseTo(22.857142857, 8);
    expect(r.heightLabel).toBe('1.75 m');
  });

  it('accepts decimal weight', () => {
    expect(ok(calculateBmi(metric('180', '80.5'))).bmi).toBeCloseTo(24.846, 3);
  });
});

describe('BMI calculator: imperial', () => {
  it('converts feet/inches and pounds exactly', () => {
    expect(feetInchesToMeters(5, 9)).toBeCloseTo(1.7526, 10);
    expect(feetInchesToMeters(6, 0)).toBeCloseTo(1.8288, 10);
    expect(poundsToKilograms(1)).toBe(0.45359237);
    expect(poundsToKilograms(160)).toBeCloseTo(72.5747792, 8);
  });

  it('calculates from feet, inches and pounds', () => {
    const r = ok(calculateBmi(imperial('5', '9', '160')));
    expect(r.bmi).toBeCloseTo(72.5747792 / (1.7526 * 1.7526), 8);
    expect(r.bmi).toBeCloseTo(23.63, 2);
    expect(r.category).toBe('Normal weight');
    expect(r.heightLabel).toBe('5 ft 9 in');
    expect(r.weightLabel).toBe('160 lb');
  });

  it('treats blank inches as zero and accepts decimal inches', () => {
    expect(ok(calculateBmi(imperial('6', '', '180'))).heightM).toBeCloseTo(1.8288, 10);
    expect(ok(calculateBmi(imperial('5', '7.5', '150'))).heightM).toBeCloseTo(1.7145, 10);
  });

  it('mixes metric height with pounds', () => {
    const r = ok(calculateBmi({ ...metric('180', '176.37'), weightUnit: 'lb' }));
    expect(r.weightKg).toBeCloseTo(80, 2);
  });
});

describe('BMI calculator: categories', () => {
  it('uses the standard adult thresholds', () => {
    expect(categorize(10)).toBe('Underweight');
    expect(categorize(18.49)).toBe('Underweight');
    expect(categorize(18.5)).toBe('Normal weight');
    expect(categorize(24.9)).toBe('Normal weight');
    expect(categorize(24.99999)).toBe('Normal weight'); // no gap between 24.9 and 25
    expect(categorize(25)).toBe('Overweight');
    expect(categorize(29.9)).toBe('Overweight');
    expect(categorize(29.99999)).toBe('Overweight');
    expect(categorize(30)).toBe('Obesity');
    expect(categorize(55)).toBe('Obesity');
  });

  it('assigns every category end to end', () => {
    expect(ok(calculateBmi(metric('170', '50'))).category).toBe('Underweight'); // 17.30
    expect(ok(calculateBmi(metric('180', '80'))).category).toBe('Normal weight'); // 24.69
    expect(ok(calculateBmi(metric('175', '85'))).category).toBe('Overweight'); // 27.76
    expect(ok(calculateBmi(metric('175', '100'))).category).toBe('Obesity'); // 32.65
  });

  it('puts exact boundary values in the higher category despite floating-point noise', () => {
    // Raw doubles: 64 / 1.6² = 24.999999999999996, 47.36 / 1.6² = 18.499999999999996, 76.8 / 1.6² = 29.999999999999993
    const at = (kg: string) => ok(calculateBmi(metric('160', kg)));
    expect(at('64').bmi).toBe(25);
    expect(at('64').category).toBe('Overweight');
    expect(at('47.36').bmi).toBe(18.5);
    expect(at('47.36').category).toBe('Normal weight');
    expect(at('76.8').bmi).toBe(30);
    expect(at('76.8').category).toBe('Obesity');
    expect(at('63.99').category).toBe('Normal weight'); // genuinely below 25
  });

  it('formats BMI without contradicting the category', () => {
    expect(formatBmi(22.857142857)).toBe('22.9');
    expect(formatBmi(25)).toBe('25.0');
    expect(formatBmi(18.5)).toBe('18.5');
    // Rounding to one decimal would show 25.0 / 18.5 / 30.0, which belong to the next category up.
    expect(formatBmi(24.96)).toBe('24.96');
    expect(formatBmi(24.999)).toBe('24.99');
    expect(formatBmi(18.47)).toBe('18.47');
    expect(formatBmi(29.951)).toBe('29.95');
  });

  it('positions the scale marker within bounds', () => {
    expect(scalePercent(15)).toBe(0);
    expect(scalePercent(40)).toBe(100);
    expect(scalePercent(27.5)).toBe(50);
    expect(scalePercent(5)).toBe(0);
    expect(scalePercent(100)).toBe(100);
  });
});

describe('BMI calculator: optional age and gender', () => {
  const withExtras = (age: string, gender: BmiInput['gender'] = ''): BmiInput => ({
    ...metric('175', '70'),
    age,
    gender,
  });

  it('works with age and gender left blank', () => {
    const r = ok(calculateBmi(metric('175', '70')));
    expect(r.age).toBeNull();
    expect(r.gender).toBe('');
  });

  it('accepts every age from 0 to 120, including children and teenagers', () => {
    for (const a of ['0', '1', '5', '12', '17', '18', '40', '99', '120']) {
      expect(ok(calculateBmi(withExtras(a))).age).toBe(Number(a));
    }
    expect(ok(calculateBmi(withExtras(' 25 '))).age).toBe(25);
  });

  it('passes gender through to the result', () => {
    expect(ok(calculateBmi(withExtras('', 'male'))).gender).toBe('male');
    expect(ok(calculateBmi(withExtras('30', 'female'))).gender).toBe('female');
    expect(ok(calculateBmi(withExtras('30', 'other'))).gender).toBe('other');
  });

  it('never changes the BMI value or category', () => {
    const base = ok(calculateBmi(metric('175', '70')));
    for (const a of ['', '0', '10', '17', '18', '65', '120']) {
      for (const g of ['', 'male', 'female', 'other'] as const) {
        const r = ok(calculateBmi(withExtras(a, g)));
        expect(r.bmi).toBe(base.bmi);
        expect(r.category).toBe(base.category);
      }
    }
  });

  it('rejects an invalid age instead of ignoring it', () => {
    for (const bad of ['abc', '-5', '12.5', '1e2', '121', '999', '1,5', '2O']) {
      const errors = errorsOf(calculateBmi(withExtras(bad)));
      expect(errors.length).toBe(1);
      expect(errors[0]).toMatch(/age/i);
    }
  });

  it('reports an age error together with other errors', () => {
    const errors = errorsOf(calculateBmi({ ...metric('', ''), age: 'x' }));
    expect(errors.length).toBe(3);
  });
});

describe('BMI calculator: invalid input', () => {
  it('requires height and weight', () => {
    expect(errorsOf(calculateBmi(metric('', '70'))).join(' ')).toMatch(/height/i);
    expect(errorsOf(calculateBmi(metric('175', ''))).join(' ')).toMatch(/weight/i);
    expect(errorsOf(calculateBmi(metric('', ''))).length).toBe(2);
    expect(errorsOf(calculateBmi(imperial('', '5', '150'))).join(' ')).toMatch(/feet/i);
  });

  it('rejects non-numeric and negative values', () => {
    expect(errorsOf(calculateBmi(metric('abc', '70'))).length).toBe(1);
    expect(errorsOf(calculateBmi(metric('-170', '70'))).length).toBe(1);
    expect(errorsOf(calculateBmi(metric('175', '7O'))).length).toBe(1);
    expect(errorsOf(calculateBmi(metric('175', '-70'))).length).toBe(1);
    expect(errorsOf(calculateBmi(metric('1,75', '70'))).length).toBe(1);
  });

  it('rejects zero and implausible values after unit conversion', () => {
    expect(errorsOf(calculateBmi(metric('0', '70'))).length).toBe(1);
    expect(errorsOf(calculateBmi(metric('175', '0'))).length).toBe(1);
    expect(errorsOf(calculateBmi(metric('10', '70'))).length).toBe(1); // 10 cm
    expect(errorsOf(calculateBmi(metric('1750', '70'))).length).toBe(1); // 17.5 m typed as cm
    expect(errorsOf(calculateBmi(metric('1.75', '70', 'cm'))).length).toBe(1); // 1.75 cm
    expect(errorsOf(calculateBmi(metric('175', '5000'))).length).toBe(1);
    expect(errorsOf(calculateBmi(imperial('0', '0', '150'))).length).toBe(1);
  });

  it('does not silently correct inches of 12 or more', () => {
    expect(errorsOf(calculateBmi(imperial('5', '12', '150'))).join(' ')).toMatch(/less than 12/);
    expect(errorsOf(calculateBmi(imperial('5', '15', '150'))).join(' ')).toMatch(/less than 12/);
    expect(errorsOf(calculateBmi(imperial('5.5', '3', '150'))).join(' ')).toMatch(/whole number/);
  });
});
