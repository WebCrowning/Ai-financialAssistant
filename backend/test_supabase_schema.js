const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('Querying Supabase database schema...');
  
  const tables = [
    'users', 'user_activities', 'expenses', 'budgets', 'goals', 'income',
    'chatbot_conversations', 'transactions', 'virtual_cards', 'deposits',
    'store_products', 'orders', 'local_jobs'
  ];
  
  for (const table of tables) {
    const { data: tData, error: tErr } = await supabase.from(table).select('*').limit(1);
    if (tErr) {
      console.log(`❌ Table "${table}": Error / Does not exist - ${tErr.message} (code: ${tErr.code})`);
    } else {
      console.log(`✅ Table "${table}": Exists! Columns:`, tData.length > 0 ? Object.keys(tData[0]) : '(empty table)');
    }
  }
}

run();
