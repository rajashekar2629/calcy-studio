/**
 * Safe arithmetic expression evaluator. No eval(), no Function().
 *
 * Grammar (standard precedence, left associative):
 *   expression := term (('+' | '-') term)*
 *   term       := unary (('×' | '÷' | '*' | '/') unary)*
 *   unary      := ('-' | '+') unary | postfix
 *   postfix    := number '%'*            // '%' divides by 100:  50% = 0.5,  200+10% = 200.1
 */
import { formatPlain, normalizeSignificant } from '../../utils/format';

export type EvalResult = { ok: true; value: number } | { ok: false; error: string };

type Token =
  | { type: 'num'; value: number }
  | { type: 'op'; value: '+' | '-' | '*' | '/' }
  | { type: 'pct' };

const NUMBER_AT_START = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;

class ParseError extends Error {}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === ' ') {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      const match = NUMBER_AT_START.exec(input.slice(i));
      if (!match) throw new ParseError('Invalid number');
      const next = input[i + match[0].length];
      if (next !== undefined && /[0-9.]/.test(next)) throw new ParseError('Invalid number');
      tokens.push({ type: 'num', value: Number(match[0]) });
      i += match[0].length;
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '−') {
      tokens.push({ type: 'op', value: ch === '+' ? '+' : '-' });
    } else if (ch === '×' || ch === '*') {
      tokens.push({ type: 'op', value: '*' });
    } else if (ch === '÷' || ch === '/') {
      tokens.push({ type: 'op', value: '/' });
    } else if (ch === '%') {
      tokens.push({ type: 'pct' });
    } else {
      throw new ParseError('Invalid character');
    }
    i++;
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  parse(): number {
    if (this.tokens.length === 0) throw new ParseError('Empty expression');
    const value = this.expression();
    if (this.pos < this.tokens.length) throw new ParseError('Invalid expression');
    return value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private expression(): number {
    let left = this.term();
    for (;;) {
      const t = this.peek();
      if (t?.type === 'op' && (t.value === '+' || t.value === '-')) {
        this.pos++;
        const right = this.term();
        left = t.value === '+' ? left + right : left - right;
      } else return left;
    }
  }

  private term(): number {
    let left = this.unary();
    for (;;) {
      const t = this.peek();
      if (t?.type === 'op' && (t.value === '*' || t.value === '/')) {
        this.pos++;
        const right = this.unary();
        if (t.value === '/') {
          if (right === 0) throw new ParseError('Cannot divide by zero');
          left = left / right;
        } else {
          left = left * right;
        }
      } else return left;
    }
  }

  private unary(): number {
    const t = this.peek();
    if (t?.type === 'op' && (t.value === '-' || t.value === '+')) {
      this.pos++;
      const inner = this.unary();
      return t.value === '-' ? -inner : inner;
    }
    return this.postfix();
  }

  private postfix(): number {
    const t = this.peek();
    if (t?.type !== 'num') throw new ParseError('Incomplete expression');
    this.pos++;
    let value = t.value;
    while (this.peek()?.type === 'pct') {
      this.pos++;
      value = value / 100;
    }
    return value;
  }
}

/** Evaluate an expression string. Result is normalized to 15 significant digits. */
export function evaluateExpression(expression: string): EvalResult {
  try {
    const raw = new Parser(tokenize(expression)).parse();
    if (!Number.isFinite(raw)) return { ok: false, error: 'Result is too large' };
    const value = normalizeSignificant(raw, 15);
    return { ok: true, value: value === 0 ? 0 : value }; // avoid "-0"
  } catch (e) {
    if (e instanceof ParseError) return { ok: false, error: e.message };
    throw e;
  }
}

/** Display text for a computed value (exponent notation for very large/small values). */
export function formatResult(value: number): string {
  return formatPlain(value);
}
