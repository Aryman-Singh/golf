import { Check, Sparkles, ArrowRight, Calendar, Zap } from 'lucide-react';
import { PublicPage } from '@/components/PublicPage';
import { usePage } from '@/lib/usePage';
import { navigate } from '@/lib/router';
import { classNames } from '@/lib/utils';

export function PricingPage() {
  usePage('Pricing');

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '$9.99',
      cadence: '/month',
      icon: Calendar,
      features: [
        'Unlimited golf score tracking',
        'Latest 5 scores with trend chart',
        'Charity selection (10%+ contribution)',
        'Entry to every monthly prize draw',
        'Winner verification & payout tracking',
      ],
      featured: false,
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '$99',
      cadence: '/year',
      icon: Zap,
      features: [
        'Everything in Monthly',
        'Save 17% versus monthly',
        'Priority winner verification',
        'Year-end charity impact report',
        'Early access to new features',
      ],
      featured: true,
    },
  ];

  return (
    <PublicPage>
      <section className="container-page py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="badge-good mb-5"><Sparkles size={14} /> Simple, transparent</span>
          <h1 className="section-title">Membership that gives back</h1>
          <p className="mt-4 text-lg text-ink-300">One plan covers tracking, charity, and prize draws. Choose monthly or save with yearly. Demo payments only — no real card is charged.</p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.id}
              className={classNames(
                'relative card p-8 flex flex-col',
                p.featured && 'border-brand-500/40 bg-gradient-to-b from-brand-500/10 to-ink-900/60'
              )}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge-good">
                  <Sparkles size={12} /> Best value
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${p.featured ? 'bg-brand-500/15 text-brand-300' : 'bg-white/5 text-ink-300'}`}>
                  <p.icon size={22} />
                </div>
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">{p.price}</span>
                <span className="text-ink-400 text-sm">{p.cadence}</span>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-3 text-sm text-ink-300">
                    <Check size={18} className="text-brand-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/signup')}
                className={classNames('mt-8 w-full', p.featured ? 'btn-primary' : 'btn-ghost')}
              >
                Choose {p.name} <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-xs text-ink-500 max-w-md mx-auto">
          Fairway uses demo payments for showcase purposes. No real payment gateway is connected and no card is ever charged.
        </div>
      </section>
    </PublicPage>
  );
}
