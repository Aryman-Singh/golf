import { useEffect, useState } from 'react';
import { Trophy, Upload, AlertCircle, Check, X, Clock, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import type { Winner } from '@/lib/types';
import { formatCurrency, formatDateTime, classNames } from '@/lib/utils';
import { EmptyState, Spinner } from '@/components/ui';

export function WinningsPage() {
  usePage('My Winnings');
  const { profile } = useAuth();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('winners')
      .select('*, draw:draws(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setWinners((data as Winner[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [profile]);

  async function handleUpload(file: File, winnerId: string) {
    if (!profile) return;
    setUploading(winnerId);
    setError(null);
    try {
      const ext = file.name.split('.').pop();
      const path = `${profile.id}/${winnerId}.${ext}`;
      const { error: upErr } = await supabase.storage.from('winner-proof').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('winner-proof').getPublicUrl(path);
      const { error: dbErr } = await supabase.from('winners').update({ proof_url: pub.publicUrl }).eq('id', winnerId);
      if (dbErr) throw dbErr;
      setMessage('Proof uploaded. Awaiting admin review.');
      setTimeout(() => setMessage(null), 3000);
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      setError(msg);
    }
    setUploading(null);
  }

  if (loading) return <DashboardLayout title="My Winnings"><div className="flex justify-center py-20"><Spinner className="text-brand-400" /></div></DashboardLayout>;

  const totalWon = winners.reduce((a, w) => a + w.prize_cents, 0);
  const approved = winners.filter((w) => w.verification_status === 'approved').length;

  return (
    <DashboardLayout title="My Winnings">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Your winnings</h2>
        <p className="mt-1 text-ink-400">Track wins, upload proof, and follow your payout status.</p>
      </div>

      {message && <div className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">{message}</div>}
      {error && <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"><AlertCircle size={16} className="mt-0.5" /> {error}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-ink-400">Total wins</p><p className="mt-2 font-display text-2xl font-bold text-gold-400">{formatCurrency(totalWon)}</p></div>
        <div className="card p-5"><p className="text-sm text-ink-400">Approved</p><p className="mt-2 font-display text-2xl font-bold text-brand-300">{approved}</p></div>
        <div className="card p-5"><p className="text-sm text-ink-400">Total entries won</p><p className="mt-2 font-display text-2xl font-bold text-ink-100">{winners.length}</p></div>
      </div>

      {winners.length === 0 ? (
        <EmptyState icon={Trophy} title="No wins yet" description="Keep your numbers in play every month — your wins will show here." />
      ) : (
        <div className="space-y-4">
          {winners.map((w) => (
            <div key={w.id} className="card p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400"><Trophy size={24} /></div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{w.draw?.label ?? 'Draw'}</h3>
                    <p className="text-sm text-ink-400">{formatDateTime(w.created_at)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-ink-500">Matches</p>
                    <p className="font-display text-xl font-bold text-ink-100">{w.matches}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-ink-500">Prize</p>
                    <p className="font-display text-xl font-bold text-gold-400">{formatCurrency(w.prize_cents)}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className={classNames(
                      w.verification_status === 'approved' ? 'badge-good' : w.verification_status === 'rejected' ? 'badge-bad' : 'badge-warn'
                    )}>
                      {w.verification_status === 'approved' ? <Check size={12} /> : w.verification_status === 'rejected' ? <X size={12} /> : <Clock size={12} />}
                      {w.verification_status}
                    </span>
                    <span className={w.payout_status === 'paid' ? 'badge-good' : w.payout_status === 'failed' ? 'badge-bad' : 'badge-mute'}>
                      Payout: {w.payout_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Proof section */}
              <div className="mt-5 pt-5 border-t border-white/5">
                {w.proof_url ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-ink-300">
                      <Check size={16} className="text-brand-400" /> Proof uploaded
                      <a href={w.proof_url} target="_blank" rel="noreferrer" className="ml-2 text-brand-300 hover:text-brand-200 flex items-center gap-1 text-xs">View <ExternalLink size={12} /></a>
                    </div>
                    {w.verification_status !== 'approved' && (
                      <label className="btn-ghost text-sm cursor-pointer">
                        <Upload size={14} /> Replace
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, w.id); }} />
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-sm text-ink-400">Upload your scorecard or round screenshot to verify your win.</p>
                    <label className="btn-primary text-sm cursor-pointer">
                      {uploading === w.id ? <Spinner /> : <><Upload size={14} /> Upload proof</>}
                      <input type="file" accept="image/*,application/pdf" className="hidden" disabled={uploading === w.id} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, w.id); }} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
