import { RotateCcw } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  ADULT_AGE,
  GENDER_LABELS,
  calculateBmi,
  formatBmi,
  type BmiCategory,
  type BmiInput,
  type BmiResult,
  type Gender,
  type HeightUnit,
  type WeightUnit,
} from '../../calculations/bmi';
import { BmiScale } from '../../components/BmiScale/BmiScale';
import { ErrorList } from '../../components/ErrorList/ErrorList';
import { InputField } from '../../components/InputField/InputField';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { ResultCard, ResultRow, ResultRows } from '../../components/ResultCard/ResultCard';
import { SegmentedControl, type SegmentOption } from '../../components/SegmentedControl/SegmentedControl';
import { useOutcome } from '../../hooks/useOutcome';
import { usePageTitle } from '../../hooks/usePageTitle';

const HEIGHT_UNITS: readonly SegmentOption<HeightUnit>[] = [
  { value: 'cm', label: 'cm' },
  { value: 'm', label: 'm' },
  { value: 'ftin', label: 'ft + in' },
];
const WEIGHT_UNITS: readonly SegmentOption<WeightUnit>[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

const GENDER_OPTIONS: readonly SegmentOption<Gender>[] = [
  { value: '', label: GENDER_LABELS[''] },
  { value: 'male', label: GENDER_LABELS.male },
  { value: 'female', label: GENDER_LABELS.female },
  { value: 'other', label: GENDER_LABELS.other },
];

const BADGE_CLASS: Record<BmiCategory, string> = {
  Underweight: 'badge--under',
  'Normal weight': 'badge--normal',
  Overweight: 'badge--over',
  Obesity: 'badge--obese',
};

const initialForm = (): BmiInput => ({
  heightUnit: 'cm',
  height: '',
  feet: '',
  inches: '',
  weightUnit: 'kg',
  weight: '',
  age: '',
  gender: '',
});

const trim = (n: number, digits: number): string => String(Number(n.toFixed(digits)));

export function BMICalculator() {
  usePageTitle('BMI Calculator');
  const [form, setForm] = useState<BmiInput>(initialForm);
  const { outcome, submit, invalidate, resultsRef } = useOutcome<BmiResult>();

  const edit = (patch: Partial<BmiInput>) => {
    setForm((current) => ({ ...current, ...patch }));
    invalidate();
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(() => calculateBmi(form));
  };

  const reset = () => {
    setForm(initialForm());
    invalidate();
  };

  return (
    <div className="page">
      <PageHeader title="BMI Calculator" subtitle="Body mass index from your height and weight, in metric or imperial units." />

      <form className="card form" onSubmit={onSubmit} noValidate>
        <div className="form-block">
          <div className="form-block__head">
            <h2 className="form-block__title">Height</h2>
            <SegmentedControl
              options={HEIGHT_UNITS}
              value={form.heightUnit}
              onChange={(heightUnit) => edit({ heightUnit })}
              label="Height unit"
            />
          </div>
          {form.heightUnit === 'ftin' ? (
            <div className="form-grid">
              <InputField
                id="feet"
                label="Feet"
                value={form.feet}
                onChange={(feet) => edit({ feet })}
                inputMode="numeric"
                suffix="ft"
                placeholder="5"
              />
              <InputField
                id="inches"
                label="Inches"
                value={form.inches}
                onChange={(inches) => edit({ inches })}
                suffix="in"
                placeholder="7"
              />
            </div>
          ) : (
            <InputField
              id="height"
              label={form.heightUnit === 'cm' ? 'Height in centimeters' : 'Height in meters'}
              value={form.height}
              onChange={(height) => edit({ height })}
              suffix={form.heightUnit}
              placeholder={form.heightUnit === 'cm' ? '170' : '1.70'}
            />
          )}
        </div>

        <div className="form-block">
          <div className="form-block__head">
            <h2 className="form-block__title">Weight</h2>
            <SegmentedControl
              options={WEIGHT_UNITS}
              value={form.weightUnit}
              onChange={(weightUnit) => edit({ weightUnit })}
              label="Weight unit"
            />
          </div>
          <InputField
            id="weight"
            label={form.weightUnit === 'kg' ? 'Weight in kilograms' : 'Weight in pounds'}
            value={form.weight}
            onChange={(weight) => edit({ weight })}
            suffix={form.weightUnit}
            placeholder={form.weightUnit === 'kg' ? '70' : '154'}
          />
        </div>

        <div className="form-block">
          <div className="form-block__head">
            <h2 className="form-block__title">Age and gender (optional)</h2>
          </div>
          <div className="form-grid">
            <InputField
              id="age"
              label="Age"
              value={form.age}
              onChange={(age) => edit({ age })}
              inputMode="numeric"
              suffix="years"
              placeholder="Optional"
              maxLength={3}
            />
            <div className="field">
              <span className="field__label">Gender</span>
              <SegmentedControl
                options={GENDER_OPTIONS}
                value={form.gender}
                onChange={(gender) => edit({ gender })}
                label="Gender"
                wrap
              />
            </div>
          </div>
          <p className="field__hint">Age and gender are optional and do not change the BMI calculation.</p>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn--primary">
            Calculate
          </button>
          <button type="button" className="btn btn--secondary" onClick={reset}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>
      </form>

      {outcome && !outcome.ok && <ErrorList errors={outcome.errors} />}
      {outcome?.ok && (
        <div className="results" ref={resultsRef}>
          <BmiResults result={outcome.value} form={form} />
        </div>
      )}
    </div>
  );
}

function BmiResults({ result: r, form }: { result: BmiResult; form: BmiInput }) {
  // Show the metric equivalent next to anything the user entered in other units.
  const heightText = form.heightUnit === 'cm' ? r.heightLabel : `${r.heightLabel} (${trim(r.heightM * 100, 1)} cm)`;
  const weightText = form.weightUnit === 'kg' ? r.weightLabel : `${r.weightLabel} (${trim(r.weightKg, 2)} kg)`;

  return (
    <>
      <ResultCard title="Your result">
        <div className="bmi-headline">
          <div>
            <div className="bmi-headline__label">Your BMI</div>
            <div className="bmi-headline__value">{formatBmi(r.bmi)}</div>
          </div>
          <span className={`badge ${BADGE_CLASS[r.category]}`}>{r.category}</span>
        </div>
        <ResultRows>
          <ResultRow label="Height" value={heightText} />
          <ResultRow label="Weight" value={weightText} />
          {r.age !== null && <ResultRow label="Age" value={`${r.age} ${r.age === 1 ? 'year' : 'years'}`} />}
          {r.gender !== '' && <ResultRow label="Gender" value={GENDER_LABELS[r.gender]} />}
        </ResultRows>
      </ResultCard>

      <ResultCard title="BMI scale">
        <BmiScale bmi={r.bmi} />
      </ResultCard>

      {r.age !== null && r.age < ADULT_AGE && (
        <p className="note">
          The categories above are the standard adult ranges. For children and teenagers, BMI is read against
          age- and sex-specific growth charts, so the category shown here may not apply. A doctor can interpret
          it properly.
        </p>
      )}

      <p className="note">
        BMI is a screening measure, not a complete assessment of health. It does not account for muscle mass, age,
        sex or body composition, and it is not a diagnosis. These categories are for adults. Talk to a healthcare
        professional about your health.
      </p>
    </>
  );
}
