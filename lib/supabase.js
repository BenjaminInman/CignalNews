import { createClient } from "@supabase/supabase-js";

// Returns a service-role Supabase client, or null if the env vars aren't set yet.
// Callers must handle null so the app builds/runs before the DB is configured.
let _client = null;
export function getSupabase() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export function isConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}
