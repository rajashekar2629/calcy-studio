import { RotateCcw } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  MAX_DISPLAY_YEAR,
  MIN_DISPLAY_YEAR,
  calculateAge,
  emptyDateTime,
  formatAgeSummary,
  type AgeResult,
} from '../../calculations/age';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import { DateSelector } from '../../components/DateSelector/DateSelector';
import { ErrorList } from '../../components/ErrorList/ErrorList';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { ResultCard, ResultRow, ResultRows, Stat, StatGrid } from '../../components/ResultCard/ResultCard';
import { useOutcome } from '../../hooks/useOutcome';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { DateTimeFields } from '../../types';
import { formatInteger } from '../../utils/format';

export function AgeCalculator() {
  usePageTitle('Age Calculator');
  // Both dates start empty on purpose: nothing is pre-filled with today's date.
  const [from, setFrom] = useState<DateTimeFields>(emptyDateTime);
  const [to, setTo] = useState<DateTimeFields>(emptyDateTime);
  const { outcome, submit, invalidate, resultsRef } = useOutcome<AgeResult>();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(() => calculateAge(from, to));
  };

  const reset = () => {
    setFrom(emptyDateTime());
    setTo(emptyDateTime());
    invalidate();
  };

  return (
    <div className="page">
      <PageHeader
        title="Age Calculator"
        subtitle="The exact time between two dates, from 10,000 BCE to 10,000 CE, down to the second."
      />

      <form className="card form" onSubmit={onSubmit} noValidate>
        <DateSelector
          idPrefix="age-from"
          legend="From date"
          value={from}
          onChange={(next) => {
            setFrom(next);
            invalidate();
          }}
          minYear={MIN_DISPLAY_YEAR}
          maxYear={MAX_DISPLAY_YEAR}
          withEra
          withTime
        />
        <DateSelector
          idPrefix="age-to"
          legend="Up to date"
          value={to}
          onChange={(next) => {
            setTo(next);
            invalidate();
          }}
          minYear={MIN_DISPLAY_YEAR}
          maxYear={MAX_DISPLAY_YEAR}
          withEra
          withTime
        />

        <p className="note">
          Dates use the proleptic Gregorian calendar extended backwards by the same rules. For years before 1582 this
          is a mathematical calculation, not a reconstruction of the calendars people actually used. There is no year
          0: 1 BCE is followed directly by 1 CE. Times are plain clock values with no time zones or daylight saving.
        </p>

        <div className="form-actions">
          <button type="submit" className="btn btn--primary">
            Calculate
          </button>
          <button type="button" className="btn btn--secondary" onClick={reset}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
        </div>
      </form>

      {outcome && !outcome.ok && <ErrorList errors={outcome.errors} />}
      {outcome?.ok && (
        <div className="results" ref={resultsRef}>
          <AgeResults result={outcome.value} />
        </div>
      )}
    </div>
  );
}

function AgeResults({ result: r }: { result: AgeResult }) {
  return (
    <>
      <div className="results__toolbar">
        <CopyButton text={formatAgeSummary(r)} label="Copy result" />
      </div>

      <ResultCard title="Period">
        <ResultRows>
          <ResultRow label="From" value={r.fromLabel} />
          <ResultRow label="Up to" value={r.toLabel} />
        </ResultRows>
      </ResultCard>

      <ResultCard title="Calendar duration">
        <StatGrid>
          <Stat label="Years" value={formatInteger(r.years)} />
          <Stat label="Months" value={r.months} />
          <Stat label="Days" value={r.days} />
        </StatGrid>
      </ResultCard>

      <ResultCard title="Time duration">
        <StatGrid>
          <Stat label="Hours" value={r.hours} />
          <Stat label="Minutes" value={r.minutes} />
          <Stat label="Seconds" value={r.seconds} />
        </StatGrid>
      </ResultCard>

      <ResultCard title="Total duration">
        <ResultRows>
          <ResultRow label="Total elapsed days" value={formatInteger(r.totalDays)} />
          <ResultRow label="Total elapsed hours" value={formatInteger(r.totalHours)} />
          <ResultRow label="Total elapsed minutes" value={formatInteger(r.totalMinutes)} />
          <ResultRow label="Total elapsed seconds" value={formatInteger(r.totalSeconds)} />
        </ResultRows>
      </ResultCard>
    </>
  );
}
