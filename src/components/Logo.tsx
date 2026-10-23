import { Flag } from 'lucide-react';
import { classNames } from '@/lib/utils';

export function Logo({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dim = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const text = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  return (
    <div className={classNames('flex items-center gap-2.5', className)}>
      <div className={`relative ${dim} rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30`}>
        <Flag size={size === 'sm' ? 18 : size === 'lg' ? 26 : 22} className="text-ink-950" strokeWidth={2.5} />
      </div>
      <span className={`font-display ${text} font-bold tracking-tight text-ink-50`}>
        Fair<span className="text-brand-400">way</span>
      </span>
    </div>
  );
}
