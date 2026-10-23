import { useState } from 'react';
import { Menu, X, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth';
import { navigate, useRoute } from '@/lib/router';
import { classNames } from '@/lib/utils';

const publicNav = [
  { label: 'Home', path: '/' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Charities', path: '/charities' },
  { label: 'Pricing', path: '/pricing' },
];

export function PublicHeader() {
  const { session, profile, isAdmin, signOut } = useAuth();
  const route = useRoute();
  const [open, setOpen] = useState(false);

  const isActive = (p: string) => (p === '/' ? route.path === '/' : route.path.startsWith(p));

  const go = (p: string) => {
    setOpen(false);
    navigate(p);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between">
        <button onClick={() => go('/')} className="flex items-center" aria-label="Fairway home">
          <Logo size="md" />
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {publicNav.map((n) => (
            <button
              key={n.path}
              onClick={() => go(n.path)}
              className={classNames(
                'rounded-lg px-3.5 py-2 text-sm font-medium transition',
                isActive(n.path) ? 'text-brand-300 bg-white/5' : 'text-ink-300 hover:text-ink-100 hover:bg-white/5'
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {session ? (
            <>
              <button onClick={() => go('/dashboard')} className="btn-ghost">
                <LayoutDashboard size={16} /> Dashboard
              </button>
              {isAdmin && (
                <button onClick={() => go('/admin')} className="btn-outline">
                  <ShieldCheck size={16} /> Admin
                </button>
              )}
              <button onClick={signOut} className="btn-outline">
                <LogOut size={16} /> Sign out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => go('/login')} className="btn-ghost">Sign in</button>
              <button onClick={() => go('/signup')} className="btn-primary">Get started</button>
            </>
          )}
        </div>

        <button
          className="md:hidden rounded-lg p-2 text-ink-200 hover:bg-white/5"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-ink-950/95 px-5 py-4 space-y-1">
          {publicNav.map((n) => (
            <button
              key={n.path}
              onClick={() => go(n.path)}
              className={classNames(
                'block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium',
                isActive(n.path) ? 'text-brand-300 bg-white/5' : 'text-ink-300 hover:bg-white/5'
              )}
            >
              {n.label}
            </button>
          ))}
          <div className="pt-3 mt-3 border-t border-white/5 flex flex-col gap-2">
            {session ? (
              <>
                <button onClick={() => go('/dashboard')} className="btn-ghost w-full">Dashboard</button>
                {isAdmin && <button onClick={() => go('/admin')} className="btn-outline w-full">Admin</button>}
                <button onClick={signOut} className="btn-outline w-full">Sign out</button>
              </>
            ) : (
              <>
                <button onClick={() => go('/login')} className="btn-ghost w-full">Sign in</button>
                <button onClick={() => go('/signup')} className="btn-primary w-full">Get started</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-white/5 bg-ink-950">
      <div className="container-page py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo size="md" />
            <p className="mt-4 max-w-sm text-sm text-ink-400">
              Fairway blends golf performance tracking, charity giving, and monthly prize draws into one
              premium membership — play better, give back, win big.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-ink-200">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-400">
              <li><button onClick={() => navigate('/how-it-works')} className="hover:text-brand-300">How it works</button></li>
              <li><button onClick={() => navigate('/charities')} className="hover:text-brand-300">Charities</button></li>
              <li><button onClick={() => navigate('/pricing')} className="hover:text-brand-300">Pricing</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-ink-200">Account</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-400">
              <li><button onClick={() => navigate('/login')} className="hover:text-brand-300">Sign in</button></li>
              <li><button onClick={() => navigate('/signup')} className="hover:text-brand-300">Create account</button></li>
              <li><button onClick={() => navigate('/dashboard')} className="hover:text-brand-300">Dashboard</button></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-6 text-xs text-ink-500">
          <p>&copy; {new Date().getFullYear()} Fairway. Demo platform — no real payments processed.</p>
          <p>Built for golfers who give back.</p>
        </div>
      </div>
    </footer>
  );
}
