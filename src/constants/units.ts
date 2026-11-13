/**
 * Unit tables. Every factor is the EXACT definition of the unit expressed in the
 * category's base unit (metre, kilogram, litre).
 */
export type Category = 'length' | 'weight' | 'volume';

export interface UnitDef {
  id: string;
  /** Short symbol shown in results, e.g. "cm". */
  symbol: string;
  /** Full label shown in selectors. */
  label: string;
  /** Size of one unit in the category's base unit. */
  factor: number;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  length: 'Length',
  weight: 'Weight',
  volume: 'Volume',
};

export const CATEGORY_BASE: Record<Category, string> = {
  length: 'metre',
  weight: 'kilogram',
  volume: 'litre',
};

export const UNITS: Record<Category, UnitDef[]> = {
  length: [
    { id: 'mm', symbol: 'mm', label: 'Millimeter (mm)', factor: 0.001 },
    { id: 'cm', symbol: 'cm', label: 'Centimeter (cm)', factor: 0.01 },
    { id: 'm', symbol: 'm', label: 'Meter (m)', factor: 1 },
    { id: 'km', symbol: 'km', label: 'Kilometer (km)', factor: 1000 },
    { id: 'in', symbol: 'in', label: 'Inch (in)', factor: 0.0254 },
    { id: 'ft', symbol: 'ft', label: 'Foot (ft)', factor: 0.3048 },
    { id: 'yd', symbol: 'yd', label: 'Yard (yd)', factor: 0.9144 },
    { id: 'mi', symbol: 'mi', label: 'Mile (mi)', factor: 1609.344 },
  ],
  weight: [
    { id: 'mg', symbol: 'mg', label: 'Milligram (mg)', factor: 0.000001 },
    { id: 'g', symbol: 'g', label: 'Gram (g)', factor: 0.001 },
    { id: 'kg', symbol: 'kg', label: 'Kilogram (kg)', factor: 1 },
    { id: 't', symbol: 't', label: 'Metric tonne (t)', factor: 1000 },
    { id: 'oz', symbol: 'oz', label: 'Ounce (oz)', factor: 0.028349523125 },
    { id: 'lb', symbol: 'lb', label: 'Pound (lb)', factor: 0.45359237 },
  ],
  volume: [
    { id: 'ml', symbol: 'ml', label: 'Milliliter (ml)', factor: 0.001 },
    { id: 'l', symbol: 'L', label: 'Liter (L)', factor: 1 },
    { id: 'cm3', symbol: 'cm³', label: 'Cubic centimeter (cm³)', factor: 0.001 },
    { id: 'm3', symbol: 'm³', label: 'Cubic meter (m³)', factor: 1000 },
    { id: 'usfloz', symbol: 'US fl oz', label: 'US fluid ounce (US fl oz)', factor: 0.0295735295625 },
    { id: 'usgal', symbol: 'US gal', label: 'US gallon (US gal, 3.785 L)', factor: 3.785411784 },
  ],
};

export const CATEGORIES = Object.keys(UNITS) as Category[];
