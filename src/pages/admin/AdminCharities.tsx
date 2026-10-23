import { useEffect, useState, type FormEvent } from 'react';
import { HeartHandshake, Plus, Pencil, Trash2, X, AlertCircle, ExternalLink } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import type { Charity } from '@/lib/types';
import { Spinner } from '@/components/ui';

interface EditState {
  id?: string;
  name: string;
  description: string;
  category: string;
  website_url: string;
  active: boolean;
}

const blank: EditState = { name: '', description: '', category: 'General', website_url: '', active: true };

export function AdminCharities() {
  usePage('Admin · Charities');
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('charities').select('*').order('created_at', { ascending: false });
    setCharities((data as Charity[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setEditing({ ...blank }); setShowForm(true); }
  function openEdit(c: Charity) { setEditing({ id: c.id, name: c.name, description: c.description, category: c.category, website_url: c.website_url ?? '', active: c.active }); setShowForm(true); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    if (!editing.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    const payload = {
      name: editing.name.trim(),
      description: editing.description.trim(),
      category: editing.category.trim() || 'General',
      website_url: editing.website_url.trim() || null,
      active: editing.active,
    };
    let res;
    if (editing.id) {
      res = await supabase.from('charities').update(payload).eq('id', editing.id);
    } else {
      res = await supabase.from('charities').insert(payload);
    }
    setSaving(false);
    if (res.error) { setError(res.error.message); return; }
    setShowForm(false);
    setEditing(null);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this charity? Members supporting it will need to reselect.')) return;
    await supabase.from('charities').delete().eq('id', id);
    await load();
  }

  async function toggleActive(c: Charity) {
    await supabase.from('charities').update({ active: !c.active }).eq('id', c.id);
    await load();
  }

  return (
    <AdminLayout title="Charities">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Charity catalog</h2>
          <p className="mt-1 text-ink-400">{charities.length} charities available to members.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add charity</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="text-gold-400" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr className="text-left text-ink-400">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Website</th>
                  <th className="px-5 py-3 font-medium">Active</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {charities.map((c) => (
                  <tr key={c.id} className="border-t border-white/5">
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-ink-100">{c.name}</span>
                      <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">{c.description}</p>
                    </td>
                    <td className="px-5 py-3.5"><span className="badge-mute">{c.category}</span></td>
                    <td className="px-5 py-3.5">
                      {c.website_url ? <a href={c.website_url} target="_blank" rel="noreferrer" className="text-brand-300 hover:text-brand-200 flex items-center gap-1 text-xs"><ExternalLink size={12} /> Visit</a> : <span className="text-ink-500">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleActive(c)} className={c.active ? 'badge-good' : 'badge-bad'}>{c.active ? 'Active' : 'Hidden'}</button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-ink-400 hover:bg-white/5 hover:text-ink-100"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(c.id)} className="rounded-lg p-2 text-ink-400 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg card p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2"><HeartHandshake size={18} className="text-brand-400" /> {editing.id ? 'Edit charity' : 'Add charity'}</h3>
              <button onClick={() => setShowForm(false)} className="text-ink-400 hover:text-ink-100"><X size={20} /></button>
            </div>
            {error && <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"><AlertCircle size={16} className="mt-0.5" /> {error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label">Name</label><input className="input" placeholder="Charity name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><label className="label">Description</label><textarea className="input min-h-[80px]" placeholder="What does this charity do?" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Category</label><input className="input" placeholder="Youth" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
                <div><label className="label">Website URL</label><input className="input" placeholder="https://…" value={editing.website_url} onChange={(e) => setEditing({ ...editing, website_url: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-3 text-sm text-ink-300">
                <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 rounded accent-brand-500" />
                Visible to members
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? <Spinner /> : editing.id ? 'Save changes' : 'Add charity'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
