import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Frontend auth should use anon key.
// If these env vars are missing, the app will still render but login will fail.
// Ensure only the public anon key is used in the browser.
// If a service_role key is mistakenly provided, warn and do not create the client.
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  if (SUPABASE_ANON_KEY.toLowerCase().includes('service_role')) {
    console.warn('⚠️ Supabase service role key detected in VITE_SUPABASE_ANON_KEY. This key should not be exposed to the browser.');
  } else {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}
export { supabase };

