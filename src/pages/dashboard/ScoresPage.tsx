import { useEffect, useState, type FormEvent } from 'react';
import { Target, Plus, Pencil, Trash2, X, Calendar, Flag, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import type { GolfScore } from '@/lib/types';
import { formatDate, scoreDiff, classNames } from '@/lib/utils';
import { EmptyState, Spinner } from '@/components/ui';

interface EditState {
  id?: string;
  course_name: string;
  score: string;
  par: string;
  date_played: string;
  notes: string;
}

const blank: EditState = { course_name: '', score: '', par: '72', date_played: new Date().toISOString().slice(0, 10), notes: '' };

export function ScoresPage() {
  usePage('Golf Scores');
  const { profile } = useAuth();
  const [scores, setScores] = useState<GolfScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('user_id', profile.id)
      .order('date_played', { ascending: false })
      .order('created_at', { ascending: false });
    setScores((data as GolfScore[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [profile]);

  function openAdd() { setEditing({ ...blank }); setShowForm(true); }
  function openEdit(s: GolfScore) {
    setEditing({ id: s.id, course_name: s.course_name, score: String(s.score), par: String(s.par), date_played: s.date_played, notes: s.notes });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing || !profile) return;
    setError(null);
    const scoreNum = parseInt(editing.score, 10);
    const parNum = parseInt(editing.par, 10);
    if (!editing.course_name.trim()) return setError('Course name is required.');
    if (!scoreNum || scoreNum < 1 || scoreNum > 400) return setError('Enter a valid score between 1 and 400.');
    if (!parNum || parNum < 1 || parNum > 200) return setError('Enter a valid par between 1 and 200.');

    setSaving(true);
    const payload = {
      user_id: profile.id,
      course_name: editing.course_name.trim(),
      score: scoreNum,
      par: parNum,
      date_played: editing.date_played,
      notes: editing.notes.trim(),
    };
    let res;
    if (editing.id) {
      res = await supabase.from('golf_scores').update(payload).eq('id', editing.id);
    } else {
      res = await supabase.from('golf_scores').insert(payload);
    }
    setSaving(false);
    if (res.error) { setError(res.error.message); return; }
    setShowForm(false);
    setEditing(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this score?')) return;
    await supabase.from('golf_scores').delete().eq('id', id);
    await load();
  }

  const latestFive = scores.slice(0, 5);
  const olderCount = Math.max(0, scores.length - 5);

  return (
    <DashboardLayout title="Golf Scores">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Score tracker</h2>
          <p className="mt-1 text-ink-400">Your five most recent scores drive your trend chart.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add score</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="text-brand-400" /></div>
      ) : scores.length === 0 ? (
        <EmptyState icon={Target} title="No scores yet" description="Add your first round to start tracking your performance." action={<button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add your first score</button>} />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr className="text-left text-ink-400">
                    <th className="px-5 py-3 font-medium">Course</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Score</th>
                    <th className="px-5 py-3 font-medium">Par</th>
                    <th className="px-5 py-3 font-medium">Diff</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((s, i) => {
                    const diff = scoreDiff(s.score, s.par);
                    return (
                      <tr key={s.id} className={classNames('border-t border-white/5', i >= 5 && 'opacity-50')}>
                        <td className="px-5 py-3.5">
                          <span className="font-medium text-ink-100">{s.course_name}</span>
                          {s.notes && <p className="text-xs text-ink-500 mt-0.5">{s.notes}</p>}
                        </td>
                        <td className="px-5 py-3.5 text-ink-300">{formatDate(s.date_played)}</td>
                        <td className="px-5 py-3.5 font-display font-bold text-ink-100">{s.score}</td>
                        <td className="px-5 py-3.5 text-ink-400">{s.par}</td>
                        <td className="px-5 py-3.5">
                          <span className={diff.tone === 'good' ? 'badge-good' : diff.tone === 'ok' ? 'badge-mute' : 'badge-warn'}>{diff.label}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-ink-400 hover:bg-white/5 hover:text-ink-100"><Pencil size={16} /></button>
                            <button onClick={() => handleDelete(s.id)} className="rounded-lg p-2 text-ink-400 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {olderCount > 0 && (
            <p className="mt-4 text-xs text-ink-500">{olderCount} older score{olderCount > 1 ? 's' : ''} hidden — only your latest 5 affect your trend.</p>
          )}
        </>
      )}

      {/* Modal form */}
      {showForm && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg card p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Target size={18} className="text-brand-400" /> {editing.id ? 'Edit score' : 'Add score'}</h3>
              <button onClick={() => setShowForm(false)} className="text-ink-400 hover:text-ink-100"><X size={20} /></button>
            </div>
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Course name</label>
                <div className="relative">
                  <Flag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                  <input className="input pl-10" placeholder="Pebble Beach" value={editing.course_name} onChange={(e) => setEditing({ ...editing, course_name: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Your score</label>
                  <input type="number" min={1} max={400} className="input" placeholder="78" value={editing.score} onChange={(e) => setEditing({ ...editing, score: e.target.value })} />
                </div>
                <div>
                  <label className="label">Par</label>
                  <input type="number" min={1} max={200} className="input" placeholder="72" value={editing.par} onChange={(e) => setEditing({ ...editing, par: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Date played</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
                  <input type="date" className="input pl-10" value={editing.date_played} onChange={(e) => setEditing({ ...editing, date_played: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea className="input min-h-[80px]" placeholder="Weather, conditions, highlights…" value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? <Spinner /> : editing.id ? 'Save changes' : 'Add score'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
