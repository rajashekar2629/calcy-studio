import { ArrowLeftRight, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  convertInput,
  getDefaultSelection,
  swapUnits,
  type UnitSelection,
} from '../../calculations/conversion';
import { InputField } from '../../components/InputField/InputField';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { CategoryPicker, UnitSelector } from '../../components/UnitSelector/UnitSelector';
import type { Category } from '../../constants/units';
import { usePageTitle } from '../../hooks/usePageTitle';

const initialSelection = (): UnitSelection => getDefaultSelection('length');

export function UnitConverter() {
  usePageTitle('Length, Weight and Volume Converter');
  const [raw, setRaw] = useState('');
  const [selection, setSelection] = useState<UnitSelection>(initialSelection);

  // Converts immediately on every change; there is no Calculate button.
  const state = useMemo(() => convertInput(raw, selection), [raw, selection]);

  const changeCategory = (category: Category) => setSelection(getDefaultSelection(category));
  const reset = () => {
    setRaw('');
    setSelection(initialSelection());
  };

  const outputText = state.status === 'ok' ? state.output.outputText : '';

  return (
    <div className="page">
      <PageHeader
        title="Length, Weight and Volume Converter"
        subtitle="Pick a category, choose two units and type a value. The result updates as you type."
      />

      <div className="card">
        <CategoryPicker value={selection.category} onChange={changeCategory} />

        <div className="converter__grid">
          <div className="converter__side">
            <UnitSelector
              id="from-unit"
              label="From unit"
              category={selection.category}
              value={selection.fromId}
              onChange={(fromId) => setSelection((s) => ({ ...s, fromId }))}
            />
            <InputField
              id="convert-value"
              label="Value"
              value={raw}
              onChange={setRaw}
              placeholder="Enter a value"
              error={state.status === 'error' ? state.error : null}
            />
          </div>

          <button
            type="button"
            className="swap"
            onClick={() => setSelection((s) => swapUnits(s))}
            aria-label="Swap units"
            title="Swap units"
          >
            <ArrowLeftRight size={18} aria-hidden="true" />
          </button>

          <div className="converter__side">
            <UnitSelector
              id="to-unit"
              label="To unit"
              category={selection.category}
              value={selection.toId}
              onChange={(toId) => setSelection((s) => ({ ...s, toId }))}
            />
            <InputField
              id="convert-output"
              label="Converted value"
              value={outputText}
              onChange={() => undefined}
              readOnly
              placeholder="Result"
            />
          </div>
        </div>

        <div className="converter__summary" aria-live="polite">
          {state.status === 'ok' ? (
            <>
              <p className="converter__equation">{state.output.equation}</p>
              <p className="converter__factor">Conversion factor: {state.output.factorText}.</p>
            </>
          ) : (
            <p className="converter__factor">Enter a value to see the conversion and its factor.</p>
          )}
        </div>

        {selection.category === 'volume' && (
          <p className="note">
            Gallons and fluid ounces here are US customary units (1 US gal = 3.785411784 L). Imperial (UK) gallons
            are different (about 4.546 L) and are not included.
          </p>
        )}

        <div className="form-actions converter__actions">
          <button type="button" className="btn btn--secondary" onClick={reset}>
            <RotateCcw size={16} aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
