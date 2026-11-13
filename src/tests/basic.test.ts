import { describe, expect, it } from 'vitest';
import {
  INITIAL_STATE,
  appendDecimal,
  appendDigit,
  appendOperator,
  appendPercent,
  deleteLast,
  evaluateExpression,
  formatResult,
  insertResult,
  insertValue,
  keyboardToKey,
  loadExpression,
  press,
  toggleSign,
  type CalculatorState,
  type Completed,
  type Key,
} from '../calculations/basic';

const val = (expr: string): number | string => {
  const r = evaluateExpression(expr);
  return r.ok ? r.value : r.error;
};

describe('basic calculator: arithmetic', () => {
  it('adds, subtracts, multiplies and divides', () => {
    expect(val('2+3')).toBe(5);
    expect(val('10-4')).toBe(6);
    expect(val('6×7')).toBe(42);
    expect(val('20÷4')).toBe(5);
    expect(val('7÷2')).toBe(3.5);
  });

  it('accepts ASCII * and / as well as × and ÷', () => {
    expect(val('6*7')).toBe(42);
    expect(val('20/4')).toBe(5);
  });

  it('handles decimals without floating-point noise', () => {
    expect(val('0.1+0.2')).toBe(0.3);
    expect(val('1.5×2')).toBe(3);
    expect(val('.5+.5')).toBe(1);
    expect(val('5.+1')).toBe(6);
    expect(val('0.1×3')).toBe(0.3);
    expect(val('1÷3×3')).toBe(1);
    expect(val('0.7+0.1')).toBe(0.8);
    expect(val('1.1×1.1')).toBe(1.21);
  });

  it('follows operator precedence', () => {
    expect(val('2+3×4')).toBe(14);
    expect(val('10-4÷2')).toBe(8);
    expect(val('2×3+4×5')).toBe(26);
    expect(val('100-5×4+10÷2')).toBe(85);
  });

  it('is left associative', () => {
    expect(val('100÷4÷5')).toBe(5);
    expect(val('10-3-2')).toBe(5);
    expect(val('2×3×4×5')).toBe(120);
  });

  it('evaluates long expressions', () => {
    expect(val('1+2+3+4+5+6+7+8+9+10')).toBe(55);
    expect(val('1+2×3-4÷2+5×6-7+8÷4×2')).toBe(32);
    expect(val('1000000×1000000')).toBe(1e12);
    const long = Array.from({ length: 200 }, () => '1').join('+');
    expect(val(long)).toBe(200);
  });

  it('handles negative numbers', () => {
    expect(val('-5+3')).toBe(-2);
    expect(val('5×-3')).toBe(-15);
    expect(val('5--3')).toBe(8);
    expect(val('-2×-3')).toBe(6);
    expect(val('0-0')).toBe(0);
    expect(Object.is(val('-0'), -0)).toBe(false); // never "-0"
  });

  it('treats % as divide-by-100', () => {
    expect(val('50%')).toBe(0.5);
    expect(val('200+10%')).toBe(200.1);
    expect(val('50%×200')).toBe(100);
    expect(val('1%%')).toBe(0.0001);
  });
});

describe('basic calculator: invalid expressions', () => {
  it('prevents division by zero', () => {
    expect(val('5÷0')).toBe('Cannot divide by zero');
    expect(val('5÷0.0')).toBe('Cannot divide by zero');
    expect(val('5÷0×2')).toBe('Cannot divide by zero');
    expect(val('5÷-0')).toBe('Cannot divide by zero');
    expect(val('0÷5')).toBe(0);
  });

  it('rejects malformed expressions', () => {
    for (const bad of ['', '5+', '×5', '5××3', '1.2.3', '5%5', '5 5', 'abc', '2^3', '(2+3)', '2+2;1', '.']) {
      const r = evaluateExpression(bad);
      expect(r.ok).toBe(false);
    }
  });

  it('never executes code (no eval)', () => {
    expect(evaluateExpression('alert(1)').ok).toBe(false);
    expect(evaluateExpression('process.exit()').ok).toBe(false);
    expect(evaluateExpression('constructor').ok).toBe(false);
  });

  it('reports overflow instead of Infinity', () => {
    const big = '1' + '0'.repeat(200);
    expect(val(`${big}×${big}`)).toBe('Result is too large');
  });
});

describe('basic calculator: formatting', () => {
  it('formats plain and exponent values', () => {
    expect(formatResult(123.45)).toBe('123.45');
    expect(formatResult(-7)).toBe('-7');
    expect(formatResult(0)).toBe('0');
    expect(formatResult(1e21)).toBe('1e+21');
    expect(formatResult(0.0000001)).toBe('1e-7');
  });
});

describe('basic calculator: editor rules', () => {
  it('appends digits without leading zeros', () => {
    expect(appendDigit('0', '5')).toBe('5');
    expect(appendDigit('', '0')).toBe('0');
    expect(appendDigit('0.', '5')).toBe('0.5');
    expect(appendDigit('5+0', '7')).toBe('5+7');
    expect(appendDigit('12', '3')).toBe('123');
    expect(appendDigit('5%', '3')).toBe('5%');
  });

  it('allows one decimal point per number', () => {
    expect(appendDecimal('')).toBe('0.');
    expect(appendDecimal('5+')).toBe('5+0.');
    expect(appendDecimal('1.5')).toBe('1.5');
    expect(appendDecimal('1.5+2')).toBe('1.5+2.');
    expect(appendDecimal('5%')).toBe('5%');
  });

  it('prevents invalid operator sequences', () => {
    expect(appendOperator('', '+')).toBe('');
    expect(appendOperator('', '×')).toBe('');
    expect(appendOperator('', '-')).toBe('-');
    expect(appendOperator('-', '+')).toBe('-');
    expect(appendOperator('5', '+')).toBe('5+');
    expect(appendOperator('5+', '×')).toBe('5×');
    expect(appendOperator('5×', '-')).toBe('5×-');
    expect(appendOperator('5+', '-')).toBe('5-');
    expect(appendOperator('5×-', '+')).toBe('5+');
  });

  it('only allows % after a digit or another %', () => {
    expect(appendPercent('5')).toBe('5%');
    expect(appendPercent('5%')).toBe('5%%');
    expect(appendPercent('5+')).toBe('5+');
    expect(appendPercent('')).toBe('');
  });

  it('deletes the last character', () => {
    expect(deleteLast('123')).toBe('12');
    expect(deleteLast('')).toBe('');
  });

  it('toggles the sign of the last number', () => {
    expect(toggleSign('')).toBe('-');
    expect(toggleSign('5')).toBe('-5');
    expect(toggleSign('-5')).toBe('5');
    expect(toggleSign('5+3')).toBe('5-3');
    expect(toggleSign('5-3')).toBe('5+3');
    expect(toggleSign('5×3')).toBe('5×-3');
    expect(toggleSign('5×-3')).toBe('5×3');
    expect(toggleSign('5+')).toBe('5+');
  });

  it('inserts history values', () => {
    expect(insertValue('', '7')).toBe('7');
    expect(insertValue('5+', '7')).toBe('5+7');
    expect(insertValue('5+3', '7')).toBe('5+7');
    expect(insertValue('12', '7')).toBe('7');
  });
});

describe('basic calculator: session', () => {
  function run(keys: Key[], start: CalculatorState = INITIAL_STATE) {
    let state = start;
    const completed: Completed[] = [];
    for (const key of keys) {
      const out = press(state, key);
      state = out.state;
      if (out.completed) completed.push(out.completed);
    }
    return { state, completed };
  }

  it('builds an expression with a live preview, then evaluates', () => {
    const typing = run(['1', '2', '+', '3']);
    expect(typing.state.expression).toBe('12+3');
    expect(typing.state.result).toBe('15');

    const done = run(['1', '2', '+', '3', '=']);
    expect(done.completed).toEqual([{ expression: '12+3', result: '15' }]);
    expect(done.state.justEvaluated).toBe(true);
    expect(done.state.result).toBe('15');
  });

  it('starts a new calculation when a digit follows "="', () => {
    const { state } = run(['2', '+', '2', '=', '7']);
    expect(state.expression).toBe('7');
    expect(state.justEvaluated).toBe(false);
  });

  it('continues from the result when an operator follows "="', () => {
    const { state } = run(['2', '+', '2', '=', '×', '3', '=']);
    expect(state.result).toBe('12');
  });

  it('shows an error for division by zero and records nothing', () => {
    const { state, completed } = run(['5', '÷', '0', '=']);
    expect(state.error).toBe('Cannot divide by zero');
    expect(completed).toHaveLength(0);
    expect(run(['7'], state).state.expression).toBe('7'); // recovers on next digit
  });

  it('AC clears everything and DEL removes one character', () => {
    expect(run(['1', '2', 'AC']).state).toEqual(INITIAL_STATE);
    expect(run(['1', '2', 'DEL']).state.expression).toBe('1');
  });

  it('+/- toggles the current number', () => {
    expect(run(['5', '±']).state.expression).toBe('-5');
    expect(run(['5', '±', '±']).state.expression).toBe('5');
  });

  it('ignores "=" on an empty or already-evaluated expression', () => {
    expect(run(['=']).completed).toHaveLength(0);
    expect(run(['1', '+', '1', '=', '=']).completed).toHaveLength(1);
  });

  it('reuses history expressions and results', () => {
    expect(loadExpression('2+3×4').result).toBe('14');
    expect(insertResult(run(['5', '+']).state, '14').expression).toBe('5+14');
    expect(insertResult(run(['1', '+', '1', '=']).state, '9').expression).toBe('9');
  });
});

describe('basic calculator: keyboard mapping', () => {
  it('maps digits, operators and the decimal point', () => {
    for (const d of '0123456789') expect(keyboardToKey(d)).toBe(d);
    expect(keyboardToKey('+')).toBe('+');
    expect(keyboardToKey('-')).toBe('-');
    expect(keyboardToKey('*')).toBe('×');
    expect(keyboardToKey('x')).toBe('×');
    expect(keyboardToKey('/')).toBe('÷');
    expect(keyboardToKey('%')).toBe('%');
    expect(keyboardToKey('.')).toBe('.');
    expect(keyboardToKey(',')).toBe('.');
  });

  it('maps Enter to equals, Backspace and Delete to DEL, Escape to AC', () => {
    expect(keyboardToKey('Enter')).toBe('=');
    expect(keyboardToKey('=')).toBe('=');
    expect(keyboardToKey('Backspace')).toBe('DEL');
    expect(keyboardToKey('Delete')).toBe('DEL');
    expect(keyboardToKey('Escape')).toBe('AC');
  });

  it('ignores unrelated keys', () => {
    for (const k of ['a', 'Tab', 'Shift', 'ArrowLeft', ' ', 'F5', '(', '10']) expect(keyboardToKey(k)).toBeNull();
  });
});

