import { useEffect, useState } from 'react';
import { Gift, Trophy, Plus, Shuffle, Check, AlertCircle, X } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import type { Draw, DrawEntry, Winner } from '@/lib/types';
import { formatCurrency, formatDate, classNames, randomDrawNumbers } from '@/lib/utils';
import { Spinner, EmptyState } from '@/components/ui';

export function AdminDraws() {
  usePage('Admin · Draws');
  const [draws, setDraws] = useState<Draw[]>([]);
  const [entries, setEntries] = useState<DrawEntry[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newJackpot, setNewJackpot] = useState('1000');

  async function load() {
    setLoading(true);
    const [d, e, w] = await Promise.all([
      supabase.from('draws').select('*').order('draw_month', { ascending: false }),
      supabase.from('draw_entries').select('*'),
      supabase.from('winners').select('*'),
    ]);
    setDraws((d.data as Draw[]) ?? []);
    setEntries((e.data as DrawEntry[]) ?? []);
    setWinners((w.data as Winner[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function countMatches(a: number[], b: number[]): number {
    return a.filter((n) => b.includes(n)).length;
  }

  async function runDraw(draw: Draw) {
    if (!confirm(`Run the draw "${draw.label}"? This will generate winning numbers and compute winners. It cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    const winning = randomDrawNumbers(1, 49, 5);

    const drawEntries = entries.filter((e) => e.draw_id === draw.id);

    // determine prize pool
    let jackpot = draw.jackpot_cents;
    const newWinners: { user_id: string; entry_id: string; matches: 3 | 4 | 5; prize_cents: number }[] = [];
    const threeMatches: typeof newWinners = [];
    const fourMatches: typeof newWinners = [];
    const fiveMatches: typeof newWinners = [];

    drawEntries.forEach((e) => {
      const m = countMatches(e.numbers, winning);
      if (m === 3) threeMatches.push({ user_id: e.user_id, entry_id: e.id, matches: 3, prize_cents: 999 });
      else if (m === 4) fourMatches.push({ user_id: e.user_id, entry_id: e.id, matches: 4, prize_cents: 10000 });
      else if (m === 5) fiveMatches.push({ user_id: e.user_id, entry_id: e.id, matches: 5, prize_cents: jackpot });
    });

    // if 5-match winners, split jackpot among them
    if (fiveMatches.length > 0) {
      const split = Math.floor(jackpot / fiveMatches.length);
      fiveMatches.forEach((w) => (w.prize_cents = split));
      newWinners.push(...fiveMatches, ...fourMatches, ...threeMatches);
    } else {
      // rollover: jackpot rolls to next draw, but 3 and 4 match prizes still paid
      newWinners.push(...fourMatches, ...threeMatches);
    }

    // mark draw completed
    const { error: dErr } = await supabase
      .from('draws')
      .update({ status: 'completed', winning_numbers: winning, completed_at: new Date().toISOString() })
      .eq('id', draw.id);
    if (dErr) { setError(dErr.message); setBusy(false); return; }

    // insert winners
    if (newWinners.length > 0) {
      const rows = newWinners.map((w) => ({ draw_id: draw.id, user_id: w.user_id, entry_id: w.entry_id, matches: w.matches, prize_cents: w.prize_cents }));
      const { error: wErr } = await supabase.from('winners').insert(rows);
      if (wErr) { setError(wErr.message); setBusy(false); return; }
    }

    // if no 5-match, create next open draw with rolled-over jackpot
    if (fiveMatches.length === 0) {
      const nextMonth = new Date(new Date(draw.draw_month).setMonth(new Date(draw.draw_month).getMonth() + 1));
      const rolledLabel = `${nextMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })} Draw`;
      await supabase.from('draws').insert({
        label: rolledLabel,
        draw_month: nextMonth.toISOString().slice(0, 10),
        status: 'open',
        jackpot_cents: jackpot + 50000,
        rolled_over_from: draw.id,
      });
      setMessage(`No 5-match winner. Jackpot rolled over to ${rolledLabel}.`);
    } else {
      setMessage(`Draw completed. ${fiveMatches.length} jackpot winner(s), ${fourMatches.length} four-match, ${threeMatches.length} three-match.`);
    }

    setBusy(false);
    setTimeout(() => setMessage(null), 4000);
    await load();
  }

  async function createDraw() {
    setError(null);
    if (!newLabel.trim()) { setError('Label is required.'); return; }
    const jp = Math.round(parseFloat(newJackpot) * 100);
    if (!jp || jp < 100) { setError('Enter a valid jackpot amount.'); return; }
    setBusy(true);
    const { error: err } = await supabase.from('draws').insert({
      label: newLabel.trim(),
      draw_month: new Date().toISOString().slice(0, 10),
      status: 'open',
      jackpot_cents: jp,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setShowCreate(false);
    setNewLabel('');
    setNewJackpot('1000');
    await load();
  }

  if (loading) return <AdminLayout title="Draws"><div className="flex justify-center py-20"><Spinner className="text-gold-400" /></div></AdminLayout>;

  return (
    <AdminLayout title="Draws">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Prize draws</h2>
          <p className="mt-1 text-ink-400">Create draws and run them to generate winners.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> New draw</button>
      </div>

      {message && <div className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">{message}</div>}
      {error && <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"><AlertCircle size={16} className="mt-0.5" /> {error}</div>}

      {draws.length === 0 ? (
        <EmptyState icon={Gift} title="No draws yet" description="Create your first draw to let members enter." action={<button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> New draw</button>} />
      ) : (
        <div className="space-y-4">
          {draws.map((d) => {
            const drawEntries = entries.filter((e) => e.draw_id === d.id);
            const drawWinners = winners.filter((w) => w.draw_id === d.id);
            return (
              <div key={d.id} className="card p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400"><Trophy size={24} /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-semibold">{d.label}</h3>
                        <span className={d.status === 'open' ? 'badge-good' : d.status === 'completed' ? 'badge-mute' : 'badge-warn'}>{d.status}</span>
                      </div>
                      <p className="text-sm text-ink-400">{formatDate(d.draw_month)} · {formatCurrency(d.jackpot_cents)} jackpot · {drawEntries.length} entries</p>
                    </div>
                  </div>
                  {d.status === 'open' && (
                    <button onClick={() => runDraw(d)} disabled={busy} className="btn-gold">
                      {busy ? <Spinner /> : <><Shuffle size={16} /> Run draw</>}
                    </button>
                  )}
                </div>

                {d.winning_numbers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-ink-500 mb-2">Winning numbers</p>
                    <div className="flex gap-2">
                      {d.winning_numbers.map((n, i) => (
                        <span key={i} className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500/15 text-gold-300 font-display font-bold text-sm">{n}</span>
                      ))}
                    </div>
                    {drawWinners.length > 0 && (
                      <p className="mt-3 text-sm text-brand-300 flex items-center gap-1"><Check size={14} /> {drawWinners.length} winner{drawWinners.length > 1 ? 's' : ''} · {formatCurrency(drawWinners.reduce((a, w) => a + w.prize_cents, 0))} paid out</p>
                    )}
                    {drawWinners.length === 0 && d.status === 'completed' && (
                      <p className="mt-3 text-sm text-gold-400">Jackpot rolled over — no winners this draw.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md card p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Gift size={18} className="text-brand-400" /> New draw</h3>
              <button onClick={() => setShowCreate(false)} className="text-ink-400 hover:text-ink-100"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="label">Label</label><input className="input" placeholder="November 2026 Draw" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} /></div>
              <div><label className="label">Jackpot (USD)</label><input type="number" className="input" placeholder="1000" value={newJackpot} onChange={(e) => setNewJackpot(e.target.value)} /></div>
              <button onClick={createDraw} disabled={busy} className="btn-primary w-full">{busy ? <Spinner /> : 'Create draw'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
