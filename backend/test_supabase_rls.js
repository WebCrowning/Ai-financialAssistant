const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('Querying RLS policies from Supabase...');
  
  // Try querying pg_policies via standard supabase query (if we have access to a view or function)
  // Since pg_policies is a system table, if we don't have direct SQL RPC, we might not be able to query it directly.
  // Let's check if RLS is active by trying to select from information_schema or similar.
  // Actually, we can run a simple RPC if we want, or try to select pg_policies. Let's see if we can do that.
  // Wait, let's try a direct query on pg_policies using supabase.from() or checking if it errors.
  
  const { data, error } = await supabase.from('pg_policies').select('*');
  if (error) {
    console.log('Could not query pg_policies directly (this is expected for standard API keys).');
    
    // Let's test if we can fetch data using anon key vs service role key.
    // Wait! Let's check if there's a custom RPC or let's try to fetch something using a dummy client with anon key.
    console.log('Testing access to tables...');
    // We will initialize a client with the front-end anon key (which is in the root .env or from our backend process.env.SUPABASE_KEY if it's the anon one)
    // Wait, let's just output if we get errors.
  } else {
    console.log('Policies:', data);
  }
}

run();
