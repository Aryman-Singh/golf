import { useEffect, useState } from 'react';
import { Users, Search, ShieldCheck, Mail, Calendar } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { usePage } from '@/lib/usePage';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Spinner } from '@/components/ui';

export function AdminUsers() {
  usePage('Admin · Users');
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers((data as Profile[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = users.filter((u) => !q || u.email.toLowerCase().includes(q.toLowerCase()) || u.display_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminLayout title="Users">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">User management</h2>
        <p className="mt-1 text-ink-400">{users.length} registered members.</p>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
        <input className="input pl-10" placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
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
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-white/5">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15 text-brand-300 font-semibold text-xs">{u.display_name.slice(0, 1).toUpperCase()}</div>
                        <span className="font-medium text-ink-100">{u.display_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-300 flex items-center gap-2"><Mail size={14} className="text-ink-500" /> {u.email}</td>
                    <td className="px-5 py-3.5">
                      {u.role === 'admin' ? <span className="badge-warn"><ShieldCheck size={12} /> Admin</span> : <span className="badge-mute">User</span>}
                    </td>
                    <td className="px-5 py-3.5 text-ink-400 flex items-center gap-2"><Calendar size={14} className="text-ink-500" /> {formatDate(u.created_at)}</td>
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
