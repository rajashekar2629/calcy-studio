import { useCallback, useEffect, useRef, useState } from 'react';
import {
  INITIAL_STATE,
  insertResult,
  keyboardToKey,
  loadExpression,
  press,
  type CalculatorState,
  type Key,
} from '../calculations/basic';
import { useHistory } from './useHistory';

/** Elements where typing must never be hijacked by the calculator. */
function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest('input, select, textarea') !== null;
}

/** Enter on a focused link or button outside the keypad should activate that control instead. */
function isOtherActivatable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest('a, button') !== null && target.closest('.keypad') === null;
}

/**
 * Connects the pure calculator state machine to React: button presses, keyboard input and history.
 * A ref mirrors the latest state so rapid key events never read a stale value.
 */
export function useCalculator() {
  const { addEntry } = useHistory();
  const [state, setState] = useState<CalculatorState>(INITIAL_STATE);
  const stateRef = useRef(state);

  const commit = useCallback((next: CalculatorState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const pressKey = useCallback(
    (key: Key) => {
      const outcome = press(stateRef.current, key);
      commit(outcome.state);
      if (outcome.completed) addEntry(outcome.completed);
    },
    [addEntry, commit],
  );

  const reuseExpression = useCallback((expression: string) => commit(loadExpression(expression)), [commit]);

  const insertHistoryResult = useCallback(
    (value: string) => commit(insertResult(stateRef.current, value)),
    [commit],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      if (isTextEntry(event.target)) return;
      if (event.key === 'Enter' && isOtherActivatable(event.target)) return;
      const key = keyboardToKey(event.key);
      if (key === null) return;
      event.preventDefault(); // also stops Backspace navigation and Firefox's "/" quick find
      pressKey(key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pressKey]);

  return { state, pressKey, reuseExpression, insertHistoryResult };
}
