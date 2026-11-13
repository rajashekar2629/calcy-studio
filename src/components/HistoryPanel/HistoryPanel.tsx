import { History, Trash2 } from 'lucide-react';
import type { HistoryEntry } from '../../types';

interface HistoryPanelProps {
  /** Newest first. */
  entries: HistoryEntry[];
  /** Load a previous expression into the calculator. */
  onReuse: (expression: string) => void;
  /** Insert a previous result into the current expression. */
  onUseResult: (result: string) => void;
  onClear: () => void;
}

export function HistoryPanel({ entries, onReuse, onUseResult, onClear }: HistoryPanelProps) {
  return (
    <section className="history" aria-labelledby="history-title">
      <header className="history__header">
        <h2 id="history-title" className="history__title">
          <History size={16} aria-hidden="true" />
          History
        </h2>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClear} disabled={entries.length === 0}>
          <Trash2 size={14} aria-hidden="true" />
          Clear
        </button>
      </header>

      {entries.length === 0 ? (
        <p className="history__empty">Completed calculations appear here. History is cleared when the page is reloaded.</p>
      ) : (
        <ul className="history__list">
          {entries.map((entry) => (
            <li key={entry.id} className="history__item">
              <div className="history__expression" tabIndex={0}>
                {entry.expression}
              </div>
              <div className="history__result" tabIndex={0}>
                = {entry.result}
              </div>
              <div className="history__actions">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => onReuse(entry.expression)}
                  aria-label={`Reuse expression ${entry.expression}`}
                >
                  Reuse expression
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => onUseResult(entry.result)}
                  aria-label={`Use result ${entry.result}`}
                >
                  Use result
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
