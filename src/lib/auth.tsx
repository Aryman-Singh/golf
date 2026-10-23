import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from './types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.error('profile load error', error);
        return;
      }
      setProfile(data as Profile | null);
    } catch {
      // Supabase not reachable — profile stays null
    }
  }

  useEffect(() => {
    let mounted = true;

    // Safety timeout: if getSession() never resolves/rejects (e.g. bad credentials),
    // stop loading so the app renders instead of hanging on a spinner forever.
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 4000);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        clearTimeout(timeout);
        setSession(data.session);
        if (data.session) {
          loadProfile(data.session.user.id).finally(() => mounted && setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          clearTimeout(timeout);
          setLoading(false);
        }
      });

    let sub: ReturnType<typeof supabase.auth.onAuthStateChange> | undefined;
    try {
      sub = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          (async () => {
            await loadProfile(newSession.user.id);
          })();
        } else {
          setProfile(null);
        }
      });
    } catch {
      // Supabase not reachable — app continues without auth
    }

    return () => {
      mounted = false;
      clearTimeout(timeout);
      sub?.data.subscription.unsubscribe();
    };
  }, []);

  async function refreshProfile() {
    if (session) await loadProfile(session.user.id);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
