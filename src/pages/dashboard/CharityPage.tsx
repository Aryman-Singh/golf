import { useEffect, useState } from 'react';
import { HeartHandshake, Search, ExternalLink, AlertCircle, Check, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import type { Charity, CharitySelection } from '@/lib/types';
import { EmptyState, Spinner } from '@/components/ui';
import { classNames } from '@/lib/utils';

export function CharityPage() {
  usePage('Charity');
  const { profile } = useAuth();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [selection, setSelection] = useState<CharitySelection | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [pct, setPct] = useState(10);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!profile) return;
    setLoading(true);
    const [c, sel] = await Promise.all([
      supabase.from('charities').select('*').eq('active', true).order('name'),
      supabase.from('charity_selections').select('*, charity:charities(*)').eq('user_id', profile.id).maybeSingle(),
    ]);
    setCharities((c.data as Charity[]) ?? []);
    const s = sel.data as CharitySelection | null;
    setSelection(s);
    if (s) setPct(s.contribution_pct);
    setLoading(false);
  }

  useEffect(() => { load(); }, [profile]);

  async function selectCharity(charityId: string) {
    if (!profile) return;
    setSaving(true);
    setError(null);
    if (selection) {
      const { error: err } = await supabase.from('charity_selections').update({ charity_id: charityId, updated_at: new Date().toISOString() }).eq('id', selection.id);
      if (err) setError(err.message);
    } else {
      const { error: err } = await supabase.from('charity_selections').insert({ user_id: profile.id, charity_id: charityId, contribution_pct: pct });
      if (err) setError(err.message);
    }
    setSaving(false);
    setMessage('Charity updated.');
    setTimeout(() => setMessage(null), 2500);
    await load();
  }

  async function updatePct(value: number) {
    setPct(value);
    if (!selection || !profile) return;
    setSaving(true);
    const { error: err } = await supabase.from('charity_selections').update({ contribution_pct: value, updated_at: new Date().toISOString() }).eq('id', selection.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setMessage('Contribution updated.');
    setTimeout(() => setMessage(null), 2500);
    await load();
  }

  const filtered = charities.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.description.toLowerCase().includes(q.toLowerCase()));

  return (
    <DashboardLayout title="Charity">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Your charity</h2>
        <p className="mt-1 text-ink-400">Choose a cause and decide what share of your membership supports it. Minimum 10%.</p>
      </div>

      {message && <div className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">{message}</div>}
      {error && <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"><AlertCircle size={16} className="mt-0.5" /> {error}</div>}

      {/* Current selection + slider */}
      {selection && (
        <div className="mb-8 card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300"><HeartHandshake size={24} /></div>
              <div>
                <p className="text-xs text-ink-500">Currently supporting</p>
                <h3 className="font-display text-lg font-semibold">{selection.charity?.name}</h3>
                <span className="badge-mute">{selection.charity?.category}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-bold text-brand-300">{pct}%</p>
              <p className="text-xs text-ink-500">of your membership</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs text-ink-400 mb-2">
              <span>10% minimum</span>
              <span>100% maximum</span>
            </div>
            <input
              type="range" min={10} max={100} step={5}
              value={pct}
              onChange={(e) => updatePct(parseInt(e.target.value, 10))}
              disabled={saving}
              className="w-full accent-brand-500"
            />
            <div className="mt-2 flex items-center gap-2 text-sm text-ink-400">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} className="text-brand-400" />}
              {saving ? 'Saving…' : 'Contribution saved automatically.'}
            </div>
          </div>
        </div>
      )}

      {/* Browse */}
      <div className="relative mb-5 max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
        <input className="input pl-10" placeholder="Search charities…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="text-brand-400" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={HeartHandshake} title="No charities found" description="Try a different search." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const selected = selection?.charity_id === c.id;
            return (
              <div key={c.id} className={classNames('card p-6 flex flex-col transition', selected ? 'border-brand-500/40 bg-brand-500/5' : 'card-hover')}>
                <div className="flex items-center justify-between">
                  <span className="badge-mute">{c.category}</span>
                  {selected ? <span className="badge-good"><Check size={12} /> Selected</span> : <HeartHandshake size={18} className="text-brand-400" />}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{c.name}</h3>
                <p className="mt-2 text-sm text-ink-400 flex-1">{c.description}</p>
                <div className="mt-5 flex items-center gap-3">
                  {c.website_url && (
                    <a href={c.website_url} target="_blank" rel="noreferrer" className="text-xs text-ink-400 hover:text-brand-300 flex items-center gap-1">
                      Visit <ExternalLink size={12} />
                    </a>
                  )}
                  <button
                    onClick={() => selectCharity(c.id)}
                    disabled={saving || selected}
                    className={classNames('ml-auto text-sm font-semibold', selected ? 'text-ink-500' : 'text-brand-300 hover:text-brand-200')}
                  >
                    {selected ? 'Supporting' : 'Select →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
