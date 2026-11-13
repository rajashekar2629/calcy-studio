import { describeDateTime, getMaxDay, validateDateTime } from '../../calculations/age';
import type { DateTimeFields, Era } from '../../types';
import { MONTH_NAMES, validateYear } from '../../utils/calendar';
import { formatInteger } from '../../utils/format';
import { parseUnsignedInteger } from '../../utils/parse';
import { InputField, SelectField } from '../InputField/InputField';
import { SegmentedControl, type SegmentOption } from '../SegmentedControl/SegmentedControl';

const ERA_OPTIONS: readonly SegmentOption<Era>[] = [
  { value: 'CE', label: 'CE' },
  { value: 'BCE', label: 'BCE' },
];

const pad2 = (n: number): string => String(n).padStart(2, '0');
const range = (count: number, from = 0): number[] => Array.from({ length: count }, (_, i) => i + from);

interface DateSelectorProps {
  /** Unique prefix for element ids, e.g. "from". */
  idPrefix: string;
  /** Group name shown as the legend, e.g. "From date". */
  legend: string;
  value: DateTimeFields;
  onChange: (next: DateTimeFields) => void;
  minYear: number;
  maxYear: number;
  /** Show the CE / BCE toggle. Without it the year is always CE. */
  withEra?: boolean;
  /** Show hour, minute and second selectors. */
  withTime?: boolean;
}

/**
 * Year (typed), month and day (selects), with optional era and time of day.
 * Nothing is auto-filled and nothing is silently corrected: an invalid year or a day that does not
 * exist in the chosen month is flagged immediately and still blocks the calculation.
 */
export function DateSelector({
  idPrefix,
  legend,
  value,
  onChange,
  minYear,
  maxYear,
  withEra = false,
  withTime = false,
}: DateSelectorProps) {
  const set = (patch: Partial<DateTimeFields>) => onChange({ ...value, ...patch });

  const yearError = validateYear(value.year, minYear, maxYear);
  const monthNumber = parseUnsignedInteger(value.month);
  const dayNumber = parseUnsignedInteger(value.day);
  const maxDay = getMaxDay(value.year, value.era, value.month);
  const yearText = withEra ? `${value.year} ${value.era}` : value.year;
  const dayError =
    !yearError && monthNumber !== null && monthNumber >= 1 && monthNumber <= 12 && dayNumber !== null && dayNumber > maxDay
      ? `${MONTH_NAMES[monthNumber - 1]} ${yearText} has ${maxDay} days, so day ${dayNumber} is not valid.`
      : null;

  // The day list adapts to the month and year. A day that no longer exists stays visible (flagged)
  // instead of being cleared behind the user's back.
  const dayOptions = range(maxDay, 1);
  const staleDay = dayNumber !== null && dayNumber > maxDay ? dayNumber : null;

  const rangeHint = `${minYear}–${formatInteger(maxYear)}${withEra ? ` ${value.era}` : ''}`;
  const yearHint =
    withEra && value.era === 'BCE'
      ? `${rangeHint}. Larger numbers are further back in time.`
      : withEra
        ? `${rangeHint}. Larger numbers are later.`
        : rangeHint;

  const parsed = withEra ? validateDateTime(legend, value) : null;
  const compact = !withEra && !withTime;

  const monthSelect = (
    <SelectField id={`${idPrefix}-month`} label="Month" value={value.month} onChange={(month) => set({ month })}>
      <option value="">Month</option>
      {MONTH_NAMES.map((name, i) => (
        <option key={name} value={String(i + 1)}>
          {i + 1} – {name}
        </option>
      ))}
    </SelectField>
  );

  const daySelect = (
    <SelectField id={`${idPrefix}-day`} label="Day" value={value.day} onChange={(day) => set({ day })} error={dayError}>
      <option value="">Day</option>
      {dayOptions.map((d) => (
        <option key={d} value={String(d)}>
          {d}
        </option>
      ))}
      {staleDay !== null && <option value={String(staleDay)}>{staleDay} (not valid)</option>}
    </SelectField>
  );

  return (
    <fieldset className={`date${compact ? ' date--compact' : ''}`}>
      <legend className="date__legend">{legend}</legend>

      <div className="date__grid">
        <div className={compact ? 'date__row date__row--ymd' : 'date__row date__row--year'}>
          <InputField
            id={`${idPrefix}-year`}
            label="Year"
            value={value.year}
            onChange={(year) => set({ year })}
            inputMode="numeric"
            placeholder="Year"
            maxLength={6}
            hint={compact ? undefined : yearHint}
            error={yearError}
          />

          {withEra && (
            <div className="field date__era">
              <span className="field__label">Era</span>
              <SegmentedControl
                options={ERA_OPTIONS}
                value={value.era}
                onChange={(era) => set({ era })}
                label={`${legend} era`}
              />
            </div>
          )}

          {compact && (
            <>
              {monthSelect}
              {daySelect}
            </>
          )}
        </div>

        {!compact && (
          <div className="date__row date__row--md">
            {monthSelect}
            {daySelect}
          </div>
        )}

        {withTime && (
          <div className="date__row date__row--time">
            <SelectField id={`${idPrefix}-hour`} label="Hour" value={value.hour} onChange={(hour) => set({ hour })}>
              <option value="">00</option>
              {range(24).map((h) => (
                <option key={h} value={String(h)}>
                  {pad2(h)}
                </option>
              ))}
            </SelectField>
            <SelectField id={`${idPrefix}-minute`} label="Minute" value={value.minute} onChange={(minute) => set({ minute })}>
              <option value="">00</option>
              {range(60).map((m) => (
                <option key={m} value={String(m)}>
                  {pad2(m)}
                </option>
              ))}
            </SelectField>
            <SelectField id={`${idPrefix}-second`} label="Second" value={value.second} onChange={(second) => set({ second })}>
              <option value="">00</option>
              {range(60).map((s) => (
                <option key={s} value={String(s)}>
                  {pad2(s)}
                </option>
              ))}
            </SelectField>
          </div>
        )}
      </div>

      {withEra && (
        <p className="date__summary" aria-live="polite">
          {parsed?.ok ? `Selected: ${describeDateTime(parsed.value)}` : 'Time is optional; a blank hour, minute or second counts as 00.'}
        </p>
      )}
    </fieldset>
  );
}
