import { Target, HeartHandshake, Gift, Trophy, ShieldCheck, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';
import { PublicPage } from '@/components/PublicPage';
import { usePage } from '@/lib/usePage';
import { navigate } from '@/lib/router';

export function HowItWorksPage() {
  usePage('How It Works');

  const steps = [
    { icon: Target, title: '1. Track your golf scores', body: 'Add a score after every round — course, par, your total, and notes. Fairway keeps your five most recent scores and charts how your form is moving. Edit or delete any entry anytime.' },
    { icon: HeartHandshake, title: '2. Choose your charity', body: 'Browse a vetted catalogue of causes. Select one charity and set the share of your membership that supports it — anything from 10% up to 100%.' },
    { icon: Gift, title: '3. Enter the monthly draw', body: 'Each month, pick five numbers from 1–49. Your active subscription is your ticket. There is no extra cost to enter.' },
    { icon: Trophy, title: '4. Win, verify & get paid', body: 'When the draw closes, we compare your numbers to the winning set. Match 3, 4, or 5 to win a share of the jackpot. Upload your score proof for admin verification and payout.' },
  ];

  return (
    <PublicPage>
      <section className="container-page py-20">
        <div className="max-w-2xl">
          <span className="badge-good mb-5"><BarChart3 size={14} /> The Fairway loop</span>
          <h1 className="section-title">How Fairway works</h1>
          <p className="mt-4 text-lg text-ink-300">Four simple steps turn your regular round into performance insight, charitable impact, and a chance to win.</p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {steps.map((s) => (
            <div key={s.title} className="card-hover p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300">
                <s.icon size={24} />
              </div>
              <h2 className="mt-5 font-display text-xl font-semibold">{s.title}</h2>
              <p className="mt-3 text-sm text-ink-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prize draw explainer */}
      <section className="border-y border-white/5 bg-ink-900/40">
        <div className="container-page py-20">
          <h2 className="section-title text-center">The monthly prize draw</h2>
          <p className="mt-4 text-center text-ink-400 max-w-2xl mx-auto">Five numbers, three ways to win, and a jackpot that rolls over when nobody hits five.</p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { matches: '3 matches', prize: 'Free month', tone: 'ink' },
              { matches: '4 matches', prize: '$100', tone: 'gold' },
              { matches: '5 matches', prize: 'Full jackpot', tone: 'brand' },
            ].map((t) => (
              <div key={t.matches} className="card p-8 text-center">
                <p className={`font-display text-3xl font-bold ${t.tone === 'gold' ? 'text-gold-400' : t.tone === 'brand' ? 'text-brand-300' : 'text-ink-200'}`}>{t.matches}</p>
                <p className="mt-3 text-sm text-ink-400">Win</p>
                <p className="mt-1 font-display text-xl font-semibold text-ink-100">{t.prize}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 max-w-2xl mx-auto card p-6 flex gap-4 items-start">
            <ShieldCheck size={22} className="text-brand-300 shrink-0 mt-0.5" />
            <p className="text-sm text-ink-300">
              <span className="font-semibold text-ink-100">Jackpot rollover.</span> If no entry matches all five numbers in a given month, the jackpot rolls into the next draw and keeps growing until someone wins.
            </p>
          </div>
        </div>
      </section>

      {/* Verification flow */}
      <section className="container-page py-20">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div>
            <h2 className="section-title">Winner verification</h2>
            <p className="mt-4 text-ink-400">To keep draws fair, every winner submits proof before payout.</p>
            <ul className="mt-6 space-y-4">
              {[
                'Upload your latest scorecard or round screenshot as proof of play.',
                'An admin reviews your submission and approves or rejects it.',
                'Once approved, your payout is processed and marked as paid.',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <CheckCircle2 size={20} className="text-brand-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-ink-300">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400"><Trophy size={20} /></div>
              <div>
                <p className="font-semibold">Winner status</p>
                <p className="text-xs text-ink-400">Demo flow</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                { l: 'Upload proof', s: 'Complete', done: true },
                { l: 'Admin review', s: 'In review', done: false },
                { l: 'Payout', s: 'Pending', done: false },
              ].map((r) => (
                <div key={r.l} className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-950/40 px-4 py-3">
                  <span className="text-sm">{r.l}</span>
                  <span className={r.done ? 'badge-good' : 'badge-warn'}>{r.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page pb-24 text-center">
        <h2 className="section-title">Ready to tee off?</h2>
        <p className="mt-4 text-ink-400">Create your account in under a minute.</p>
        <button onClick={() => navigate('/signup')} className="mt-6 btn-primary">Get started <ArrowRight size={16} /></button>
      </section>
    </PublicPage>
  );
}
