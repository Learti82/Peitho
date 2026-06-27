"use client";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * Browser Supabase client authenticated with the current Clerk session.
 * Use inside client components. The Clerk token is injected on every request
 * so Supabase RLS sees the Clerk user id via `auth.jwt()->>'sub'`.
 */
export function useSupabaseClient(): SupabaseClient {
  const { session } = useSession();

  return useMemo(() => {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        async accessToken() {
          return (await session?.getToken()) ?? null;
        },
      }
    );
    // Recreate when the session identity changes
  }, [session?.id]);
}
