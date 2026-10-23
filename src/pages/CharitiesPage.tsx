import { useEffect, useState } from 'react';
import { HeartHandshake, ExternalLink, Search, Loader2 } from 'lucide-react';
import { PublicPage } from '@/components/PublicPage';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import type { Charity } from '@/lib/types';
import { navigate } from '@/lib/router';

export function CharitiesPage() {
  usePage('Charities');
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('charities')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) { console.error(error); }
      setCharities((data as Charity[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const categories = ['All', ...Array.from(new Set(charities.map((c) => c.category)))];
  const filtered = charities.filter((c) => {
    const matchesCat = cat === 'All' || c.category === cat;
    const matchesQ = !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.description.toLowerCase().includes(q.toLowerCase());
    return matchesCat && matchesQ;
  });

  return (
    <PublicPage>
      <section className="container-page py-16">
        <div className="max-w-2xl">
          <span className="badge-good mb-5"><HeartHandshake size={14} /> Giving back</span>
          <h1 className="section-title">Supported charities</h1>
          <p className="mt-4 text-lg text-ink-300">Choose where your contribution goes. Every member picks one charity and sets their contribution share.</p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <input className="input pl-10" placeholder="Search charities…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${cat === c ? 'bg-brand-500 text-ink-950' : 'bg-white/5 text-ink-300 hover:bg-white/10'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-400" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-20 text-center text-ink-400">No charities match your search.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <div key={c.id} className="card-hover p-6 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="badge-mute">{c.category}</span>
                    <HeartHandshake size={18} className="text-brand-400" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{c.name}</h3>
                  <p className="mt-2 text-sm text-ink-400 flex-1">{c.description}</p>
                  <div className="mt-5 flex items-center gap-3">
                    {c.website_url && (
                      <a href={c.website_url} target="_blank" rel="noreferrer" className="text-xs text-ink-400 hover:text-brand-300 flex items-center gap-1">
                        Visit site <ExternalLink size={12} />
                      </a>
                    )}
                    <button onClick={() => navigate('/signup')} className="ml-auto text-xs font-semibold text-brand-300 hover:text-brand-200">
                      Support this →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicPage>
  );
}
