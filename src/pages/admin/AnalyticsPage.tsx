import { useEffect, useState } from 'react';
import { Users, CreditCard, HeartHandshake, Trophy, TrendingUp, DollarSign, Gift, BarChart3 } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import type { Profile, Subscription, Charity, Draw, Winner, DrawEntry } from '@/lib/types';
import { formatCurrency, classNames } from '@/lib/utils';
import { Spinner, StatCard } from '@/components/ui';

export function AdminAnalytics() {
  usePage('Admin · Analytics');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [entries, setEntries] = useState<DrawEntry[]>([]);

  useEffect(() => {
    (async () => {
      const [u, s, c, d, w, e] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('subscriptions').select('*'),
        supabase.from('charities').select('*'),
        supabase.from('draws').select('*'),
        supabase.from('winners').select('*, profile:profiles(*)'),
        supabase.from('draw_entries').select('*'),
      ]);
      setUsers((u.data as Profile[]) ?? []);
      setSubs((s.data as Subscription[]) ?? []);
      setCharities((c.data as Charity[]) ?? []);
      setDraws((d.data as Draw[]) ?? []);
      setWinners((w.data as Winner[]) ?? []);
      setEntries((e.data as DrawEntry[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <AdminLayout title="Analytics"><div className="flex justify-center py-20"><Spinner className="text-gold-400" /></div></AdminLayout>;

  const activeSubs = subs.filter((s) => s.status === 'active').length;
  const monthlyRev = subs.filter((s) => s.status === 'active').reduce((a, s) => a + (s.plan === 'monthly' ? s.price_cents : s.price_cents / 12), 0);
  const totalPaidOut = winners.filter((w) => w.payout_status === 'paid').reduce((a, w) => a + w.prize_cents, 0);
  const pendingVerif = winners.filter((w) => w.verification_status === 'pending').length;
  const openDraw = draws.find((d) => d.status === 'open');

  // signups over last 6 months
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const count = users.filter((u) => u.created_at.slice(0, 7) === key).length;
    months.push({ label: d.toLocaleString('en-US', { month: 'short' }), count });
  }
  const maxCount = Math.max(1, ...months.map((m) => m.count));

  // plan split
  const monthlyCount = subs.filter((s) => s.status === 'active' && s.plan === 'monthly').length;
  const yearlyCount = subs.filter((s) => s.status === 'active' && s.plan === 'yearly').length;

  return (
    <AdminLayout title="Analytics">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Platform overview</h2>
        <p className="mt-1 text-ink-400">Key metrics across the Fairway platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={String(users.length)} accent="brand" />
        <StatCard icon={CreditCard} label="Active subscriptions" value={String(activeSubs)} accent="gold" />
        <StatCard icon={DollarSign} label="Monthly revenue" value={formatCurrency(Math.round(monthlyRev))} accent="brand" />
        <StatCard icon={Trophy} label="Total paid out" value={formatCurrency(totalPaidOut)} accent="gold" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={HeartHandshake} label="Charities" value={String(charities.length)} accent="ink" />
        <StatCard icon={Gift} label="Total draws" value={String(draws.length)} accent="ink" />
        <StatCard icon={BarChart3} label="Draw entries" value={String(entries.length)} accent="ink" />
        <StatCard icon={TrendingUp} label="Pending verification" value={String(pendingVerif)} accent="ink" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Signups chart */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display text-lg font-semibold">New members (6 months)</h3>
          <div className="mt-6 flex items-end gap-4 h-44">
            {months.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-ink-400">{m.count}</span>
                <div className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all" style={{ height: `${(m.count / maxCount) * 100}%`, minHeight: '4px' }} />
                <span className="text-xs text-ink-500">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan split */}
        <div className="card p-6">
          <h3 className="font-display text-lg font-semibold">Active plan split</h3>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Monthly', count: monthlyCount, color: 'bg-brand-500' },
              { label: 'Yearly', count: yearlyCount, color: 'bg-gold-500' },
            ].map((p) => {
              const total = monthlyCount + yearlyCount || 1;
              return (
                <div key={p.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-ink-300">{p.label}</span>
                    <span className="text-ink-400">{p.count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <div className={classNames('h-full rounded-full transition-all', p.color)} style={{ width: `${(p.count / total) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {openDraw && (
            <div className="mt-6 pt-5 border-t border-white/5">
              <p className="text-xs text-ink-500">Current open jackpot</p>
              <p className="font-display text-2xl font-bold text-gold-400">{formatCurrency(openDraw.jackpot_cents)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent winners */}
      <div className="mt-6 card p-6">
        <h3 className="font-display text-lg font-semibold">Recent winners</h3>
        {winners.length === 0 ? (
          <p className="mt-4 text-sm text-ink-400">No winners recorded yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-white/5">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Draw</th>
                  <th className="pb-2 font-medium">Matches</th>
                  <th className="pb-2 font-medium">Prize</th>
                  <th className="pb-2 font-medium">Verification</th>
                </tr>
              </thead>
              <tbody>
                {winners.slice(0, 6).map((w) => (
                  <tr key={w.id} className="border-b border-white/5">
                    <td className="py-3 text-ink-300">{(w as unknown as { profile?: Profile }).profile?.display_name ?? w.user_id.slice(0, 8)}</td>
                    <td className="py-3 text-ink-400">—</td>
                    <td className="py-3"><span className="badge-mute">{w.matches}</span></td>
                    <td className="py-3 font-semibold text-gold-400">{formatCurrency(w.prize_cents)}</td>
                    <td className="py-3">
                      <span className={w.verification_status === 'approved' ? 'badge-good' : w.verification_status === 'rejected' ? 'badge-bad' : 'badge-warn'}>{w.verification_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
