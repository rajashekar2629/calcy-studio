import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyStatus = 'idle' | 'copied' | 'failed';

/** Older browsers and non-secure contexts have no async clipboard API. */
function legacyCopy(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}

export function useCopy(resetAfterMs = 2000) {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string) => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {
        ok = legacyCopy(text);
      }
      setStatus(ok ? 'copied' : 'failed');
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setStatus('idle'), resetAfterMs);
    },
    [resetAfterMs],
  );

  return { status, copy };
}
