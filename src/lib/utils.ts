export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function scoreDiff(score: number, par: number): { label: string; tone: 'good' | 'ok' | 'bad' } {
  const diff = score - par;
  if (diff < 0) return { label: `${diff}`, tone: 'good' };
  if (diff === 0) return { label: 'E', tone: 'ok' };
  return { label: `+${diff}`, tone: 'bad' };
}

export function randomDrawNumbers(min = 1, max = 49, count = 5): number[] {
  const set = new Set<number>();
  while (set.size < count) {
    set.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(set).sort((a, b) => a - b);
}
