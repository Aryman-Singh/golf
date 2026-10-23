import { useEffect, useState } from 'react';
import { Gift, Trophy, Sparkles, AlertCircle, Shuffle, Check, History } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import type { Draw, DrawEntry, Winner } from '@/lib/types';
import { formatCurrency, formatDate, classNames, randomDrawNumbers } from '@/lib/utils';
import { EmptyState, Spinner } from '@/components/ui';

const NUM_MIN = 1;
const NUM_MAX = 49;
const PICK_COUNT = 5;

export function DrawPage() {
  usePage('Prize Draw');
  const { profile } = useAuth();
  const [openDraw, setOpenDraw] = useState<Draw | null>(null);
  const [entry, setEntry] = useState<DrawEntry | null>(null);
  const [pastDraws, setPastDraws] = useState<Draw[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [picks, setPicks] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  async function load() {
    if (!profile) return;
    setLoading(true);
    const [od, ent, pd, win, sub] = await Promise.all([
      supabase.from('draws').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('draw_entries').select('*, draw:draws(*)').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('draws').select('*').eq('status', 'completed').order('draw_month', { ascending: false }).limit(6),
      supabase.from('winners').select('*, draw:draws(*)').order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('id').eq('user_id', profile.id).eq('status', 'active').maybeSingle(),
    ]);
    setOpenDraw((od.data as Draw) ?? null);
    setEntry((ent.data as DrawEntry) ?? null);
    setPastDraws((pd.data as Draw[]) ?? []);
    setWinners((win.data as Winner[]) ?? []);
    setSubscriptionActive(!!sub.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [profile]);

  function togglePick(n: number) {
    setError(null);
    setPicks((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= PICK_COUNT) return prev;
      return [...prev, n].sort((a, b) => a - b);
    });
  }

  function quickPick() {
    setPicks(randomDrawNumbers(NUM_MIN, NUM_MAX, PICK_COUNT));
    setError(null);
  }

  async function submitEntry() {
    if (!profile || !openDraw) return;
    if (picks.length !== PICK_COUNT) { setError(`Pick exactly ${PICK_COUNT} numbers.`); return; }
    if (!subscriptionActive) { setError('You need an active subscription to enter the draw.'); return; }
    setSaving(true);
    setError(null);
    if (entry) {
      const { error: err } = await supabase.from('draw_entries').update({ numbers: picks }).eq('id', entry.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase.from('draw_entries').insert({ user_id: profile.id, draw_id: openDraw.id, numbers: picks });
      if (err) { setError(err.message); setSaving(false); return; }
    }
    setSaving(false);
    setMessage('Your numbers are locked in!');
    setTimeout(() => setMessage(null), 2500);
    setPicks([]);
    await load();
  }

  if (loading) return <DashboardLayout title="Prize Draw"><div className="flex justify-center py-20"><Spinner className="text-brand-400" /></div></DashboardLayout>;

  const numbers = Array.from({ length: NUM_MAX }, (_, i) => i + 1);
  const canEnter = !!openDraw && subscriptionActive;
  const hasEntry = !!entry && entry.draw_id === openDraw?.id;

  return (
    <DashboardLayout title="Prize Draw">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Monthly prize draw</h2>
        <p className="mt-1 text-ink-400">Pick {PICK_COUNT} numbers from {NUM_MIN}–{NUM_MAX}. Match 3, 4, or 5 to win.</p>
      </div>

      {message && <div className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">{message}</div>}
      {error && <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"><AlertCircle size={16} className="mt-0.5" /> {error}</div>}

      {!subscriptionActive && (
        <div className="mb-6 card border-gold-500/30 bg-gold-500/5 p-5 flex items-center gap-3">
          <Sparkles size={20} className="text-gold-400" />
          <p className="text-sm text-ink-300">You need an active subscription to enter the draw.</p>
        </div>
      )}

      {openDraw ? (
        <>
          {/* Jackpot banner */}
          <div className="mb-6 relative overflow-hidden rounded-2xl border border-gold-500/20 bg-gradient-to-br from-gold-500/10 via-ink-900 to-ink-950 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(224,168,24,0.12),transparent_60%)]" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-400"><Trophy size={28} /></div>
                <div>
                  <p className="text-sm text-ink-400">{openDraw.label}</p>
                  <p className="font-display text-3xl font-bold text-gold-400">{formatCurrency(openDraw.jackpot_cents)}</p>
                  <p className="text-xs text-ink-500">Current jackpot · rolls over if no 5-match</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center"><p className="font-display text-xl font-bold text-ink-100">3</p><p className="text-xs text-ink-500">Free month</p></div>
                <div className="text-center"><p className="font-display text-xl font-bold text-gold-400">$100</p><p className="text-xs text-ink-500">4 matches</p></div>
                <div className="text-center"><p className="font-display text-xl font-bold text-brand-300">All</p><p className="text-xs text-ink-500">5 = jackpot</p></div>
              </div>
            </div>
          </div>

          {/* Current entry */}
          {hasEntry && (
            <div className="mb-6 card p-6 border-brand-500/30">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2"><Check size={18} className="text-brand-400" /> Your entry</h3>
                <span className="badge-good">Locked in</span>
              </div>
              <div className="mt-4 flex gap-3">
                {entry!.numbers.map((n) => (
                  <span key={n} className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-200 font-display font-bold text-lg border border-brand-500/30">{n}</span>
                ))}
              </div>
              <p className="mt-4 text-sm text-ink-400">You can change your numbers anytime before the draw closes.</p>
            </div>
          )}

          {/* Number picker */}
          {canEnter && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Gift size={18} className="text-brand-400" /> {hasEntry ? 'Change your numbers' : 'Pick your numbers'}</h3>
                <button onClick={quickPick} className="btn-ghost text-sm"><Shuffle size={14} /> Quick pick</button>
              </div>

              {picks.length > 0 && (
                <div className="mb-5 flex items-center gap-2">
                  <span className="text-sm text-ink-400">Selected:</span>
                  {picks.map((n) => (
                    <span key={n} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-ink-950 font-display font-bold text-sm">{n}</span>
                  ))}
                  <span className="text-xs text-ink-500 ml-2">{picks.length}/{PICK_COUNT}</span>
                </div>
              )}

              <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
                {numbers.map((n) => {
                  const picked = picks.includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() => togglePick(n)}
                      disabled={!picked && picks.length >= PICK_COUNT}
                      className={classNames(
                        'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition',
                        picked ? 'bg-brand-500 text-ink-950 scale-110 shadow-lg shadow-brand-500/30' : 'bg-white/5 text-ink-300 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5'
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>

              <button onClick={submitEntry} disabled={saving || picks.length !== PICK_COUNT} className="mt-6 btn-primary w-full">
                {saving ? <Spinner /> : hasEntry ? 'Update entry' : 'Submit entry'}
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState icon={Gift} title="No open draw" description="Check back soon — a new monthly draw opens regularly." />
      )}

      {/* Past draws */}
      {pastDraws.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-4"><History size={18} className="text-ink-400" /> Past draws</h3>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr className="text-left text-ink-400">
                    <th className="px-5 py-3 font-medium">Draw</th>
                    <th className="px-5 py-3 font-medium">Winning numbers</th>
                    <th className="px-5 py-3 font-medium">Jackpot</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastDraws.map((d) => {
                    const drawWinners = winners.filter((w) => w.draw_id === d.id);
                    return (
                      <tr key={d.id} className="border-t border-white/5">
                        <td className="px-5 py-3.5 text-ink-300">{d.label}<p className="text-xs text-ink-500">{formatDate(d.draw_month)}</p></td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-1.5">
                            {d.winning_numbers.length > 0 ? d.winning_numbers.map((n, i) => (
                              <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500/15 text-gold-300 font-display font-bold text-xs">{n}</span>
                            )) : <span className="text-ink-500">—</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gold-400 font-semibold">{formatCurrency(d.jackpot_cents)}</td>
                        <td className="px-5 py-3.5">
                          {drawWinners.length > 0 ? <span className="badge-good">{drawWinners.length} winner{drawWinners.length > 1 ? 's' : ''}</span> : <span className="badge-warn">Rolled over</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
