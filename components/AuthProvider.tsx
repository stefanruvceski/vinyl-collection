"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";

interface AuthState {
  /** Configured client, or null when Supabase isn't set up (guest-only mode). */
  supabase: SupabaseClient | null;
  /** Signed-in user, or null. */
  user: User | null;
  /** Auth availability + whether the initial session check has completed. */
  enabled: boolean;
  ready: boolean;
}

const AuthContext = createContext<AuthState>({
  supabase: null,
  user: null,
  enabled: false,
  ready: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabase(), []);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const value = useMemo<AuthState>(
    () => ({ supabase, user, enabled: !!supabase, ready }),
    [supabase, user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
