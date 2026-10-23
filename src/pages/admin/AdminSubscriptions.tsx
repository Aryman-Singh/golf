import { useEffect, useState } from 'react';
import { CreditCard, Search } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import type { Subscription, Profile } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Spinner } from '@/components/ui';

export function AdminSubscriptions() {
  usePage('Admin · Subscriptions');
  const [subs, setSubs] = useState<(Subscription & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'cancelled' | 'expired'>('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*, profile:profiles(*)')
        .order('created_at', { ascending: false });
      setSubs((data as (Subscription & { profile?: Profile })[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = subs.filter((s) => {
    const matchesFilter = filter === 'all' || s.status === filter;
    const matchesQ = !q || s.profile?.email.toLowerCase().includes(q.toLowerCase()) || s.profile?.display_name.toLowerCase().includes(q.toLowerCase());
    return matchesFilter && matchesQ;
  });

  const totalMrr = subs.filter((s) => s.status === 'active').reduce((a, s) => a + (s.plan === 'monthly' ? s.price_cents : s.price_cents / 12), 0);

  return (
    <AdminLayout title="Subscriptions">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Subscriptions</h2>
        <p className="mt-1 text-ink-400">Monthly recurring revenue: <span className="text-brand-300 font-semibold">{formatCurrency(Math.round(totalMrr))}</span></p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
          <input className="input pl-10" placeholder="Search by user…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'cancelled', 'expired'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${filter === f ? 'bg-brand-500 text-ink-950' : 'bg-white/5 text-ink-300 hover:bg-white/10'}`}>{f}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="text-gold-400" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr className="text-left text-ink-400">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Started</th>
                  <th className="px-5 py-3 font-medium">Renews</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-white/5">
                    <td className="px-5 py-3.5 text-ink-100 font-medium">{s.profile?.display_name ?? 'Unknown'}<p className="text-xs text-ink-500">{s.profile?.email}</p></td>
                    <td className="px-5 py-3.5 capitalize text-ink-300">{s.plan}</td>
                    <td className="px-5 py-3.5 text-ink-300">{formatCurrency(s.price_cents)}</td>
                    <td className="px-5 py-3.5">
                      <span className={s.status === 'active' ? 'badge-good' : s.status === 'cancelled' ? 'badge-warn' : 'badge-bad'}>{s.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-ink-400">{formatDate(s.started_at)}</td>
                    <td className="px-5 py-3.5 text-ink-400">{formatDate(s.renews_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
