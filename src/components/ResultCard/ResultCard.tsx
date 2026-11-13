import type { ReactNode } from 'react';

interface ResultCardProps {
  title: string;
  children: ReactNode;
  variant?: 'default' | 'primary';
}

export function ResultCard({ title, children, variant = 'default' }: ResultCardProps) {
  return (
    <section className={`result-card${variant === 'primary' ? ' result-card--primary' : ''}`}>
      <h2 className="result-card__title">{title}</h2>
      {children}
    </section>
  );
}

/** A label / value list. Pass ResultRow children. */
export function ResultRows({ children }: { children: ReactNode }) {
  return <dl className="rows">{children}</dl>;
}

export function ResultRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** Large number tile used for durations. */
export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="stat">
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="stats">{children}</div>;
}
