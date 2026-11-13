import { useCallback, useEffect, useRef, useState } from 'react';
import type { Result } from '../types';

/**
 * Holds the outcome of the last "Calculate" click for a form page.
 * Editing any input calls invalidate(), so a stale result is never shown next to changed inputs.
 * `resultsRef` should be attached to the results container; it is scrolled into view on a new outcome.
 */
export function useOutcome<T>() {
  const [outcome, setOutcome] = useState<Result<T> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const submit = useCallback((compute: () => Result<T>) => setOutcome(compute()), []);
  const invalidate = useCallback(() => setOutcome(null), []);

  useEffect(() => {
    if (outcome) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [outcome]);

  return { outcome, submit, invalidate, resultsRef };
}
