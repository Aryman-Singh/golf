import { useAuth } from '@/lib/auth';
import { useRoute, navigate } from '@/lib/router';
import { PageLoader } from '@/components/ui';
import { useEffect } from 'react';

import { HomePage } from '@/pages/HomePage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { CharitiesPage } from '@/pages/CharitiesPage';
import { PricingPage } from '@/pages/PricingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';

import { DashboardOverview } from '@/pages/dashboard/OverviewPage';
import { ScoresPage } from '@/pages/dashboard/ScoresPage';
import { CharityPage } from '@/pages/dashboard/CharityPage';
import { SubscriptionPage } from '@/pages/dashboard/SubscriptionPage';
import { DrawPage } from '@/pages/dashboard/DrawPage';
import { WinningsPage } from '@/pages/dashboard/WinningsPage';

import { AdminAnalytics } from '@/pages/admin/AnalyticsPage';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { AdminSubscriptions } from '@/pages/admin/AdminSubscriptions';
import { AdminCharities } from '@/pages/admin/AdminCharities';
import { AdminDraws } from '@/pages/admin/AdminDraws';
import { AdminWinners } from '@/pages/admin/AdminWinners';

function App() {
  const { session, loading } = useAuth();
  const route = useRoute();
  const path = route.path;

  // Redirect authed users away from login/signup
  useEffect(() => {
    if (session && (path === '/login' || path === '/signup')) {
      navigate('/dashboard');
    }
    if (!session && !loading && path.startsWith('/dashboard')) {
      navigate('/login');
    }
    if (!session && !loading && path.startsWith('/admin')) {
      navigate('/login');
    }
  }, [session, loading, path]);

  if (loading) return <PageLoader />;

  // Public routes
  if (path === '/') return <HomePage />;
  if (path === '/how-it-works') return <HowItWorksPage />;
  if (path === '/charities') return <CharitiesPage />;
  if (path === '/pricing') return <PricingPage />;
  if (path === '/login') return <LoginPage />;
  if (path === '/signup') return <SignupPage />;

  // Dashboard routes (require auth)
  if (path === '/dashboard') return session ? <DashboardOverview /> : <LoginPage />;
  if (path === '/dashboard/scores') return session ? <ScoresPage /> : <LoginPage />;
  if (path === '/dashboard/charity') return session ? <CharityPage /> : <LoginPage />;
  if (path === '/dashboard/subscription') return session ? <SubscriptionPage /> : <LoginPage />;
  if (path === '/dashboard/draw') return session ? <DrawPage /> : <LoginPage />;
  if (path === '/dashboard/winnings') return session ? <WinningsPage /> : <LoginPage />;

  // Admin routes (require auth + admin role)
  if (path === '/admin') return session ? <AdminAnalytics /> : <LoginPage />;
  if (path === '/admin/users') return session ? <AdminUsers /> : <LoginPage />;
  if (path === '/admin/subscriptions') return session ? <AdminSubscriptions /> : <LoginPage />;
  if (path === '/admin/charities') return session ? <AdminCharities /> : <LoginPage />;
  if (path === '/admin/draws') return session ? <AdminDraws /> : <LoginPage />;
  if (path === '/admin/winners') return session ? <AdminWinners /> : <LoginPage />;

  // 404
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 text-center px-6">
      <div>
        <p className="font-display text-6xl font-bold text-brand-400">404</p>
        <p className="mt-4 text-ink-400">Page not found.</p>
        <button onClick={() => navigate('/')} className="mt-6 btn-primary">Back home</button>
      </div>
    </div>
  );
}

export default App;
