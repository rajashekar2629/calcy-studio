import type { Key } from './session';

/**
 * Map a KeyboardEvent.key value to a calculator key, or null when the key is not handled.
 * Backspace and Delete both remove the last character; Escape (or C) clears everything.
 */
export function keyboardToKey(eventKey: string): Key | null {
  if (/^[0-9]$/.test(eventKey)) return eventKey as Key;
  switch (eventKey) {
    case '.':
    case ',':
      return '.';
    case '+':
      return '+';
    case '-':
    case '−':
      return '-';
    case '*':
    case 'x':
    case 'X':
    case '×':
      return '×';
    case '/':
    case '÷':
      return '÷';
    case '%':
      return '%';
    case 'Enter':
    case '=':
      return '=';
    case 'Backspace':
    case 'Delete':
      return 'DEL';
    case 'Escape':
    case 'c':
    case 'C':
      return 'AC';
    default:
      return null;
  }
}
