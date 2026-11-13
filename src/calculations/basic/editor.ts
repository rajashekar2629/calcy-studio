/**
 * Pure expression-editing rules for the calculator keypad.
 * Every function takes the current expression string and returns the next one.
 * Invalid edits (double decimals, leading operators, "5%3", ...) return the input unchanged.
 */

export const OPERATORS = ['+', '-', '×', '÷'] as const;
export type Operator = (typeof OPERATORS)[number];

const isOperatorChar = (ch: string | undefined): boolean => ch !== undefined && '+-×÷'.includes(ch);
const isDigit = (ch: string | undefined): boolean => ch !== undefined && ch >= '0' && ch <= '9';

const TRAILING_NUMBER = /(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?%*$/i;

/** The number (with any % suffixes) at the end of the expression, if there is one. */
export function trailingNumber(expr: string): { start: number; text: string } | null {
  const match = TRAILING_NUMBER.exec(expr);
  return match ? { start: match.index, text: match[0] } : null;
}

export function appendDigit(expr: string, digit: string): string {
  const num = trailingNumber(expr);
  if (num) {
    if (num.text.endsWith('%')) return expr;
    if (num.text === '0') return expr.slice(0, num.start) + digit; // no leading zeros
  }
  return expr + digit;
}

export function appendDecimal(expr: string): string {
  const num = trailingNumber(expr);
  if (!num) return expr + '0.';
  if (num.text.endsWith('%') || num.text.includes('.') || /e/i.test(num.text)) return expr;
  return expr + '.';
}

export function appendOperator(expr: string, op: Operator): string {
  if (expr === '') return op === '-' ? '-' : expr;
  const last = expr[expr.length - 1];
  if (isOperatorChar(last)) {
    // Allow a negative sign after × or ÷ ("5×-3"); otherwise replace the trailing operator(s).
    if (op === '-' && (last === '×' || last === '÷')) return expr + op;
    let end = expr.length;
    while (end > 0 && isOperatorChar(expr[end - 1])) end--;
    if (end === 0) return op === '-' ? '-' : expr; // expression was only operators
    return expr.slice(0, end) + op;
  }
  return expr + op;
}

export function appendPercent(expr: string): string {
  const last = expr[expr.length - 1];
  return isDigit(last) || last === '%' ? expr + '%' : expr;
}

export function deleteLast(expr: string): string {
  return expr.slice(0, -1);
}

/** Flip the sign of the number at the end of the expression. */
export function toggleSign(expr: string): string {
  if (expr === '') return '-';
  const num = trailingNumber(expr);
  if (!num) return expr; // ends with an operator
  const before = expr[num.start - 1];
  if (num.start === 0) return '-' + expr;
  const beforeThat = expr[num.start - 2];
  if (before === '-') {
    const unary = num.start - 1 === 0 || beforeThat === '×' || beforeThat === '÷';
    return unary
      ? expr.slice(0, num.start - 1) + expr.slice(num.start) // "5×-3" -> "5×3"
      : expr.slice(0, num.start - 1) + '+' + expr.slice(num.start); // "5-3" -> "5+3"
  }
  if (before === '+') return expr.slice(0, num.start - 1) + '-' + expr.slice(num.start); // "5+3" -> "5-3"
  return expr.slice(0, num.start) + '-' + expr.slice(num.start); // after × or ÷
}

/** Insert a value (e.g. from history): after an operator, or replacing the number being typed. */
export function insertValue(expr: string, value: string): string {
  if (expr === '' || isOperatorChar(expr[expr.length - 1])) return expr + value;
  const num = trailingNumber(expr);
  return num ? expr.slice(0, num.start) + value : expr + value;
}
