import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export const supabaseEnabled = Boolean(url && key);

export function getSupabase(): SupabaseClient | null {
  if (!supabaseEnabled) return null;
  if (typeof window === "undefined") return null;
  if (!client) client = createBrowserClient(url!, key!);
  return client;
}
