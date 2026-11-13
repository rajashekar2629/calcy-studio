import { useId } from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name of the group. */
  label: string;
  /** Let the options fill the available width and wrap onto a second row on narrow screens. */
  wrap?: boolean;
}

/** Native radio inputs styled as a toggle: arrow-key navigation and screen-reader support come for free. */
export function SegmentedControl<T extends string>({ options, value, onChange, label, wrap = false }: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <div className={wrap ? 'segmented segmented--wrap' : 'segmented'} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <label key={option.value} className="segmented__option">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
