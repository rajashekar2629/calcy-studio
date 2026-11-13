/**
 * Calculator session state machine (pure). The UI hook only feeds it key presses.
 * Completed calculations are returned so the caller can store them in history.
 */
import {
  appendDecimal,
  appendDigit,
  appendOperator,
  appendPercent,
  deleteLast,
  insertValue,
  toggleSign,
  type Operator,
} from './editor';
import { evaluateExpression, formatResult } from './parser';

export interface CalculatorState {
  expression: string;
  /** Live preview while typing; final value after "=". Empty when nothing to show. */
  result: string;
  error: string | null;
  /** True right after "=": the next digit starts a new calculation. */
  justEvaluated: boolean;
}

export const INITIAL_STATE: CalculatorState = {
  expression: '',
  result: '',
  error: null,
  justEvaluated: false,
};

export interface Completed {
  expression: string;
  result: string;
}

export interface PressOutcome {
  state: CalculatorState;
  completed?: Completed;
}

export type Key =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '.' | '+' | '-' | '×' | '÷' | '%' | '=' | 'AC' | 'DEL' | '±';

const OPERATOR_KEYS: readonly string[] = ['+', '-', '×', '÷'];

function withPreview(expression: string): CalculatorState {
  const parsed = expression === '' ? null : evaluateExpression(expression);
  const showPreview = parsed?.ok === true && /[+\-×÷%]/.test(expression.replace(/^-/, ''));
  return {
    expression,
    result: showPreview && parsed?.ok ? formatResult(parsed.value) : '',
    error: null,
    justEvaluated: false,
  };
}

export function press(state: CalculatorState, key: Key): PressOutcome {
  if (key === 'AC') return { state: INITIAL_STATE };

  // After "=" or an error, edits continue from the result (or restart for digits).
  const base = state.error ? '' : state.justEvaluated ? state.result : state.expression;
  const continuing = state.justEvaluated && !state.error;

  if (key === '=') {
    if (state.error || state.justEvaluated || state.expression === '') return { state };
    const parsed = evaluateExpression(state.expression);
    if (!parsed.ok) return { state: { ...state, result: '', error: parsed.error } };
    const result = formatResult(parsed.value);
    return {
      state: { expression: state.expression, result, error: null, justEvaluated: true },
      completed: { expression: state.expression, result },
    };
  }

  if (key === 'DEL') {
    if (state.error) return { state: INITIAL_STATE };
    return { state: withPreview(deleteLast(base)) };
  }

  if (key === '±') return { state: withPreview(toggleSign(base)) };

  if (key === '.') return { state: withPreview(appendDecimal(continuing ? '' : base)) };

  if (key === '%') return { state: withPreview(appendPercent(base)) };

  if (OPERATOR_KEYS.includes(key)) {
    return { state: withPreview(appendOperator(base, key as Operator)) };
  }

  // Digits: start fresh after "=" or an error.
  return { state: withPreview(appendDigit(continuing ? '' : base, key)) };
}

/** Load a history expression into the editor for reuse. */
export function loadExpression(expression: string): CalculatorState {
  return withPreview(expression);
}

/** Insert a history result into the current expression. */
export function insertResult(state: CalculatorState, value: string): CalculatorState {
  const base = state.error || state.justEvaluated ? '' : state.expression;
  return withPreview(insertValue(base, value));
}
