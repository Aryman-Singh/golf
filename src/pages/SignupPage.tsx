import { useState, type FormEvent } from 'react';
import { Mail, Lock, User, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { PublicPage } from '@/components/PublicPage';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { Spinner } from '@/components/ui';

export function SignupPage() {
  usePage('Sign up');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    // stash chosen plan so the dashboard onboarding can pick it up
    if (data.user) {
      try { sessionStorage.setItem('pending_plan', plan); } catch { /* ignore */ }
    }
    setLoading(false);
    navigate('/dashboard');
  }

  return (
    <PublicPage>
      <section className="container-page py-20">
        <div className="mx-auto max-w-md">
          <div className="card p-8 animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300">
                <Sparkles size={24} />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold">Join Fairway</h1>
                <p className="text-sm text-ink-400">Track, give, and win — in one membership</p>
              </div>
            </div>

            {error && (
              <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="name">Display name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                  <input id="name" required className="input pl-10" placeholder="Alex Golfer" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
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
                  <input id="password" type="password" required className="input pl-10" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Choose your plan</label>
                <div className="grid grid-cols-2 gap-3">
                  {([['monthly', '$9.99/mo'], ['yearly', '$99/yr']] as const).map(([p, label]) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPlan(p)}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${plan === p ? 'border-brand-400 bg-brand-500/10 text-brand-200' : 'border-white/10 text-ink-300 hover:bg-white/5'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Spinner /> : <>Create account <ArrowRight size={16} /></>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-400">
              Already a member?{' '}
              <button onClick={() => navigate('/login')} className="font-semibold text-brand-300 hover:text-brand-200">Sign in</button>
            </p>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
