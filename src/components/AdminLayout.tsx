import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  ShieldCheck, Users, CreditCard, HeartHandshake, Gift, Trophy, BarChart3,
  LogOut, Menu, X, Home, LayoutDashboard,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth';
import { navigate, useRoute } from '@/lib/router';
import { classNames } from '@/lib/utils';

const nav = [
  { label: 'Analytics', path: '/admin', icon: BarChart3 },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
  { label: 'Charities', path: '/admin/charities', icon: HeartHandshake },
  { label: 'Draws', path: '/admin/draws', icon: Gift },
  { label: 'Winners', path: '/admin/winners', icon: Trophy },
];

export function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const { profile, signOut } = useAuth();
  const route = useRoute();
  const [open, setOpen] = useState(false);

  if (profile && profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950 p-6">
        <div className="card p-10 text-center max-w-md">
          <ShieldCheck size={32} className="mx-auto text-gold-400" />
          <h1 className="mt-4 font-display text-xl font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-ink-400">Your account doesn't have admin privileges.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-6 btn-primary">Back to dashboard</button>
        </div>
      </div>
    );
  }

  const isActive = (p: string) => (p === '/admin' ? route.path === '/admin' : route.path.startsWith(p));

  const go = (p: string) => { setOpen(false); navigate(p); };

  return (
    <div className="min-h-screen flex bg-ink-950">
      <aside className={classNames(
        'fixed lg:sticky top-0 z-50 h-screen w-64 shrink-0 border-r border-white/5 bg-ink-900/60 backdrop-blur transition-transform lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/5">
          <button onClick={() => go('/')}><Logo size="sm" /></button>
          <button className="lg:hidden text-ink-400" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <div className="px-3 pt-3">
          <span className="badge-warn mx-3.5 mb-2"><ShieldCheck size={12} /> Admin</span>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((n) => (
            <button key={n.path} onClick={() => go(n.path)} className={classNames(
              'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
              isActive(n.path) ? 'bg-gold-500/10 text-gold-300' : 'text-ink-300 hover:bg-white/5 hover:text-ink-100'
            )}>
              <n.icon size={18} /> {n.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/5 space-y-1">
          <button onClick={() => go('/dashboard')} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-400 hover:bg-white/5 hover:text-ink-100"><LayoutDashboard size={18} /> User dashboard</button>
          <button onClick={() => go('/')} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-400 hover:bg-white/5 hover:text-ink-100"><Home size={18} /> Public site</button>
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-400 hover:bg-white/5 hover:text-ink-100"><LogOut size={18} /> Sign out</button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-ink-950/80 px-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-ink-300" onClick={() => setOpen(true)}><Menu size={22} /></button>
            <h1 className="font-display text-lg font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-warn"><ShieldCheck size={12} /> Admin</span>
            <span className="text-sm text-ink-300 hidden sm:block">{profile?.display_name}</span>
          </div>
        </header>
        <div className="p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
