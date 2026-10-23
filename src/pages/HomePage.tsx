import { Link as LinkIcon, Trophy, HeartHandshake, BarChart3, Sparkles, ArrowRight, PlayCircle, Target, Gift, Users } from 'lucide-react';
import { PublicPage } from '@/components/PublicPage';
import { usePage } from '@/lib/usePage';
import { navigate } from '@/lib/router';

const heroImg = 'https://images.pexels.com/photos/19334920/pexels-photo-19334920.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export function HomePage() {
  usePage('Home');

  return (
    <PublicPage>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Golf course at sunset" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-950/85 to-brand-950/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(30,178,95,0.18),transparent_55%)]" />
        </div>

        <div className="container-page relative py-24 sm:py-32">
          <div className="max-w-3xl animate-fade-up">
            <span className="badge-good mb-6">
              <Sparkles size={14} /> Premium golf membership
            </span>
            <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
              Play better. <span className="gradient-text">Give back.</span><br /> Win big every month.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-300">
              Fairway tracks your golf performance, channels a share of your membership to charity,
              and enters you into monthly prize draws with a growing jackpot.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => navigate('/signup')} className="btn-primary">
                Start playing free <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate('/how-it-works')} className="btn-ghost">
                <PlayCircle size={16} /> See how it works
              </button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg">
              {[
                { v: '5+', l: 'Supported charities' },
                { v: '$1K+', l: 'Monthly jackpot' },
                { v: '10%', l: 'Min. to charity' },
              ].map((s) => (
                <div key={s.l} className="card p-4 text-center">
                  <p className="font-display text-2xl font-bold text-brand-300">{s.v}</p>
                  <p className="mt-1 text-xs text-ink-400">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature pillars */}
      <section className="container-page py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="section-title">One membership, three wins</h2>
          <p className="mt-4 text-ink-400">Everything a modern golfer needs — performance insight, meaningful impact, and a real shot at a monthly prize.</p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { icon: BarChart3, title: 'Performance tracking', body: 'Log rounds, see your trends, and keep your five most recent scores front and centre.', tone: 'brand' },
            { icon: HeartHandshake, title: 'Charity contributions', body: 'Choose a cause you care about and decide what percentage of your dues go to it.', tone: 'gold' },
            { icon: Trophy, title: 'Monthly prize draws', body: 'Pick five numbers each month. Match 3, 4, or 5 to win a share of the rollover jackpot.', tone: 'brand' },
          ].map((f) => (
            <div key={f.title} className="card-hover p-7">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.tone === 'gold' ? 'bg-gold-500/10 text-gold-400' : 'bg-brand-500/10 text-brand-300'}`}>
                <f.icon size={24} />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works strip */}
      <section className="border-y border-white/5 bg-ink-900/40">
        <div className="container-page py-20">
          <div className="grid gap-10 md:grid-cols-2 items-center">
            <div>
              <h2 className="section-title">How a round becomes impact</h2>
              <p className="mt-4 text-ink-400">From your first scorecard to your first payout — here's the journey in four steps.</p>
              <ol className="mt-8 space-y-5">
                {[
                  { icon: Target, t: 'Track your rounds', d: 'Add scores from any course. We keep your five latest and chart your form.' },
                  { icon: HeartHandshake, t: 'Pick your charity', d: 'Browse vetted causes and set your contribution share — 10% minimum.' },
                  { icon: Gift, t: 'Enter the draw', d: 'Choose five numbers each month. Every active member is in the running.' },
                  { icon: Trophy, t: 'Win & verify', d: 'Match numbers to win. Upload your score proof for admin verification and payout.' },
                ].map((s, i) => (
                  <li key={s.t} className="flex gap-4">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300 font-display font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink-100 flex items-center gap-2"><s.icon size={16} className="text-brand-400" /> {s.t}</h3>
                      <p className="mt-1 text-sm text-ink-400">{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <button onClick={() => navigate('/how-it-works')} className="mt-8 btn-outline">
                Learn more <ArrowRight size={16} />
              </button>
            </div>
            <div className="relative">
              <div className="card overflow-hidden p-0">
                <img src="https://images.pexels.com/photos/6572955/pexels-photo-6572955.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Golf ball on tee" className="h-80 w-full object-cover" />
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-400">Latest 5 scores</span>
                    <span className="badge-good"><Target size={12} /> +2.4 trend</span>
                  </div>
                  <div className="mt-4 flex items-end gap-2 h-24">
                    {[78, 82, 80, 76, 74].map((s, i) => (
                      <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400" style={{ height: `${(s - 70) * 8}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Charity spotlight */}
      <section className="container-page py-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="section-title">Charities we support</h2>
            <p className="mt-3 text-ink-400 max-w-xl">Every member directs a share of their subscription to a vetted cause. Browse the full list and choose yours.</p>
          </div>
          <button onClick={() => navigate('/charities')} className="btn-outline">Browse charities <ArrowRight size={16} /></button>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { n: 'The First Tee', c: 'Youth', d: 'Building character through junior golf programs.' },
            { n: 'Veterans Golf Association', c: 'Veterans', d: 'Golf therapy and community for service veterans.' },
            { n: 'Make-A-Wish Golf', c: 'Health', d: 'Granting life-changing wishes through golf events.' },
          ].map((ch) => (
            <div key={ch.n} className="card-hover p-6">
              <div className="flex items-center justify-between">
                <span className="badge-mute">{ch.c}</span>
                <HeartHandshake size={18} className="text-brand-400" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{ch.n}</h3>
              <p className="mt-1 text-sm text-ink-400">{ch.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-700/40 via-ink-900 to-ink-950 p-10 sm:p-16 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,178,95,0.15),transparent_60%)]" />
          <div className="relative">
            <Users size={32} className="mx-auto text-brand-300" />
            <h2 className="mt-5 font-display text-3xl sm:text-4xl font-bold">Join the fairway community</h2>
            <p className="mt-4 text-ink-300 max-w-lg mx-auto">Track your game, back a cause, and get a shot at the monthly jackpot. Membership starts at $9.99/month.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate('/signup')} className="btn-gold">Create your account <ArrowRight size={16} /></button>
              <button onClick={() => navigate('/pricing')} className="btn-ghost">View plans</button>
            </div>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
