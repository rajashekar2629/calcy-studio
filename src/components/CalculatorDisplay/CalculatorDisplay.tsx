import { useLayoutEffect, useRef } from 'react';

interface CalculatorDisplayProps {
  expression: string;
  /** Live preview while typing, or the final value after "=". */
  result: string;
  error: string | null;
  /** True right after "=": the result is final rather than a preview. */
  final: boolean;
}

/** Step the font size down as the text gets longer; the box still scrolls if it ever overflows. */
export function resultSizeClass(text: string): string {
  const n = text.length;
  if (n <= 10) return 'display__result--xl';
  if (n <= 14) return 'display__result--lg';
  if (n <= 19) return 'display__result--md';
  return 'display__result--sm';
}

export function CalculatorDisplay({ expression, result, error, final }: CalculatorDisplayProps) {
  const expressionRef = useRef<HTMLDivElement>(null);

  // Keep the newest part of a long expression in view.
  useLayoutEffect(() => {
    const el = expressionRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [expression]);

  const main = error ?? (result !== '' ? result : expression === '' ? '0' : '');
  const classes = [
    'display__result',
    resultSizeClass(main),
    error ? 'is-error' : final ? 'is-final' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="display">
      <div
        ref={expressionRef}
        className="display__expression"
        role="textbox"
        aria-readonly="true"
        aria-label="Expression"
        tabIndex={0}
      >
        {expression}
      </div>
      <div className={classes} role={error ? 'alert' : 'status'} aria-label="Result" tabIndex={0}>
        {main}
      </div>
    </div>
  );
}
