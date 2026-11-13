import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Completed } from '../calculations/basic';
import type { HistoryEntry } from '../types';

/** Oldest entries are dropped beyond this many, so the list cannot grow without bound. */
export const MAX_HISTORY_ENTRIES = 100;

interface HistoryApi {
  /** Newest first. */
  entries: HistoryEntry[];
  addEntry: (completed: Completed) => void;
  clear: () => void;
}

const HistoryContext = createContext<HistoryApi | null>(null);

/**
 * Calculation history lives in React state only. It is mounted above the router, so it survives
 * switching between calculator pages, and it is gone after a full page reload.
 * Nothing is written to localStorage, sessionStorage, IndexedDB or any other store.
 */
export function HistoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const nextId = useRef(1);

  const addEntry = useCallback((completed: Completed) => {
    const id = nextId.current++; // allocated outside the updater so StrictMode's double call is harmless
    setEntries((prev) => [{ id, ...completed }, ...prev].slice(0, MAX_HISTORY_ENTRIES));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  const value = useMemo(() => ({ entries, addEntry, clear }), [entries, addEntry, clear]);
  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryApi {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used inside <HistoryProvider>');
  return ctx;
}
