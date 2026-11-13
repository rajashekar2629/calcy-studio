import { ChevronDown } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import { CATEGORIES, CATEGORY_LABELS, UNITS, type Category } from '../../constants/units';
import { SelectField } from '../InputField/InputField';

interface UnitSelectorProps {
  id: string;
  label: string;
  category: Category;
  value: string;
  onChange: (unitId: string) => void;
}

/** Drop-down listing only the units of one category. */
export function UnitSelector({ id, label, category, value, onChange }: UnitSelectorProps) {
  return (
    <SelectField id={id} label={label} value={value} onChange={onChange}>
      {UNITS[category].map((unit) => (
        <option key={unit.id} value={unit.id}>
          {unit.label}
        </option>
      ))}
    </SelectField>
  );
}

interface CategoryPickerProps {
  value: Category;
  onChange: (category: Category) => void;
}

/** A button that reveals the three categories; the chosen one is highlighted. Escape closes it. */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') setOpen(false);
  };

  return (
    <div className="category" onKeyDown={onKeyDown}>
      <button
        type="button"
        className="btn btn--secondary category__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        Category: <strong>{CATEGORY_LABELS[value]}</strong>
        <ChevronDown size={16} aria-hidden="true" className={open ? 'category__chevron is-open' : 'category__chevron'} />
      </button>

      {open && (
        <div id={panelId} className="category__panel" role="group" aria-label="Unit categories">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={`chip${category === value ? ' chip--active' : ''}`}
              aria-pressed={category === value}
              onClick={() => {
                onChange(category);
                setOpen(false);
              }}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
