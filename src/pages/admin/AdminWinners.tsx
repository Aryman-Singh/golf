import { useEffect, useState } from 'react';
import { Trophy, Check, X, DollarSign, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import type { Winner, Profile, Draw } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Spinner, EmptyState } from '@/components/ui';

type WinnerWithRel = Winner & { profile?: Profile; draw?: Draw };

export function AdminWinners() {
  usePage('Admin · Winners');
  const [winners, setWinners] = useState<WinnerWithRel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('winners')
      .select('*, profile:profiles(*), draw:draws(*)')
      .order('created_at', { ascending: false });
    setWinners((data as WinnerWithRel[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function setVerification(w: Winner, status: 'approved' | 'rejected') {
    setBusy(w.id);
    setError(null);
    const { error: err } = await supabase
      .from('winners')
      .update({ verification_status: status, reviewed_at: new Date().toISOString() })
      .eq('id', w.id);
    setBusy(null);
    if (err) { setError(err.message); return; }
    setMessage(`Winner ${status}.`);
    setTimeout(() => setMessage(null), 2500);
    await load();
  }

  async function setPayout(w: Winner, status: 'paid' | 'failed') {
    setBusy(w.id);
    setError(null);
    const { error: err } = await supabase.from('winners').update({ payout_status: status }).eq('id', w.id);
    setBusy(null);
    if (err) { setError(err.message); return; }
    setMessage(`Payout marked ${status}.`);
    setTimeout(() => setMessage(null), 2500);
    await load();
  }

  const filtered = winners.filter((w) => filter === 'all' || w.verification_status === filter);
  const pending = winners.filter((w) => w.verification_status === 'pending').length;

  return (
    <AdminLayout title="Winners">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Winner verification</h2>
        <p className="mt-1 text-ink-400">Review proof, approve winners, and mark payouts.</p>
      </div>

      {message && <div className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">{message}</div>}
      {error && <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"><AlertCircle size={16} className="mt-0.5" /> {error}</div>}

      <div className="mb-5 flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${filter === f ? 'bg-brand-500 text-ink-950' : 'bg-white/5 text-ink-300 hover:bg-white/10'}`}>
            {f} {f === 'pending' && pending > 0 && `(${pending})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="text-gold-400" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Trophy} title="No winners" description="Winners will appear here after a draw is run." />
      ) : (
        <div className="space-y-4">
          {filtered.map((w) => (
            <div key={w.id} className="card p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400"><Trophy size={24} /></div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{w.profile?.display_name ?? 'Unknown user'}</h3>
                    <p className="text-sm text-ink-400">{w.draw?.label ?? 'Draw'} · {formatDateTime(w.created_at)}</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <span className="text-sm"><span className="text-ink-500">Matches:</span> <span className="font-semibold text-ink-200">{w.matches}</span></span>
                      <span className="text-sm"><span className="text-ink-500">Prize:</span> <span className="font-semibold text-gold-400">{formatCurrency(w.prize_cents)}</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 items-start lg:items-end">
                  <span className={w.verification_status === 'approved' ? 'badge-good' : w.verification_status === 'rejected' ? 'badge-bad' : 'badge-warn'}>
                    {w.verification_status === 'approved' ? <Check size={12} /> : w.verification_status === 'rejected' ? <X size={12} /> : <Clock size={12} />}
                    {w.verification_status}
                  </span>
                  <span className={w.payout_status === 'paid' ? 'badge-good' : w.payout_status === 'failed' ? 'badge-bad' : 'badge-mute'}>
                    Payout: {w.payout_status}
                  </span>
                </div>
              </div>

              {/* Proof */}
              <div className="mt-4 pt-4 border-t border-white/5">
                {w.proof_url ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-ink-300 flex items-center gap-1.5"><Check size={14} className="text-brand-400" /> Proof submitted</span>
                    <a href={w.proof_url} target="_blank" rel="noreferrer" className="text-xs text-brand-300 hover:text-brand-200 flex items-center gap-1"><ExternalLink size={12} /> View proof</a>
                  </div>
                ) : (
                  <p className="text-sm text-ink-500 flex items-center gap-1.5"><Clock size={14} /> No proof uploaded yet.</p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {w.verification_status !== 'approved' && (
                  <button onClick={() => setVerification(w, 'approved')} disabled={busy === w.id} className="btn-primary text-sm">
                    {busy === w.id ? <Spinner /> : <><Check size={14} /> Approve</>}
                  </button>
                )}
                {w.verification_status !== 'rejected' && (
                  <button onClick={() => setVerification(w, 'rejected')} disabled={busy === w.id} className="btn-ghost text-sm">
                    <X size={14} /> Reject
                  </button>
                )}
                {w.verification_status === 'approved' && w.payout_status !== 'paid' && (
                  <button onClick={() => setPayout(w, 'paid')} disabled={busy === w.id} className="btn-gold text-sm">
                    <DollarSign size={14} /> Mark paid
                  </button>
                )}
                {w.verification_status === 'approved' && w.payout_status === 'paid' && (
                  <span className="text-sm text-brand-300 flex items-center gap-1.5"><Check size={14} /> Fully resolved</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
