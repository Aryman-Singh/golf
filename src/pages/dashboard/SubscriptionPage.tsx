import { useEffect, useState } from 'react';
import { CreditCard, Check, Sparkles, Calendar, Zap, AlertCircle, Lock } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import type { Subscription } from '@/lib/types';
import { formatCurrency, formatDate, classNames } from '@/lib/utils';
import { Spinner } from '@/components/ui';

const PLANS = [
  { id: 'monthly' as const, name: 'Monthly', price: 999, cadence: '/month', icon: Calendar, features: ['All core features', 'Cancel anytime', 'Monthly prize draw entry'] },
  { id: 'yearly' as const, name: 'Yearly', price: 9900, cadence: '/year', icon: Zap, features: ['Everything in Monthly', 'Save 17%', 'Priority verification'] },
];

export function SubscriptionPage() {
  usePage('Subscription');
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    const active = (data as Subscription[])?.find((s) => s.status === 'active') ?? null;
    setSubscription(active);
    setLoading(false);
    try {
      const pending = sessionStorage.getItem('pending_plan');
      if (pending === 'monthly' || pending === 'yearly') { setSelectedPlan(pending); sessionStorage.removeItem('pending_plan'); }
    } catch { /* ignore */ }
  }

  useEffect(() => { load(); }, [profile]);

  async function handleSubscribe() {
    if (!profile) return;
    setProcessing(true);
    setError(null);
    const plan = PLANS.find((p) => p.id === selectedPlan)!;
    // demo payment — no real gateway
    await new Promise((r) => setTimeout(r, 1200));
    const { data: existing } = await supabase.from('subscriptions').select('id').eq('user_id', profile.id).eq('status', 'active').maybeSingle();
    if (existing) {
      const { error: err } = await supabase.from('subscriptions').update({ plan: selectedPlan, price_cents: plan.price, renews_at: new Date(Date.now() + (selectedPlan === 'yearly' ? 365 : 30) * 864e5).toISOString() }).eq('id', existing.id);
      if (err) { setError(err.message); setProcessing(false); return; }
    } else {
      const { error: err } = await supabase.from('subscriptions').insert({ user_id: profile.id, plan: selectedPlan, price_cents: plan.price, renews_at: new Date(Date.now() + (selectedPlan === 'yearly' ? 365 : 30) * 864e5).toISOString() });
      if (err) { setError(err.message); setProcessing(false); return; }
    }
    setProcessing(false);
    setMessage('Subscription activated. Welcome to Fairway!');
    setTimeout(() => setMessage(null), 3000);
    await load();
  }

  async function handleCancel() {
    if (!subscription || !confirm('Cancel your subscription? You will keep access until your renewal date.')) return;
    const { error: err } = await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', subscription.id);
    if (err) { setError(err.message); return; }
    setMessage('Subscription cancelled.');
    setTimeout(() => setMessage(null), 3000);
    await load();
  }

  if (loading) return <DashboardLayout title="Subscription"><div className="flex justify-center py-20"><Spinner className="text-brand-400" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Subscription">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Your membership</h2>
        <p className="mt-1 text-ink-400">Manage your plan. Demo payments only — no real card is charged.</p>
      </div>

      {message && <div className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">{message}</div>}
      {error && <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"><AlertCircle size={16} className="mt-0.5" /> {error}</div>}

      {subscription && (
        <div className="mb-8 card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300"><CreditCard size={24} /></div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold capitalize">{subscription.plan} plan</h3>
                  <span className={subscription.status === 'active' ? 'badge-good' : 'badge-warn'}>{subscription.status}</span>
                </div>
                <p className="text-sm text-ink-400 mt-0.5">{formatCurrency(subscription.price_cents)} · Renews {formatDate(subscription.renews_at)}</p>
              </div>
            </div>
            {subscription.status === 'active' && (
              <button onClick={handleCancel} className="btn-ghost">Cancel subscription</button>
            )}
          </div>
        </div>
      )}

      {!subscription?.status || subscription.status !== 'active' ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 max-w-3xl">
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={classNames(
                  'card p-6 text-left transition',
                  selectedPlan === p.id ? 'border-brand-400 bg-brand-500/5' : 'hover:border-white/20'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selectedPlan === p.id ? 'bg-brand-500/15 text-brand-300' : 'bg-white/5 text-ink-300'}`}><p.icon size={20} /></div>
                    <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                  </div>
                  {selectedPlan === p.id && <span className="badge-good"><Check size={12} /> Selected</span>}
                </div>
                <p className="mt-4 font-display text-3xl font-bold">{formatCurrency(p.price)}<span className="text-sm text-ink-400 font-normal">{p.cadence}</span></p>
                <ul className="mt-4 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-ink-300"><Check size={16} className="text-brand-400 shrink-0" /> {f}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* Demo payment form */}
          <div className="mt-6 max-w-3xl card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={16} className="text-ink-400" />
              <h3 className="font-display font-semibold">Demo checkout</h3>
              <span className="badge-mute ml-auto"><Sparkles size={12} /> No real charge</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Card number</label>
                <input className="input" placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" />
              </div>
              <div>
                <label className="label">Expiry</label>
                <input className="input" placeholder="12/28" defaultValue="12/28" />
              </div>
              <div>
                <label className="label">CVC</label>
                <input className="input" placeholder="123" defaultValue="123" />
              </div>
            </div>
            <button onClick={handleSubscribe} disabled={processing} className="mt-5 btn-primary w-full">
              {processing ? <Spinner /> : <>Subscribe & pay {formatCurrency(PLANS.find((p) => p.id === selectedPlan)!.price)}</>}
            </button>
            <p className="mt-3 text-center text-xs text-ink-500">This is a showcase. No payment gateway is connected.</p>
          </div>
        </>
      ) : (
        <div className="card p-8 text-center max-w-md mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-300"><Check size={28} /></div>
          <h3 className="mt-4 font-display text-lg font-semibold">You're all set</h3>
          <p className="mt-2 text-sm text-ink-400">Your {subscription.plan} membership is active. You're entered into every monthly prize draw.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
