import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY Supabase client holding the service-role key. It can read/write any
// row and manage auth users, so it must NEVER be imported from a client
// component. The key intentionally has no NEXT_PUBLIC_ prefix, so Next keeps it
// out of the browser bundle. Only Route Handlers / server code should call this.
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
