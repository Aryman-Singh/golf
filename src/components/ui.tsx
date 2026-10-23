import { Loader2, type LucideIcon } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} size={20} />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="text-brand-400" />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-ink-900/40 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-ink-400">
        <Icon size={26} />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink-100">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'brand',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: 'brand' | 'gold' | 'ink';
}) {
  const tones: Record<string, string> = {
    brand: 'text-brand-300 bg-brand-500/10',
    gold: 'text-gold-400 bg-gold-500/10',
    ink: 'text-ink-300 bg-white/5',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-400">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[accent]}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-ink-50">{value}</p>
    </div>
  );
}

export function Toast({ message, tone = 'good' }: { message: string; tone?: 'good' | 'bad' | 'warn' }) {
  const tones: Record<string, string> = {
    good: 'bg-brand-500/15 text-brand-200 border-brand-500/30',
    bad: 'bg-red-500/15 text-red-200 border-red-500/30',
    warn: 'bg-gold-500/15 text-gold-300 border-gold-500/30',
  };
  return (
    <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-5 py-3 text-sm font-medium shadow-xl animate-fade-up ${tones[tone]}`}>
      {message}
    </div>
  );
}
