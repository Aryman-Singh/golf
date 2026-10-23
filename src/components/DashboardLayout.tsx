import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  LayoutDashboard, Target, HeartHandshake, Trophy, CreditCard, Gift,
  LogOut, Menu, X, ShieldCheck, Home,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth';
import { navigate, useRoute } from '@/lib/router';
import { classNames } from '@/lib/utils';

const nav = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Golf Scores', path: '/dashboard/scores', icon: Target },
  { label: 'Charity', path: '/dashboard/charity', icon: HeartHandshake },
  { label: 'Subscription', path: '/dashboard/subscription', icon: CreditCard },
  { label: 'Prize Draw', path: '/dashboard/draw', icon: Gift },
  { label: 'My Winnings', path: '/dashboard/winnings', icon: Trophy },
];

export function DashboardLayout({ children, title }: { children: ReactNode; title: string }) {
  const { profile, isAdmin, signOut } = useAuth();
  const route = useRoute();
  const [open, setOpen] = useState(false);

  const isActive = (p: string) => (p === '/dashboard' ? route.path === '/dashboard' : route.path.startsWith(p));

  const go = (p: string) => {
    setOpen(false);
    navigate(p);
  };

  return (
    <div className="min-h-screen flex bg-ink-950">
      {/* Sidebar */}
      <aside
        className={classNames(
          'fixed lg:sticky top-0 z-50 h-screen w-64 shrink-0 border-r border-white/5 bg-ink-900/60 backdrop-blur transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/5">
          <button onClick={() => go('/')}><Logo size="sm" /></button>
          <button className="lg:hidden text-ink-400" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((n) => (
            <button
              key={n.path}
              onClick={() => go(n.path)}
              className={classNames(
                'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
                isActive(n.path) ? 'bg-brand-500/10 text-brand-200' : 'text-ink-300 hover:bg-white/5 hover:text-ink-100'
              )}
            >
              <n.icon size={18} /> {n.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/5 space-y-1">
          <button onClick={() => go('/')} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-400 hover:bg-white/5 hover:text-ink-100">
            <Home size={18} /> Public site
          </button>
          {isAdmin && (
            <button onClick={() => go('/admin')} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-gold-400 hover:bg-white/5">
              <ShieldCheck size={18} /> Admin dashboard
            </button>
          )}
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-400 hover:bg-white/5 hover:text-ink-100">
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-ink-950/80 px-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-ink-300" onClick={() => setOpen(true)}><Menu size={22} /></button>
            <h1 className="font-display text-lg font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-ink-200">{profile?.display_name}</p>
              <p className="text-xs text-ink-500">{profile?.email}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/15 text-brand-300 font-semibold text-sm">
              {(profile?.display_name ?? '?').slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
