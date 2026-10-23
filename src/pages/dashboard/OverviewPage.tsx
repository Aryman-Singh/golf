import { useEffect, useState } from 'react';
import { Trophy, Target, HeartHandshake, CreditCard, TrendingDown, TrendingUp, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import type { GolfScore, Subscription, CharitySelection, DrawEntry, Winner, Draw } from '@/lib/types';
import { formatCurrency, formatDate, scoreDiff, classNames } from '@/lib/utils';
import { navigate } from '@/lib/router';
import { StatCard } from '@/components/ui';

export function DashboardOverview() {
  usePage('Dashboard');
  const { profile, refreshProfile } = useAuth();
  const [scores, setScores] = useState<GolfScore[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [charitySel, setCharitySel] = useState<CharitySelection | null>(null);
  const [entry, setEntry] = useState<DrawEntry | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [openDraw, setOpenDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [showAdminBanner, setShowAdminBanner] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const uid = profile.id;
      const [s, sub, cs, ent, win, draws] = await Promise.all([
        supabase.from('golf_scores').select('*').eq('user_id', uid).order('date_played', { ascending: false }).order('created_at', { ascending: false }).limit(5),
        supabase.from('subscriptions').select('*').eq('user_id', uid).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('charity_selections').select('*, charity:charities(*)').eq('user_id', uid).maybeSingle(),
        supabase.from('draw_entries').select('*, draw:draws(*)').eq('user_id', uid).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('winners').select('*, draw:draws(*)').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('draws').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      setScores((s.data as GolfScore[]) ?? []);
      setSubscription((sub.data as Subscription) ?? null);
      setCharitySel((cs.data as CharitySelection) ?? null);
      setEntry((ent.data as DrawEntry) ?? null);
      setWinners((win.data as Winner[]) ?? []);
      setOpenDraw((draws.data as Draw) ?? null);
      // check if any admin exists — if not, offer to bootstrap
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin');
      setShowAdminBanner((count ?? 0) === 0 && profile?.role !== 'admin');
      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return <DashboardLayout title="Overview"><div className="animate-pulse text-ink-400">Loading your dashboard…</div></DashboardLayout>;
  }

  const activeSub = !!subscription;
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length) : 0;
  const trend = scores.length >= 2 ? scores[0].score - scores[scores.length - 1].score : 0;
  const totalWon = winners.reduce((a, w) => a + w.prize_cents, 0);

  return (
    <DashboardLayout title="Overview">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold">Welcome back, {profile?.display_name}</h2>
        <p className="mt-1 text-ink-400">Here is your Fairway snapshot.</p>
      </div>

      {!activeSub && (
        <div className="mb-8 card border-gold-500/30 bg-gold-500/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-gold-400" />
            <div>
              <p className="font-semibold text-ink-100">Activate your membership</p>
              <p className="text-sm text-ink-400">Subscribe to enter prize draws and support your charity.</p>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/subscription')} className="btn-gold">Choose plan <ArrowRight size={16} /></button>
        </div>
      )}

      {showAdminBanner && (
        <div className="mb-8 card border-brand-500/30 bg-brand-500/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-brand-300" />
            <div>
              <p className="font-semibold text-ink-100">Become the platform admin</p>
              <p className="text-sm text-ink-400">No admin exists yet. Promote your account to manage users, draws, and winners.</p>
            </div>
          </div>
          <button
            disabled={promoting}
            onClick={async () => {
              setPromoting(true);
              const { data, error } = await supabase.rpc('promote_first_admin');
              setPromoting(false);
              if (error) { alert(error.message); return; }
              if (data) { await refreshProfile(); setShowAdminBanner(false); navigate('/admin'); }
              else { alert('An admin already exists.'); setShowAdminBanner(false); }
            }}
            className="btn-primary"
          >
            {promoting ? 'Promoting…' : 'Become admin'}
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CreditCard} label="Subscription" value={activeSub ? subscription!.plan.charAt(0).toUpperCase() + subscription!.plan.slice(1) : 'Inactive'} accent={activeSub ? 'brand' : 'ink'} />
        <StatCard icon={Target} label="Avg score (last 5)" value={avgScore || '—'} accent="brand" />
        <StatCard icon={Trophy} label="Total winnings" value={formatCurrency(totalWon)} accent="gold" />
        <StatCard icon={HeartHandshake} label="Charity share" value={charitySel ? `${charitySel.contribution_pct}%` : 'Not set'} accent="brand" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Scores chart */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Latest 5 scores</h3>
            <button onClick={() => navigate('/dashboard/scores')} className="text-sm text-brand-300 hover:text-brand-200 flex items-center gap-1">
              Manage <ArrowRight size={14} />
            </button>
          </div>
          {scores.length === 0 ? (
            <p className="mt-6 text-sm text-ink-400">No scores logged yet. Add your first round.</p>
          ) : (
            <>
              <div className="mt-6 flex items-end gap-3 h-40">
                {[...scores].reverse().map((s) => {
                  const diff = scoreDiff(s.score, s.par);
                  const heightPct = Math.min(100, Math.max(20, ((s.score - 60) / 40) * 100));
                  return (
                    <div key={s.id} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs text-ink-400">{s.score}</span>
                      <div
                        className={classNames(
                          'w-full rounded-t-md transition-all',
                          diff.tone === 'good' ? 'bg-gradient-to-t from-brand-600 to-brand-400' : diff.tone === 'ok' ? 'bg-gradient-to-t from-ink-600 to-ink-400' : 'bg-gradient-to-t from-gold-600 to-gold-400'
                        )}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] text-ink-500">{formatDate(s.date_played).split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                {trend < 0 ? <TrendingDown size={16} className="text-brand-400" /> : trend > 0 ? <TrendingUp size={16} className="text-gold-400" /> : null}
                <span className="text-ink-400">
                  {trend === 0 ? 'Steady form' : trend < 0 ? `Improving by ${Math.abs(trend)} strokes` : `Up ${trend} strokes recently`}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Prize draw card */}
        <div className="card p-6">
          <h3 className="font-display text-lg font-semibold">This month's draw</h3>
          {openDraw ? (
            <>
              <p className="mt-1 text-sm text-ink-400">{openDraw.label}</p>
              <p className="mt-4 font-display text-3xl font-bold text-gold-400">{formatCurrency(openDraw.jackpot_cents)}</p>
              <p className="text-xs text-ink-500">Current jackpot</p>
              <div className="mt-5">
                {entry ? (
                  <>
                    <p className="text-sm text-ink-400 mb-2">Your numbers</p>
                    <div className="flex gap-2">
                      {entry.numbers.map((n) => (
                        <span key={n} className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/15 text-brand-200 font-display font-bold text-sm">{n}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-ink-400">You haven't entered this month's draw yet.</p>
                )}
              </div>
              <button onClick={() => navigate('/dashboard/draw')} className="mt-5 btn-ghost w-full">
                {entry ? 'View draw' : 'Enter draw'} <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <p className="mt-4 text-sm text-ink-400">No open draw right now.</p>
          )}
        </div>
      </div>

      {/* Winnings table */}
      <div className="mt-6 card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Your winnings</h3>
          <button onClick={() => navigate('/dashboard/winnings')} className="text-sm text-brand-300 hover:text-brand-200 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </button>
        </div>
        {winners.length === 0 ? (
          <p className="mt-4 text-sm text-ink-400">No wins yet — keep your numbers in play.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-white/5">
                  <th className="pb-2 font-medium">Draw</th>
                  <th className="pb-2 font-medium">Matches</th>
                  <th className="pb-2 font-medium">Prize</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {winners.slice(0, 5).map((w) => (
                  <tr key={w.id} className="border-b border-white/5">
                    <td className="py-3 text-ink-300">{w.draw?.label ?? '—'}</td>
                    <td className="py-3"><span className="badge-mute">{w.matches}</span></td>
                    <td className="py-3 font-semibold text-gold-400">{formatCurrency(w.prize_cents)}</td>
                    <td className="py-3">
                      <span className={w.verification_status === 'approved' ? 'badge-good' : w.verification_status === 'rejected' ? 'badge-bad' : 'badge-warn'}>
                        {w.verification_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
