import { useEffect } from 'react';

export function usePage(title: string) {
  useEffect(() => {
    document.title = `${title} · Fairway`;
  }, [title]);
}
