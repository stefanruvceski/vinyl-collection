"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client (singleton). Auth is entirely client-side (email OTP),
 * so a plain browser client with a persisted session is enough — no SSR cookies
 * or middleware needed. The collection UI is client-rendered too.
 *
 * Returns `null` when the project isn't configured (no env vars). The whole app
 * then runs in guest mode on localStorage, so nothing breaks before Supabase is
 * set up (and in environments where it isn't reachable).
 */
let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  cached =
    url && anonKey
      ? createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
          },
        })
      : null;

  return cached;
}

/** True when Supabase env is present, i.e. auth/sync is available. */
export const isSupabaseConfigured = (): boolean => getSupabase() !== null;
