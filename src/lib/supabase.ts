import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// The anon key is public by design (it ships to every browser); data is protected by row-level security.
// Env vars override these defaults, so forks can point at their own project.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uvfspczbofatymerjcce.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZnNwY3pib2ZhdHltZXJqY2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MzM5NjAsImV4cCI6MjEwNjAwOTk2MH0.coQGGBcRBsN7oCcdF8V9ecnYLTLRMtFo9WGwpRXmjQs";

let client: SupabaseClient | null = null;

export const supabaseEnabled = process.env.NEXT_PUBLIC_DEMO_ONLY !== "1";
export const supabaseUrl = url;
export const supabaseKey = key;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseEnabled) return null;
  if (typeof window === "undefined") return null;
  if (!client) client = createBrowserClient(url, key);
  return client;
}

/** Asks Supabase which OAuth providers are switched on, so the UI never needs a config flag. */
let providersPromise: Promise<Record<string, boolean>> | null = null;
export function enabledProviders(): Promise<Record<string, boolean>> {
  if (!supabaseEnabled) return Promise.resolve({});
  if (!providersPromise)
    providersPromise = fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
      .then((r) => (r.ok ? r.json() : {}))
      .then((j: { external?: Record<string, boolean> }) => (j && j.external) || {})
      .catch(() => ({}));
  return providersPromise;
}
