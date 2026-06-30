const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('Querying table columns & data types...');
  
  // Since we might not have direct SQL access through RPC, we can query information_schema.columns via an RPC or standard API if a custom function exists.
  // Wait, let's try to query public schema columns using postgres function or by running a query if we have an RPC.
  // If we don't have an RPC, let's see if we can perform a query using pg_catalog.
  // Note: we can run queries on any table, but standard tables do not expose system catalog unless there's an RPC.
  // Let's run a test query on deposits table to see what error it returns when we query with a string vs int user_id.
  
  const uuid = '66666666-6666-6666-6666-666666666666';
  const { data: d1, error: e1 } = await supabase.from('deposits').select('*').eq('user_id', 1).limit(1);
  console.log('Query deposits with integer user_id 1:', { success: !e1, error: e1?.message, code: e1?.code });

  const { data: d2, error: e2 } = await supabase.from('deposits').select('*').eq('user_id', uuid).limit(1);
  console.log('Query deposits with UUID user_id:', { success: !e2, error: e2?.message, code: e2?.code });
  
  // Let's query users table too
  const { data: u1, error: ue1 } = await supabase.from('users').select('*').eq('id', 1).limit(1);
  console.log('Query users with integer id 1:', { success: !ue1, error: ue1?.message, code: ue1?.code });

  const { data: u2, error: ue2 } = await supabase.from('users').select('*').eq('id', uuid).limit(1);
  console.log('Query users with UUID id:', { success: !ue2, error: ue2?.message, code: ue2?.code });
}

run();
