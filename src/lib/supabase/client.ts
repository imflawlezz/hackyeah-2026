import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabase = Boolean(url && anonKey);

export function createClient(): SupabaseClient | null {
  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient(url, anonKey);
}
