import { RotateCcw } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  MAX_YEAR,
  MIN_YEAR,
  buildExactLines,
  buildExplanation,
  calculateInterest,
  formatInterestSummary,
  formatMoneyPrecise,
  formatTotalMonths,
  type InterestResult,
} from '../../calculations/interest';
import { emptyDateTime } from '../../calculations/age';
import { CopyButton } from '../../components/CopyButton/CopyButton';
import { DateSelector } from '../../components/DateSelector/DateSelector';
import { ErrorList } from '../../components/ErrorList/ErrorList';
import { InputField } from '../../components/InputField/InputField';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { ResultCard, ResultRow, ResultRows, Stat } from '../../components/ResultCard/ResultCard';
import { useOutcome } from '../../hooks/useOutcome';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { DateTimeFields } from '../../types';
import { formatInteger, formatMoney } from '../../utils/format';

interface FormState {
  principal: string;
  rate: string;
  from: DateTimeFields;
  to: DateTimeFields;
}

const initialForm = (): FormState => ({ principal: '', rate: '', from: emptyDateTime(), to: emptyDateTime() });

export function InterestCalculator() {
  usePageTitle('Interest Calculator');
  const [form, setForm] = useState<FormState>(initialForm);
  const { outcome, submit, invalidate, resultsRef } = useOutcome<InterestResult>();

  const edit = (patch: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...patch }));
    invalidate();
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(() => calculateInterest(form));
  };

  const reset = () => {
    setForm(initialForm());
    invalidate();
  };

  return (
    <div className="page">
      <PageHeader
        title="Interest Calculator"
        subtitle="Simple interest the traditional way: a rate per ₹100 per month, with 30 days to a month."
      />

      <form className="card form" onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          <InputField
            id="principal"
            label="Principal amount"
            value={form.principal}
            onChange={(principal) => edit({ principal })}
            prefix="₹"
            placeholder="10000"
          />
          <InputField
            id="rate"
            label="Interest per ₹100 per month"
            value={form.rate}
            onChange={(rate) => edit({ rate })}
            prefix="₹"
            suffix="per ₹100 / month"
            placeholder="2"
            hint="Example: 2 means ₹2 interest on every ₹100, every month."
          />
        </div>

        <DateSelector
          idPrefix="interest-from"
          legend="From date"
          value={form.from}
          onChange={(from) => edit({ from })}
          minYear={MIN_YEAR}
          maxYear={MAX_YEAR}
        />
        <DateSelector
          idPrefix="interest-to"
          legend="Up to date"
          value={form.to}
          onChange={(to) => edit({ to })}
          minYear={MIN_YEAR}
          maxYear={MAX_YEAR}
        />

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
          <InterestResults result={outcome.value} />
        </div>
      )}
    </div>
  );
}

function InterestResults({ result: r }: { result: InterestResult }) {
  const d = r.duration;
  const [showExact, setShowExact] = useState(false);
  return (
    <>
      <div className="results__toolbar">
        <CopyButton text={formatInterestSummary(r, showExact)} label="Copy results" />
      </div>

      <ResultCard title="Total duration">
        <div className="stats stats--three">
          <Stat label="Years" value={d.years} />
          <Stat label="Months" value={d.months} />
          <Stat label="Days" value={d.days} />
        </div>
        <ResultRows>
          <ResultRow label="Total months" value={formatTotalMonths(d)} />
          <ResultRow label="Total days (first date to last date)" value={formatInteger(d.totalDays)} />
        </ResultRows>
      </ResultCard>

      <ResultCard title="Interest breakdown">
        <ResultRows>
          <ResultRow label="Original principal" value={formatMoney(r.principal)} />
          <ResultRow label="Interest per year" value={formatMoney(r.yearlyInterest)} />
          <ResultRow label="Interest per month" value={formatMoney(r.monthlyInterest)} />
          <ResultRow label="Interest per day" value={formatMoneyPrecise(r.dailyInterest)} />
          <ResultRow label="Total accumulated interest" value={formatMoney(r.totalInterest)} />
        </ResultRows>
      </ResultCard>

      <ResultCard title="Final amount">
        <div className="final-grid">
          <div className="final-tile">
            <div className="final-tile__label">Principal amount</div>
            <div className="final-tile__value">{formatMoney(r.principal)}</div>
          </div>
          <div className="final-tile">
            <div className="final-tile__label">Total interest</div>
            <div className="final-tile__value">{formatMoney(r.totalInterest)}</div>
          </div>
          <div className="final-tile final-tile--primary">
            <div className="final-tile__label">Final amount including interest</div>
            <div className="final-tile__value">{formatMoney(r.finalAmount)}</div>
          </div>
        </div>
      </ResultCard>

      <ResultCard title="Calculation explanation">
        <ul className="explain">
          {buildExplanation(r).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="note">Amounts are calculated at full precision and rounded only for display.</p>
        <button
          type="button"
          className="link-button"
          aria-expanded={showExact}
          aria-controls="exact-calculation"
          onClick={() => setShowExact((open) => !open)}
        >
          {showExact ? 'Hide exact calculation' : 'Show exact calculation'}
        </button>
      </ResultCard>

      {showExact && (
        <div id="exact-calculation">
          <ResultCard title="Exact calculation (real days)">
            <p className="note">
              Counts every real day from the first date to the last date. Each day earns the same daily interest,
              so a 31-day month earns more than a 30-day month, and February less. Months of 28 or 29 days are
              February months.
            </p>
            <ul className="explain">
              {buildExactLines(r).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </ResultCard>
        </div>
      )}
    </>
  );
}
