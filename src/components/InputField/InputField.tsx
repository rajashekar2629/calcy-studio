import type { ReactNode } from 'react';

interface FieldBaseProps {
  id: string;
  label: string;
  hint?: string;
  /** Inline validation message. Shown in addition to the hint. */
  error?: string | null;
}

function describedBy(id: string, hint?: string, error?: string | null): string | undefined {
  const ids = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

function FieldMessages({ id, hint, error }: Pick<FieldBaseProps, 'id' | 'hint' | 'error'>) {
  return (
    <>
      {hint && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error" aria-live="polite">
          {error}
        </p>
      )}
    </>
  );
}

interface InputFieldProps extends FieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  inputMode?: 'decimal' | 'numeric' | 'text';
  placeholder?: string;
  /** Text shown inside the field before the value, e.g. a currency symbol. */
  prefix?: string;
  /** Text shown inside the field after the value, e.g. "%". */
  suffix?: string;
  maxLength?: number;
  readOnly?: boolean;
}

/**
 * Text input (not type="number": values stay exact strings, there is no scroll-wheel editing, and
 * validation is explicit). inputMode brings up the numeric keyboard on phones.
 */
export function InputField({
  id,
  label,
  hint,
  error,
  value,
  onChange,
  inputMode = 'decimal',
  placeholder,
  prefix,
  suffix,
  maxLength,
  readOnly = false,
}: InputFieldProps) {
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className={`field__control${readOnly ? ' field__control--readonly' : ''}`}>
        {prefix && (
          <span className="field__affix" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={id}
          className="field__input"
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          readOnly={readOnly}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
        />
        {suffix && (
          <span className="field__affix" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

interface SelectFieldProps extends FieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

export function SelectField({ id, label, hint, error, value, onChange, children }: SelectFieldProps) {
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="field__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      >
        {children}
      </select>
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}
