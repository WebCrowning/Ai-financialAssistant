const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Expect these env vars to be set:
// SUPABASE_URL
// SUPABASE_KEY (anon/public) - optional
// SUPABASE_SERVICE_ROLE_KEY - recommended for server-side access (bypasses RLS)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.warn('[supabaseClient] Missing SUPABASE_URL. Supabase disabled.');
}

if (!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_KEY) {
  console.warn('[supabaseClient] Missing SUPABASE_SERVICE_ROLE_KEY and SUPABASE_KEY. Supabase disabled.');
}

// Prefer service role for server-to-server operations.
const SUPABASE_EFFECTIVE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY;

const supabase = SUPABASE_URL && SUPABASE_EFFECTIVE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_EFFECTIVE_KEY, {
      auth: { persistSession: false },
      global: {
        headers: { 'x-client-info': 'finvision-server' }
      }
    })
  : null;

module.exports = { supabase };

