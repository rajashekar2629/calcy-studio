import type { Key } from '../../calculations/basic';

type Kind = 'fn' | 'num' | 'op' | 'eq';

interface KeyDef {
  key: Key;
  label: string;
  kind: Kind;
  aria: string;
}

/** Row-major order of the 4 x 5 keypad. */
const KEYS: readonly KeyDef[] = [
  { key: 'AC', label: 'AC', kind: 'fn', aria: 'All clear' },
  { key: 'DEL', label: 'DEL', kind: 'fn', aria: 'Delete last character' },
  { key: '%', label: '%', kind: 'fn', aria: 'Percent' },
  { key: '÷', label: '÷', kind: 'op', aria: 'Divide' },
  { key: '7', label: '7', kind: 'num', aria: '7' },
  { key: '8', label: '8', kind: 'num', aria: '8' },
  { key: '9', label: '9', kind: 'num', aria: '9' },
  { key: '×', label: '×', kind: 'op', aria: 'Multiply' },
  { key: '4', label: '4', kind: 'num', aria: '4' },
  { key: '5', label: '5', kind: 'num', aria: '5' },
  { key: '6', label: '6', kind: 'num', aria: '6' },
  { key: '-', label: '−', kind: 'op', aria: 'Subtract' },
  { key: '1', label: '1', kind: 'num', aria: '1' },
  { key: '2', label: '2', kind: 'num', aria: '2' },
  { key: '3', label: '3', kind: 'num', aria: '3' },
  { key: '+', label: '+', kind: 'op', aria: 'Add' },
  { key: '±', label: '+/-', kind: 'fn', aria: 'Toggle positive or negative' },
  { key: '0', label: '0', kind: 'num', aria: '0' },
  { key: '.', label: '.', kind: 'num', aria: 'Decimal point' },
  { key: '=', label: '=', kind: 'eq', aria: 'Equals' },
];

interface CalculatorButtonsProps {
  onPress: (key: Key) => void;
}

export function CalculatorButtons({ onPress }: CalculatorButtonsProps) {
  return (
    // Preventing mousedown keeps focus where it was, so Enter/Backspace keep working after a click.
    <div className="keypad" onMouseDown={(e) => e.preventDefault()}>
      {KEYS.map(({ key, label, kind, aria }) => (
        <button
          key={key}
          type="button"
          className={`key key--${kind}`}
          aria-label={aria}
          onClick={() => onPress(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
