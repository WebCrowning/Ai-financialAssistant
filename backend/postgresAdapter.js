// Complete Supabase adapter for FinVision backend.
// Translates all MySQL query patterns used by server.js into Supabase JS client calls.
// Return format mirrors mysql2/promise: SELECT → [rows], INSERT → [{insertId}], UPDATE/DELETE → [{affectedRows}]

const { supabase } = require('./supabaseClient');

function ensureSupabase() {
  if (!supabase) throw new Error('Supabase client not initialized. Set SUPABASE_URL and SUPABASE_KEY in .env');
}

// ─── Generic helpers ────────────────────────────────────────────────────────

function norm(text) {
  return String(text).trim().replace(/\s+/g, ' ').toLowerCase();
}

function compact(text) {
  // Remove newlines, extra spaces
  return norm(text).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

async function sbInsert(table, payload) {
  ensureSupabase();
  const { data, error } = await supabase.from(table).insert(payload).select('id').single();
  if (error) throw error;
  return [{ insertId: data?.id || 0, affectedRows: 1 }];
}

async function sbInsertNoReturn(table, payload) {
  ensureSupabase();
  const { error } = await supabase.from(table).insert(payload);
  if (error) throw error;
  return [{ insertId: 0, affectedRows: 1 }];
}

async function sbSelect(table, columns, filters = {}, opts = {}) {
  ensureSupabase();
  let q = supabase.from(table).select(columns);
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null) continue;
    if (opts.nullFilter && opts.nullFilter[k]) { q = q.is(k, null); continue; }
    q = q.eq(k, v);
  }
  if (opts.order) {
    for (const { col, asc } of opts.order) {
      q = q.order(col, { ascending: asc !== false ? true : false });
    }
  }
  if (opts.limit) q = q.limit(opts.limit);
  if (opts.gte) for (const [k, v] of Object.entries(opts.gte)) q = q.gte(k, v);
  if (opts.lt) for (const [k, v] of Object.entries(opts.lt)) q = q.lt(k, v);
  const { data, error } = await q;
  if (error) throw error;
  return [Array.isArray(data) ? data : []];
}

async function sbUpdate(table, payload, filters = {}) {
  ensureSupabase();
  let q = supabase.from(table).update(payload);
  for (const [k, v] of Object.entries(filters)) {
    if (v === null || v === undefined) { q = q.is(k, null); continue; }
    q = q.eq(k, v);
  }
  const { error } = await q;
  if (error) throw error;
  return [{ affectedRows: 1 }];
}

async function sbDelete(table, filters = {}) {
  ensureSupabase();
  let q = supabase.from(table).delete();
  for (const [k, v] of Object.entries(filters)) {
    q = q.eq(k, v);
  }
  const { error } = await q;
  if (error) throw error;
  return [{ affectedRows: 1 }];
}

async function sbCount(table, filters = {}) {
  ensureSupabase();
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  for (const [k, v] of Object.entries(filters)) {
    if (typeof v === 'number') q = q.eq(k, v);
    else q = q.eq(k, v);
  }
  const { count, error } = await q;
  if (error) throw error;
  return [[{ count: count || 0 }]];
}

// ─── Main query dispatcher ────────────────────────────────────────────────────

const query = async (text, params = []) => {
  ensureSupabase();
  const q = compact(text);

  // ═══════════════════════════════════════
  //  USER_ACTIVITIES
  // ═══════════════════════════════════════

  if (q === 'insert into user_activities (user_id, action, details) values (?, ?, ?)') {
    const [user_id, action, details] = params;
    return sbInsert('user_activities', { user_id, action, details });
  }

  // Multi-insert activities (seeding)
  if (q.startsWith('insert into user_activities (user_id, action, details) values')) {
    const rows = [];
    for (let i = 0; i < params.length; i += 3) {
      rows.push({ user_id: params[i], action: params[i + 1], details: params[i + 2] });
    }
    const { error } = await supabase.from('user_activities').insert(rows);
    if (error) throw error;
    return [{ insertId: 0, affectedRows: rows.length }];
  }

  if (q === 'select count(*) as count from user_activities') {
    return sbCount('user_activities');
  }

  if (q.includes('select ua.*, u.email as user_email') && q.includes('user_activities')) {
    // JOIN: user_activities + users
    const { data: activities, error: aErr } = await supabase
      .from('user_activities')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    if (aErr) throw aErr;

    const userIds = [...new Set((activities || []).map(a => a.user_id))];
    let userMap = {};
    if (userIds.length > 0) {
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id,email')
        .in('id', userIds);
      if (uErr) throw uErr;
      (users || []).forEach(u => { userMap[u.id] = u.email; });
    }

    const merged = (activities || []).map(a => ({
      ...a,
      user_email: userMap[a.user_id] || null
    }));
    return [merged];
  }

  if (q === 'select action, count(*) as count from user_activities group by action order by count desc limit 6') {
    const { data, error } = await supabase.from('user_activities').select('action');
    if (error) throw error;
    const counts = {};
    (data || []).forEach(r => { counts[r.action] = (counts[r.action] || 0) + 1; });
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([action, count]) => ({ action, count }));
    return [sorted];
  }

  // ═══════════════════════════════════════
  //  USERS
  // ═══════════════════════════════════════

  if (q === 'select * from users where email = ?') {
    const [email] = params;
    const { data, error } = await supabase.from('users').select('*').eq('email', email).limit(1);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'insert into users (email, password, role, monthly_income) values (?, ?, ?, ?)') {
    const [email, password, role, monthly_income] = params;
    return sbInsert('users', { email, password, role, monthly_income });
  }

  if (q === 'select id, email, role, monthly_income, guardian_mode, display_name, profile_image from users where id = ?') {
    const [id] = params;
    const { data, error } = await supabase
      .from('users')
      .select('id,email,role,monthly_income,guardian_mode,display_name,profile_image')
      .eq('id', id)
      .limit(1);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select monthly_income, guardian_mode from users where id = ?') {
    const [id] = params;
    const { data, error } = await supabase
      .from('users')
      .select('monthly_income,guardian_mode')
      .eq('id', id)
      .limit(1);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select profile_image from users where id = ?') {
    const [id] = params;
    const { data, error } = await supabase.from('users').select('profile_image').eq('id', id).limit(1);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'update users set monthly_income = ? where id = ?') {
    const [monthly_income, id] = params;
    return sbUpdate('users', { monthly_income }, { id });
  }

  if (q === 'update users set guardian_mode = ? where id = ?') {
    const [guardian_mode, id] = params;
    return sbUpdate('users', { guardian_mode }, { id });
  }

  if (q === 'update users set display_name = ? where id = ?') {
    const [display_name, id] = params;
    return sbUpdate('users', { display_name }, { id });
  }

  if (q === 'update users set profile_image = ? where id = ?') {
    const [profile_image, id] = params;
    return sbUpdate('users', { profile_image }, { id });
  }

  if (q === 'update users set profile_image = null where id = ?') {
    const [id] = params;
    return sbUpdate('users', { profile_image: null }, { id });
  }

  if (q === 'select id, email, role, monthly_income, guardian_mode, created_at from users') {
    const { data, error } = await supabase
      .from('users')
      .select('id,email,role,monthly_income,guardian_mode,created_at');
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select id, email, role, created_at from users order by created_at desc limit 5') {
    const { data, error } = await supabase
      .from('users')
      .select('id,email,role,created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select count(*) as count from users') {
    return sbCount('users');
  }

  if (q === 'delete from users where id = ?') {
    const [id] = params;
    return sbDelete('users', { id });
  }

  // ═══════════════════════════════════════
  //  BUDGETS
  // ═══════════════════════════════════════

  if (q === 'select * from budgets where user_id = ?') {
    const [user_id] = params;
    const { data, error } = await supabase.from('budgets').select('*').eq('user_id', user_id);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select limit_amount from budgets where user_id = ? and category = ?') {
    const [user_id, category] = params;
    const { data, error } = await supabase
      .from('budgets')
      .select('limit_amount')
      .eq('user_id', user_id)
      .eq('category', category)
      .limit(1);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'insert into budgets (user_id, category, limit_amount) values (?, ?, ?) on duplicate key update limit_amount = values(limit_amount)') {
    const [user_id, category, limit_amount] = params;
    const { data: existing } = await supabase
      .from('budgets').select('id').eq('user_id', user_id).eq('category', category).limit(1);
    if (existing && existing[0]?.id) {
      const { error } = await supabase.from('budgets').update({ limit_amount }).eq('user_id', user_id).eq('category', category);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('budgets').insert({ user_id, category, limit_amount });
      if (error) throw error;
    }
    return [{ affectedRows: 1 }];
  }

  // Multi-row budget insert (e.g. new user registration with 3 default budgets)
  if (q.startsWith('insert into budgets (user_id, category, limit_amount) values')) {
    const rows = [];
    for (let i = 0; i < params.length; i += 3) {
      rows.push({ user_id: params[i], category: params[i + 1], limit_amount: params[i + 2] });
    }
    for (const row of rows) {
      const { data: existing } = await supabase
        .from('budgets').select('id').eq('user_id', row.user_id).eq('category', row.category).limit(1);
      if (existing && existing[0]?.id) {
        await supabase.from('budgets').update({ limit_amount: row.limit_amount }).eq('user_id', row.user_id).eq('category', row.category);
      } else {
        await supabase.from('budgets').insert(row);
      }
    }
    return [{ affectedRows: rows.length }];
  }

  // ═══════════════════════════════════════
  //  EXPENSES
  // ═══════════════════════════════════════

  if (q === 'select * from expenses where user_id = ? order by date desc, id desc') {
    const [user_id] = params;
    const { data, error } = await supabase
      .from('expenses').select('*').eq('user_id', user_id).order('date', { ascending: false }).order('id', { ascending: false });
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select * from expenses where user_id = ? order by date desc') {
    const [user_id] = params;
    const { data, error } = await supabase
      .from('expenses').select('*').eq('user_id', user_id).order('date', { ascending: false });
    if (error) throw error;
    return [data || []];
  }

  if (q.startsWith('select * from expenses where user_id = ? order by date desc, id desc limit')) {
    const [user_id] = params;
    const limitMatch = q.match(/limit (\d+)$/);
    const limit = limitMatch ? parseInt(limitMatch[1]) : 100;
    const { data, error } = await supabase
      .from('expenses').select('*').eq('user_id', user_id).order('date', { ascending: false }).order('id', { ascending: false }).limit(limit);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select * from expenses where id = ? and user_id = ?') {
    const [id, user_id] = params;
    const { data, error } = await supabase.from('expenses').select('*').eq('id', id).eq('user_id', user_id).limit(1);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select sum(amount) as total from expenses where user_id = ? and month(date) = month(?) and year(date) = year(?)') {
    const [user_id, dateA] = params;
    const d = new Date(dateA);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const start = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
    const end = new Date(Date.UTC(year, month + 1, 1)).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('expenses').select('amount').eq('user_id', user_id).gte('date', start).lt('date', end);
    if (error) throw error;
    const total = (data || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    return [[{ total }]];
  }

  if (q === 'insert into expenses (user_id, amount, category, description, date, is_subscription, is_unusual, account) values (?, ?, ?, ?, ?, ?, ?, ?)') {
    const [user_id, amount, category, description, date, is_subscription, is_unusual, account] = params;
    return sbInsert('expenses', { user_id, amount, category, description, date, is_subscription: !!is_subscription, is_unusual: !!is_unusual, account });
  }

  if (q === 'insert into expenses (user_id, amount, category, description, date, receipt_url, is_subscription, account) values (?, ?, ?, ?, ?, ?, ?, ?)') {
    const [user_id, amount, category, description, date, receipt_url, is_subscription, account] = params;
    return sbInsert('expenses', { user_id, amount, category, description, date, receipt_url, is_subscription: !!is_subscription, account });
  }

  // Inline receipt+is_unusual insert (store purchase expense)
  if (q === 'insert into expenses (user_id, amount, category, description, date, is_subscription, is_unusual, account) values (?, ?, ?, ?, ?, 0, 0, ?)') {
    const [user_id, amount, category, description, date, account] = params;
    return sbInsert('expenses', { user_id, amount, category, description, date, is_subscription: false, is_unusual: false, account });
  }

  if (q === 'update expenses set amount = ?, category = ?, description = ?, date = ?, account = ? where id = ? and user_id = ?') {
    const [amount, category, description, date, account, id, user_id] = params;
    return sbUpdate('expenses', { amount, category, description, date, account }, { id, user_id });
  }

  if (q === 'delete from expenses where id = ? and user_id = ?') {
    const [id, user_id] = params;
    return sbDelete('expenses', { id, user_id });
  }

  if (q === 'select count(*) as count from expenses') {
    return sbCount('expenses');
  }

  if (q === 'select count(*) as count from expenses where is_unusual = 1') {
    const { count, error } = await supabase
      .from('expenses').select('*', { count: 'exact', head: true }).eq('is_unusual', true);
    if (error) throw error;
    return [[{ count: count || 0 }]];
  }

  if (q === 'select count(*) as count from expenses where is_subscription = 1') {
    const { count, error } = await supabase
      .from('expenses').select('*', { count: 'exact', head: true }).eq('is_subscription', true);
    if (error) throw error;
    return [[{ count: count || 0 }]];
  }

  if (q === 'select sum(amount) as total from expenses') {
    const { data, error } = await supabase.from('expenses').select('amount');
    if (error) throw error;
    const total = (data || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    return [[{ total }]];
  }

  if (q === 'select category, sum(amount) as total, count(*) as count from expenses group by category order by total desc') {
    const { data, error } = await supabase.from('expenses').select('category,amount');
    if (error) throw error;
    const map = {};
    (data || []).forEach(r => {
      if (!map[r.category]) map[r.category] = { category: r.category, total: 0, count: 0 };
      map[r.category].total += parseFloat(r.amount || 0);
      map[r.category].count += 1;
    });
    const rows = Object.values(map).sort((a, b) => b.total - a.total);
    return [rows];
  }

  // ═══════════════════════════════════════
  //  GOALS
  // ═══════════════════════════════════════

  if (q === 'select * from goals where user_id = ?') {
    const [user_id] = params;
    const { data, error } = await supabase.from('goals').select('*').eq('user_id', user_id);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'insert into goals (user_id, name, target_amount, current_amount, deadline) values (?, ?, ?, ?, ?)') {
    const [user_id, name, target_amount, current_amount, deadline] = params;
    return sbInsert('goals', { user_id, name, target_amount, current_amount: current_amount || 0, deadline: deadline || null });
  }

  // Multi-row goals insert (seeding)
  if (q.startsWith('insert into goals (user_id, name, target_amount, current_amount, deadline) values')) {
    const rows = [];
    for (let i = 0; i < params.length; i += 5) {
      rows.push({
        user_id: params[i], name: params[i + 1],
        target_amount: params[i + 2], current_amount: params[i + 3] || 0,
        deadline: params[i + 4] || null
      });
    }
    const { error } = await supabase.from('goals').insert(rows);
    if (error) throw error;
    return [{ insertId: 0, affectedRows: rows.length }];
  }

  if (q === 'update goals set current_amount = current_amount + ? where id = ? and user_id = ?') {
    const [amount, id, user_id] = params;
    const { data: rows, error: selErr } = await supabase.from('goals').select('current_amount').eq('id', id).eq('user_id', user_id).limit(1);
    if (selErr) throw selErr;
    const current = parseFloat(rows?.[0]?.current_amount || 0);
    return sbUpdate('goals', { current_amount: current + parseFloat(amount) }, { id, user_id });
  }

  if (q === 'update goals set current_amount = current_amount - ? where id = ?') {
    const [amount, id] = params;
    const { data: rows, error: selErr } = await supabase.from('goals').select('current_amount').eq('id', id).limit(1);
    if (selErr) throw selErr;
    const current = parseFloat(rows?.[0]?.current_amount || 0);
    return sbUpdate('goals', { current_amount: current - parseFloat(amount) }, { id });
  }

  if (q === 'update goals set current_amount = current_amount + ? where id = ?') {
    const [amount, id] = params;
    const { data: rows, error: selErr } = await supabase.from('goals').select('current_amount').eq('id', id).limit(1);
    if (selErr) throw selErr;
    const current = parseFloat(rows?.[0]?.current_amount || 0);
    return sbUpdate('goals', { current_amount: current + parseFloat(amount) }, { id });
  }

  if (q === 'delete from goals where id = ? and user_id = ?') {
    const [id, user_id] = params;
    return sbDelete('goals', { id, user_id });
  }

  if (q === 'select name, current_amount from goals where id = ? and user_id = ?') {
    const [id, user_id] = params;
    const { data, error } = await supabase.from('goals').select('name,current_amount').eq('id', id).eq('user_id', user_id).limit(1);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select name from goals where id = ? and user_id = ?') {
    const [id, user_id] = params;
    const { data, error } = await supabase.from('goals').select('name').eq('id', id).eq('user_id', user_id).limit(1);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select count(*) as count from goals') {
    return sbCount('goals');
  }

  // ═══════════════════════════════════════
  //  INCOME
  // ═══════════════════════════════════════

  if (q === 'select * from income where user_id = ? order by logged_at desc') {
    const [user_id] = params;
    const { data, error } = await supabase.from('income').select('*').eq('user_id', user_id).order('logged_at', { ascending: false });
    if (error) throw error;
    return [data || []];
  }

  if (q.startsWith('select * from income where user_id = ? order by date desc, id desc limit')) {
    const [user_id] = params;
    const limitMatch = q.match(/limit (\d+)$/);
    const limit = limitMatch ? parseInt(limitMatch[1]) : 50;
    const { data, error } = await supabase.from('income').select('*').eq('user_id', user_id).order('logged_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'insert into income (user_id, amount, source, category, is_irregular) values (?, ?, ?, ?, ?)') {
    const [user_id, amount, source, category, is_irregular] = params;
    return sbInsert('income', { user_id, amount, source, category: category || 'salary', is_irregular: !!is_irregular });
  }

  if (q === 'insert into income (user_id, amount, source, is_irregular) values (?, ?, ?, 1)') {
    const [user_id, amount, source] = params;
    return sbInsert('income', { user_id, amount, source, category: 'salary', is_irregular: true });
  }

  if (q === 'insert into income (user_id, amount, source, category, notes, is_irregular) values (?, ?, ?, ?, ?, ?)') {
    const [user_id, amount, source, category, notes, is_irregular] = params;
    return sbInsert('income', { user_id, amount, source, category: category || 'salary', notes, is_irregular: !!is_irregular });
  }

  // Multi-row income insert (seeding: two incomes at once)
  if (q.startsWith('insert into income (user_id, amount, source, category, is_irregular, date) values')) {
    const rows = [];
    for (let i = 0; i < params.length; i += 6) {
      rows.push({
        user_id: params[i], amount: params[i + 1], source: params[i + 2],
        category: params[i + 3] || 'salary', is_irregular: !!params[i + 4], date: params[i + 5]
      });
    }
    const { error } = await supabase.from('income').insert(rows);
    if (error) throw error;
    return [{ insertId: 0, affectedRows: rows.length }];
  }

  if (q === 'select * from income where id = ? and user_id = ?') {
    const [id, user_id] = params;
    const { data, error } = await supabase.from('income').select('*').eq('id', id).eq('user_id', user_id).limit(1);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'update income set amount = ?, source = ?, category = ? where id = ? and user_id = ?') {
    const [amount, source, category, id, user_id] = params;
    return sbUpdate('income', { amount, source, category: category || 'salary' }, { id, user_id });
  }

  if (q === 'delete from income where id = ? and user_id = ?') {
    const [id, user_id] = params;
    return sbDelete('income', { id, user_id });
  }

  if (q === 'select sum(amount) as total from income') {
    const { data, error } = await supabase.from('income').select('amount');
    if (error) throw error;
    const total = (data || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    return [[{ total }]];
  }

  // ═══════════════════════════════════════
  //  CHATBOT CONVERSATIONS
  // ═══════════════════════════════════════

  if (q === 'select query, response, created_at from chatbot_conversations where user_id = ? order by created_at asc') {
    const [user_id] = params;
    const { data, error } = await supabase
      .from('chatbot_conversations').select('query,response,created_at')
      .eq('user_id', user_id).order('created_at', { ascending: true });
    if (error) throw error;
    return [data || []];
  }

  if (q === 'insert into chatbot_conversations (user_id, query, response) values (?, ?, ?)') {
    const [user_id, query2, response] = params;
    return sbInsertNoReturn('chatbot_conversations', { user_id, query: query2, response });
  }

  if (q === 'delete from chatbot_conversations where user_id = ?') {
    const [user_id] = params;
    return sbDelete('chatbot_conversations', { user_id });
  }

  // ═══════════════════════════════════════
  //  TRANSACTIONS
  // ═══════════════════════════════════════

  if (q.includes('select * from transactions') && q.includes('where user_id = ?') && q.includes('transaction_date >=')) {
    const [user_id, firstDay] = params;
    const { data, error } = await supabase
      .from('transactions').select('*').eq('user_id', user_id)
      .gte('transaction_date', new Date(firstDay).toISOString().slice(0, 10))
      .order('transaction_date', { ascending: false });
    if (error) throw error;
    return [data || []];
  }

  if (q.includes('select * from transactions') && q.includes('where user_id = ?') && q.includes('limit 500')) {
    const [user_id] = params;
    const { data, error } = await supabase
      .from('transactions').select('*').eq('user_id', user_id).order('transaction_date', { ascending: false }).limit(500);
    if (error) throw error;
    return [data || []];
  }

  if (q.includes('select * from transactions') && q.includes('where user_id = ?') && q.includes('limit 200')) {
    const [user_id] = params;
    const { data, error } = await supabase
      .from('transactions').select('*').eq('user_id', user_id).order('transaction_date', { ascending: false }).limit(200);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select id from transactions where user_id = ? and amount = ? and transaction_date = ? and description = ?') {
    const [user_id, amount, transaction_date, description] = params;
    const dateStr = transaction_date instanceof Date
      ? transaction_date.toISOString().slice(0, 10)
      : String(transaction_date).slice(0, 10);
    const { data, error } = await supabase
      .from('transactions').select('id')
      .eq('user_id', user_id).eq('amount', amount).eq('description', description)
      .gte('transaction_date', dateStr).lte('transaction_date', dateStr);
    if (error) throw error;
    return [data || []];
  }

  if (q.includes('insert into transactions')) {
    const [user_id, amount, category, description, transaction_date, transaction_type, account] = params;
    const dateStr = transaction_date instanceof Date
      ? transaction_date.toISOString().slice(0, 10)
      : String(transaction_date).slice(0, 10);
    return sbInsert('transactions', { user_id, amount, category, description, transaction_date: dateStr, transaction_type, account });
  }

  // ═══════════════════════════════════════
  //  DEPOSITS
  // ═══════════════════════════════════════

  if (q.includes('update deposits') && q.includes("set status = 'failed'") && q.includes('pending')) {
    // Auto-fail pending deposits older than 6 minutes
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const { data: pending } = await supabase
      .from('deposits').select('id').eq('status', 'pending').lt('created_at', sixMinutesAgo);
    if (pending && pending.length > 0) {
      const ids = pending.map(r => r.id);
      await supabase.from('deposits').update({ status: 'failed' }).in('id', ids);
    }
    return [{ affectedRows: 0 }];
  }

  if (q === 'select * from deposits where user_id = ? order by created_at desc') {
    const [user_id] = params;
    const { data, error } = await supabase
      .from('deposits').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
    if (error) throw error;
    return [data || []];
  }

  if (q.includes('select * from deposits where user_id = ?') && q.includes('status')) {
    const [user_id] = params;
    const { data, error } = await supabase
      .from('deposits').select('*').eq('user_id', user_id).eq('status', 'completed');
    if (error) throw error;
    return [data || []];
  }

  if (q.includes('select d.*, u.email as depositor_email') && q.includes('deposits d')) {
    // Admin deposits with join
    const { data: deps, error: dErr } = await supabase
      .from('deposits').select('*').order('created_at', { ascending: false });
    if (dErr) throw dErr;
    const userIds = [...new Set((deps || []).map(d => d.user_id))];
    let userMap = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id,email,role').in('id', userIds);
      (users || []).forEach(u => { userMap[u.id] = { email: u.email, role: u.role }; });
    }
    const merged = (deps || []).map(d => ({
      ...d,
      depositor_email: userMap[d.user_id]?.email || null,
      depositor_role: userMap[d.user_id]?.role || null,
    }));
    return [merged];
  }

  if (q === 'insert into deposits (user_id, amount, phone, provider, reference, status) values (?, ?, ?, ?, ?, ?)') {
    const [user_id, amount, phone, provider, reference, status] = params;
    return sbInsert('deposits', { user_id, amount, phone, provider, reference, status: status || 'completed' });
  }

  // ═══════════════════════════════════════
  //  VIRTUAL CARDS
  // ═══════════════════════════════════════

  // The detailed SELECT used by GET /api/virtual-cards
  if (q.includes('select id, user_id, card_name, card_type, card_number') && q.includes('from virtual_cards where user_id = ?')) {
    const [user_id] = params;
    const { data, error } = await supabase
      .from('virtual_cards').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select * from virtual_cards where user_id = ? order by created_at desc') {
    const [user_id] = params;
    const { data, error } = await supabase
      .from('virtual_cards').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select id from virtual_cards where id = ? and user_id = ?') {
    const [id, user_id] = params;
    const { data, error } = await supabase.from('virtual_cards').select('id').eq('id', id).eq('user_id', user_id);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select * from virtual_cards where id = ? and user_id = ?') {
    const [id, user_id] = params;
    const { data, error } = await supabase.from('virtual_cards').select('*').eq('id', id).eq('user_id', user_id).limit(1);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'insert into virtual_cards (user_id, card_name, card_type, card_number, expiry_date, cvv, card_holder, spending_limit, card_color, status) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)') {
    const [user_id, card_name, card_type, card_number, expiry_date, cvv, card_holder, spending_limit, card_color, status] = params;
    return sbInsert('virtual_cards', { user_id, card_name, card_type, card_number, expiry_date, cvv, card_holder, spending_limit, card_color, status });
  }

  if (q === 'delete from virtual_cards where id = ? and user_id = ?') {
    const [id, user_id] = params;
    return sbDelete('virtual_cards', { id, user_id });
  }

  if (q === 'update virtual_cards set status = ? where id = ? and user_id = ?') {
    const [status, id, user_id] = params;
    return sbUpdate('virtual_cards', { status }, { id, user_id });
  }

  if (q === 'update virtual_cards set is_primary = 0 where user_id = ?') {
    const [user_id] = params;
    return sbUpdate('virtual_cards', { is_primary: false }, { user_id });
  }

  if (q === 'update virtual_cards set is_primary = 1 where id = ? and user_id = ?') {
    const [id, user_id] = params;
    return sbUpdate('virtual_cards', { is_primary: true }, { id, user_id });
  }

  if (q === 'update virtual_cards set is_primary = 0 where id = ? and user_id = ?') {
    const [id, user_id] = params;
    return sbUpdate('virtual_cards', { is_primary: false }, { id, user_id });
  }

  if (q === 'select * from virtual_cards where user_id = ? and is_primary = 1 order by created_at desc limit 1') {
    const [user_id] = params;
    const { data, error } = await supabase
      .from('virtual_cards').select('*').eq('user_id', user_id).eq('is_primary', true)
      .order('created_at', { ascending: false }).limit(1);
    if (error) throw error;
    return [data || []];
  }

  // CASE WHEN update (fix multiple primaries)
  if (q.includes('update virtual_cards set is_primary = case when id = ?')) {
    const [keepId, user_id] = params;
    // Set all to 0 first, then set target to 1
    await supabase.from('virtual_cards').update({ is_primary: false }).eq('user_id', user_id);
    await supabase.from('virtual_cards').update({ is_primary: true }).eq('id', keepId).eq('user_id', user_id);
    return [{ affectedRows: 1 }];
  }

  // Store purchase: find card by card_number (with REPLACE to strip spaces)
  if (q.includes('select * from virtual_cards where replace(card_number') || q.includes("where replace(card_number, ' ', '')")) {
    const [cleanCardNumber, user_id] = params;
    const { data: allCards, error } = await supabase
      .from('virtual_cards').select('*').eq('user_id', user_id);
    if (error) throw error;
    const matched = (allCards || []).filter(c =>
      String(c.card_number || '').replace(/\s/g, '') === String(cleanCardNumber).replace(/\s/g, '')
    );
    return [matched];
  }

  // Debit spending_limit for store purchase
  if (q === 'update virtual_cards set spending_limit = spending_limit - ? where id = ?') {
    const [purchaseAmount, id] = params;
    const { data: rows, error: selErr } = await supabase.from('virtual_cards').select('spending_limit').eq('id', id).limit(1);
    if (selErr) throw selErr;
    const current = parseFloat(rows?.[0]?.spending_limit || 0);
    const next = current - parseFloat(purchaseAmount);
    return sbUpdate('virtual_cards', { spending_limit: next }, { id });
  }

  // ═══════════════════════════════════════
  //  STORE PRODUCTS
  // ═══════════════════════════════════════

  if (q === 'select * from store_products order by category, name') {
    const { data, error } = await supabase.from('store_products').select('*').order('category').order('name');
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select * from store_products where id = ?') {
    const [id] = params;
    const { data, error } = await supabase.from('store_products').select('*').eq('id', id).limit(1);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'insert into store_products (name, description, price, category, image_url, stock) values (?, ?, ?, ?, ?, ?)') {
    const [name, description, price, category, image_url, stock] = params;
    return sbInsert('store_products', { name, description, price, category, image_url, stock: stock ?? 100 });
  }

  if (q === 'update store_products set name = ?, description = ?, price = ?, category = ?, image_url = ?, stock = ? where id = ?') {
    const [name, description, price, category, image_url, stock, id] = params;
    return sbUpdate('store_products', { name, description, price, category, image_url, stock: stock ?? 100 }, { id });
  }

  if (q === 'delete from store_products where id = ?') {
    const [id] = params;
    return sbDelete('store_products', { id });
  }

  // ═══════════════════════════════════════
  //  ORDERS
  // ═══════════════════════════════════════

  if (q.includes('select o.*, vc.card_name') && q.includes('from orders o')) {
    const [user_id] = params;
    const { data: orders, error: oErr } = await supabase
      .from('orders').select('*').eq('user_id', user_id).order('created_at', { ascending: false });
    if (oErr) throw oErr;
    const cardIds = [...new Set((orders || []).filter(o => o.card_id).map(o => o.card_id))];
    let cardMap = {};
    if (cardIds.length > 0) {
      const { data: cards } = await supabase.from('virtual_cards').select('id,card_name,card_number,card_type').in('id', cardIds);
      (cards || []).forEach(c => { cardMap[c.id] = c; });
    }
    const merged = (orders || []).map(o => ({
      ...o,
      card_name: cardMap[o.card_id]?.card_name || null,
      card_number: cardMap[o.card_id]?.card_number || null,
      card_type: cardMap[o.card_id]?.card_type || null,
    }));
    return [merged];
  }

  if (q.startsWith('select * from orders where user_id = ? order by created_at desc')) {
    const [user_id] = params;
    const limitMatch = q.match(/limit (\d+)$/);
    const limit = limitMatch ? parseInt(limitMatch[1]) : 50;
    const { data, error } = await supabase
      .from('orders').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'insert into orders (user_id, card_id, total_amount, items_json) values (?, ?, ?, ?)') {
    const [user_id, card_id, total_amount, items_json] = params;
    return sbInsert('orders', { user_id, card_id, total_amount, items_json, status: 'completed' });
  }

  // ═══════════════════════════════════════
  //  LOCAL JOBS
  // ═══════════════════════════════════════

  if (q === 'select * from local_jobs order by created_at desc') {
    const { data, error } = await supabase.from('local_jobs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return [data || []];
  }

  if (q === 'select * from local_jobs where id = ?') {
    const [id] = params;
    const { data, error } = await supabase.from('local_jobs').select('*').eq('id', id).limit(1);
    if (error) throw error;
    return [data || []];
  }

  if (q === 'insert into local_jobs (title, company, location, salary, description, type, category, image_url) values (?, ?, ?, ?, ?, ?, ?, ?)') {
    const [title, company, location, salary, description, type, category, image_url] = params;
    return sbInsert('local_jobs', { title, company, location, salary, description, type: type || 'Full-Time', category: category || 'General Services', image_url: image_url || null });
  }

  if (q === 'insert into local_jobs (title, company, location, salary, description, type, category) values (?, ?, ?, ?, ?, ?, ?)') {
    const [title, company, location, salary, description, type, category] = params;
    return sbInsert('local_jobs', { title, company, location, salary, description, type: type || 'Full-Time', category: category || 'General Services' });
  }

  if (q === 'update local_jobs set title = ?, company = ?, location = ?, salary = ?, description = ?, type = ?, category = ?, image_url = ? where id = ?') {
    const [title, company, location, salary, description, type, category, image_url, id] = params;
    return sbUpdate('local_jobs', { title, company, location, salary, description, type, category, image_url: image_url || null }, { id });
  }

  if (q === 'delete from local_jobs where id = ?') {
    const [id] = params;
    return sbDelete('local_jobs', { id });
  }

  // ═══════════════════════════════════════
  //  NOTIFICATIONS (uses existing patterns above)
  // ═══════════════════════════════════════
  // All queries used by /api/notifications are already covered above.

  // ═══════════════════════════════════════
  //  FALLBACK
  // ═══════════════════════════════════════

  console.warn('[Supabase adapter] Unhandled query:', text);
  throw new Error(`Supabase adapter cannot handle query yet: ${text}`);
};

// ─── Fake connection for transaction-like routes ──────────────────────────────
// Supabase does not have real client-side transactions via REST.
// We simulate with sequential operations + rollback attempt on failure.

function createFakeConnection() {
  const rolledBack = { value: false };
  const ops = []; // track inserted IDs for rollback

  return {
    query: async (sql, params = []) => {
      const result = await query(sql, params);
      // Track inserts for potential rollback
      if (norm(sql).startsWith('insert') && result[0]?.insertId) {
        const tableMatch = norm(sql).match(/insert into (\w+)/);
        if (tableMatch) ops.push({ table: tableMatch[1], id: result[0].insertId });
      }
      return result;
    },
    beginTransaction: async () => {},
    commit: async () => { /* no-op in Supabase REST */ },
    rollback: async () => {
      // Best-effort rollback: delete any rows we inserted
      rolledBack.value = true;
      for (const op of ops.reverse()) {
        try {
          await supabase.from(op.table).delete().eq('id', op.id);
        } catch (e) {
          console.warn('[rollback] Could not delete', op.table, op.id, e.message);
        }
      }
    },
    release: () => {},
  };
}

module.exports = {
  query,
  getPool: () => ({
    getConnection: async () => createFakeConnection()
  })
};
