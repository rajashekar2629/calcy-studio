import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Five-in-One Calculator`;
  }, [title]);
}
