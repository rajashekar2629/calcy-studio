import type { Result } from '../../types';
import { normalizeSignificant } from '../../utils/format';
import { isBlank, parseUnsignedDecimal, parseUnsignedInteger } from '../../utils/parse';

export type HeightUnit = 'cm' | 'm' | 'ftin';
export type WeightUnit = 'kg' | 'lb';
export type BmiCategory = 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity';
/** '' means "not specified". Gender is shown in the result only; it never changes the BMI. */
export type Gender = '' | 'male' | 'female' | 'other';

export const GENDER_LABELS: Record<Gender, string> = {
  '': 'Not specified',
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

export interface BmiInput {
  heightUnit: HeightUnit;
  /** Used for cm and m. */
  height: string;
  /** Used for ft + in. */
  feet: string;
  inches: string;
  weightUnit: WeightUnit;
  weight: string;
  /** Optional. Blank means "not given"; otherwise a whole number of years. */
  age: string;
  gender: Gender;
}

export interface BmiResult {
  heightM: number;
  weightKg: number;
  bmi: number;
  category: BmiCategory;
  heightLabel: string;
  weightLabel: string;
  /** null when the age was left blank. */
  age: number | null;
  gender: Gender;
}

/** The category table is for adults; for younger ages the page adds an explanatory note. */
export const ADULT_AGE = 18;
export const MAX_AGE = 120;

// Exact definitions.
export const CM_PER_INCH = 2.54;
export const INCHES_PER_FOOT = 12;
export const KG_PER_POUND = 0.45359237;

/** Plausibility limits applied AFTER conversion to metric. */
export const MIN_HEIGHT_M = 0.5;
export const MAX_HEIGHT_M = 3;
export const MIN_WEIGHT_KG = 2;
export const MAX_WEIGHT_KG = 700;

export const BMI_THRESHOLDS = { underweight: 18.5, overweight: 25, obesity: 30 } as const;

export function categorize(bmi: number): BmiCategory {
  if (bmi < BMI_THRESHOLDS.underweight) return 'Underweight';
  if (bmi < BMI_THRESHOLDS.overweight) return 'Normal weight';
  if (bmi < BMI_THRESHOLDS.obesity) return 'Overweight';
  return 'Obesity';
}

/**
 * BMI = kg / m². The quotient is normalized to 12 significant digits so floating-point noise
 * cannot push an exact boundary value into the wrong category
 * (64 kg at 1.6 m is exactly 25, but raw doubles give 24.999999999999996).
 */
export function computeBmi(weightKg: number, heightM: number): number {
  return normalizeSignificant(weightKg / (heightM * heightM), 12);
}

/**
 * Display text for a BMI value. One decimal normally; two truncated decimals when rounding to
 * one decimal would show a number that belongs to a different category than the real value
 * (e.g. 24.96 must not be displayed as "25.0" next to "Normal weight").
 */
export function formatBmi(bmi: number): string {
  const oneDecimal = Number(bmi.toFixed(1));
  if (categorize(oneDecimal) === categorize(bmi)) return oneDecimal.toFixed(1);
  return (Math.floor(Number((bmi * 100).toPrecision(12))) / 100).toFixed(2);
}

export function feetInchesToMeters(feet: number, inches: number): number {
  return ((feet * INCHES_PER_FOOT + inches) * CM_PER_INCH) / 100;
}

export function poundsToKilograms(pounds: number): number {
  return pounds * KG_PER_POUND;
}

/** Position (0-100) of a BMI value on the visual scale, which spans BMI 15 to 40. */
export function scalePercent(bmi: number, min = 15, max = 40): number {
  return Math.min(100, Math.max(0, ((bmi - min) / (max - min)) * 100));
}

export function calculateBmi(input: BmiInput): Result<BmiResult> {
  const errors: string[] = [];
  let heightM: number | null = null;
  let heightLabel = '';

  if (input.heightUnit === 'ftin') {
    if (isBlank(input.feet)) errors.push('Enter the height in feet.');
    const feet = isBlank(input.feet) ? null : parseUnsignedInteger(input.feet);
    const inches = isBlank(input.inches) ? 0 : parseUnsignedDecimal(input.inches);
    if (!isBlank(input.feet) && feet === null) errors.push('Feet must be a whole number.');
    if (inches === null) errors.push('Inches must be a number of zero or more.');
    else if (inches >= INCHES_PER_FOOT) errors.push('Inches must be less than 12. Add whole feet to the feet field.');
    if (feet !== null && inches !== null && inches < INCHES_PER_FOOT) {
      heightM = feetInchesToMeters(feet, inches);
      heightLabel = `${feet} ft ${inches} in`;
    }
  } else {
    if (isBlank(input.height)) errors.push('Enter your height.');
    else {
      const h = parseUnsignedDecimal(input.height);
      if (h === null) errors.push('Height must be a positive number.');
      else {
        heightM = input.heightUnit === 'cm' ? h / 100 : h;
        heightLabel = `${h} ${input.heightUnit}`;
      }
    }
  }
  if (heightM !== null && (heightM < MIN_HEIGHT_M || heightM > MAX_HEIGHT_M)) {
    errors.push('Height must be between 0.5 m and 3 m (50 cm to 300 cm, about 1 ft 8 in to 9 ft 10 in).');
    heightM = null;
  }

  let weightKg: number | null = null;
  let weightLabel = '';
  if (isBlank(input.weight)) errors.push('Enter your weight.');
  else {
    const w = parseUnsignedDecimal(input.weight);
    if (w === null) errors.push('Weight must be a positive number.');
    else {
      weightKg = input.weightUnit === 'kg' ? w : poundsToKilograms(w);
      weightLabel = `${w} ${input.weightUnit}`;
      if (weightKg < MIN_WEIGHT_KG || weightKg > MAX_WEIGHT_KG) {
        errors.push('Weight must be between 2 kg and 700 kg (about 4.4 lb to 1,543 lb).');
        weightKg = null;
      }
    }
  }

  // Age is optional, but if something is typed it must be valid (never silently ignored).
  let age: number | null = null;
  if (!isBlank(input.age)) {
    age = parseUnsignedInteger(input.age);
    if (age === null || age > MAX_AGE) {
      errors.push(`Age must be a whole number from 0 to ${MAX_AGE}, or left blank.`);
      age = null;
    }
  }

  if (errors.length > 0 || heightM === null || weightKg === null) return { ok: false, errors };

  const bmi = computeBmi(weightKg, heightM);
  return {
    ok: true,
    value: { heightM, weightKg, bmi, category: categorize(bmi), heightLabel, weightLabel, age, gender: input.gender },
  };
}
