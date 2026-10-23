import { useState, type FormEvent } from 'react';
import { Mail, Lock, AlertCircle, ArrowRight, UserCircle } from 'lucide-react';
import { PublicPage } from '@/components/PublicPage';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { Spinner } from '@/components/ui';

export function LoginPage() {
  usePage('Sign in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message === 'Invalid login credentials' ? 'Email or password is incorrect.' : err.message);
      return;
    }
    navigate('/dashboard');
  }

  return (
    <PublicPage>
      <section className="container-page py-20">
        <div className="mx-auto max-w-md">
          <div className="card p-8 animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300">
                <UserCircle size={24} />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold">Welcome back</h1>
                <p className="text-sm text-ink-400">Sign in to your Fairway account</p>
              </div>
            </div>

            {error && (
              <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                  <input id="email" type="email" required className="input pl-10" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                  <input id="password" type="password" required className="input pl-10" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Spinner /> : <>Sign in <ArrowRight size={16} /></>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-400">
              No account?{' '}
              <button onClick={() => navigate('/signup')} className="font-semibold text-brand-300 hover:text-brand-200">Create one</button>
            </p>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
