import { createClient } from '@supabase/supabase-js';
let client;
export function getSupabaseClient() {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) {
    if (key.startsWith('sb_secret_')) throw new Error('Use the Supabase publishable key, never a secret key, in the browser.');
    // The SDK handles the PKCE callback, persistent session and token refresh.
    client = createClient(url, key, {auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
  }
  return client;
}
