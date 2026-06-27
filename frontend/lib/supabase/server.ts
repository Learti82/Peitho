import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * Server-side Supabase client authenticated with the current Clerk session.
 * The Clerk session token is forwarded to Supabase, so Row Level Security
 * policies that read `auth.jwt()->>'sub'` see the Clerk user id.
 */
export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return (await (await auth()).getToken()) ?? null;
      },
    }
  );
}
