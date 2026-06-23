// Minimal adapter to keep the existing backend route code compatible.
// It exposes a db-like interface: query(text, params) and getPool().
// NOTE: Supabase supports SQL only via the Postgres HTTP endpoint for REST,
// which is limited. For now we implement a small subset of helpers used by
// the backend routes we migrate first.

const { supabase } = require('./supabaseClient');

function ensureSupabase() {
  if (!supabase) throw new Error('Supabase client not initialized. Set SUPABASE_URL and SUPABASE_KEY');
}

// Supabase REST doesn't run arbitrary SQL. We therefore implement table
// operations directly with the JS client.
//
// This is intentionally limited; we will expand as we migrate more endpoints.

async function selectAll(table, filters = {}, orderBy) {
  ensureSupabase();
  let q = supabase.from(table).select('*');
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined) continue;
    q = q.eq(k, v);
  }
  if (orderBy) {
    q = q.order(orderBy.column, { ascending: orderBy.ascending ?? false });
  }
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function insertOne(table, payload, returningColumns = '*') {
  ensureSupabase();
  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select(returningColumns)
    .single();
  if (error) throw error;
  return data;
}

async function updateWhere(table, payload, filters = {}) {
  ensureSupabase();
  let q = supabase.from(table).update(payload);
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined) continue;
    q = q.eq(k, v);
  }
  const { error } = await q;
  if (error) throw error;
}

module.exports = {
  // Fallback db-like facade; maps the SQL patterns used by backend routes.
  query: async (text, params = []) => {
    ensureSupabase();

    const normalized = String(text).trim();
    const lowered = normalized.toLowerCase();
    const compact = lowered.replace(/\s+/g, ' ');

    // USERS
    if (/^select \* from users where email = \?$/.test(compact)) {
      const [email] = params;
      const { data, error } = await supabase.from('users').select('*').eq('email', email).limit(1);
      if (error) throw error;
      return [data ? [data[0]] : []];
    }

    if (/^insert into users \(email, password, role, monthly_income\) values \(\?, \?, \?, \?\)$/.test(compact)) {
      const [email, password, role, monthly_income] = params;
      const row = await insertOne('users', { email, password, role, monthly_income }, 'id');
      return [{ insertId: row.id }];
    }

    if (/^select id, email, role, monthly_income, guardian_mode, display_name, profile_image from users where id = \?$/.test(compact)) {
      const [id] = params;
      const { data, error } = await supabase
        .from('users')
        .select('id,email,role,monthly_income,guardian_mode,display_name,profile_image')
        .eq('id', id)
        .limit(1);
      if (error) throw error;
      return [data ? [data[0]] : []];
    }

    if (/^select monthly_income, guardian_mode from users where id = \?$/.test(compact)) {
      const [id] = params;
      const { data, error } = await supabase
        .from('users')
        .select('monthly_income,guardian_mode')
        .eq('id', id)
        .limit(1);
      if (error) throw error;
      return [data ? [data[0]] : []];
    }

    // BUDGETS
    if (/^select \* from budgets where user_id = \?$/.test(compact)) {
      const [user_id] = params;
      const { data, error } = await supabase.from('budgets').select('*').eq('user_id', user_id);
      if (error) throw error;
      return [Array.isArray(data) ? data : []];
    }

    // SELECT limit_amount ... (used by /api/expenses POST)
    if (/^select limit_amount from budgets where user_id = \? and category = \?$/.test(compact)) {
      const [user_id, category] = params;
      const { data, error } = await supabase
        .from('budgets')
        .select('limit_amount')
        .eq('user_id', user_id)
        .eq('category', category)
        .limit(1);
      if (error) throw error;
      return [data ? [data[0]] : []];
    }

    // UPSERT budget limit (works around MySQL ON DUPLICATE KEY)
    if (/^insert into budgets \(user_id, category, limit_amount\) values \(\?, \?, \?\) on duplicate key update limit_amount = values\(limit_amount\)$/.test(compact)) {
      const [user_id, category, limit_amount] = params;
      const { data: existing, error: selErr } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user_id)
        .eq('category', category)
        .limit(1);
      if (selErr) throw selErr;

      if (existing && existing[0]?.id) {
        const { error: upErr } = await supabase
          .from('budgets')
          .update({ limit_amount })
          .eq('user_id', user_id)
          .eq('category', category);
        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase
          .from('budgets')
          .insert({ user_id, category, limit_amount });
        if (insErr) throw insErr;
      }
      return [{ affectedRows: 1 }];
    }

    // VIRTUAL CARDS
    // A) List virtual cards
    if (/^select \* from virtual_cards where user_id = \? order by created_at desc$/.test(compact)) {
      const [user_id] = params;
      const { data, error } = await supabase
        .from('virtual_cards')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return [Array.isArray(data) ? data : []];
    }

    // B) Get cards by id/user_id (used by many routes)
    if (/^select id from virtual_cards where id = \? and user_id = \?$/.test(compact)) {
      const [id, user_id] = params;
      const { data, error } = await supabase
        .from('virtual_cards')
        .select('id')
        .eq('id', id)
        .eq('user_id', user_id);
      if (error) throw error;
      return [Array.isArray(data) ? data : []];
    }

    // C) Create virtual card
    if (/^insert into virtual_cards \(user_id, card_name, card_type, card_number, expiry_date, cvv, card_holder, spending_limit, card_color, status\) values \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)$/.test(compact)) {
      const [user_id, card_name, card_type, card_number, expiry_date, cvv, card_holder, spending_limit, card_color, status] = params;
      const row = await insertOne(
        'virtual_cards',
        {
          user_id,
          card_name,
          card_type,
          card_number,
          expiry_date,
          cvv,
          card_holder,
          spending_limit,
          card_color,
          status
        },
        'id'
      );
      return [{ insertId: row.id }];
    }

    // D) Select * virtual_cards where id = ? and user_id = ?
    if (/^select \* from virtual_cards where id = \? and user_id = \?$/.test(compact)) {
      const [id, user_id] = params;
      const { data, error } = await supabase
        .from('virtual_cards')
        .select('*')
        .eq('id', id)
        .eq('user_id', user_id)
        .limit(1);
      if (error) throw error;
      return [data ? [data[0]] : []];
    }

    // E) Delete virtual cards by id/user_id
    if (/^delete from virtual_cards where id = \? and user_id = \?$/.test(compact)) {
      const [id, user_id] = params;
      const { error } = await supabase.from('virtual_cards').delete().eq('id', id).eq('user_id', user_id);
      if (error) throw error;
      return [{ affectedRows: 1 }];
    }

    // F) Update status
    if (/^update virtual_cards set status = \? where id = \? and user_id = \?$/.test(compact)) {
      const [status, id, user_id] = params;
      const { error } = await supabase
        .from('virtual_cards')
        .update({ status })
        .eq('id', id)
        .eq('user_id', user_id);
      if (error) throw error;
      return [{ affectedRows: 1 }];
    }

    // G) Update is_primary = 0 for user
    if (/^update virtual_cards set is_primary = 0 where user_id = \?$/.test(compact)) {
      const [user_id] = params;
      const { error } = await supabase
        .from('virtual_cards')
        .update({ is_primary: 0 })
        .eq('user_id', user_id);
      if (error) throw error;
      return [{ affectedRows: 1 }];
    }

    // H) Update is_primary = 1 for id/user_id
    if (/^update virtual_cards set is_primary = 1 where id = \? and user_id = \?$/.test(compact)) {
      const [id, user_id] = params;
      const { error } = await supabase
        .from('virtual_cards')
        .update({ is_primary: 1 })
        .eq('id', id)
        .eq('user_id', user_id);
      if (error) throw error;
      return [{ affectedRows: 1 }];
    }

    // I) Update is_primary = 0 for id/user_id (unset primary)
    if (/^update virtual_cards set is_primary = 0 where id = \? and user_id = \?$/.test(compact)) {
      const [id, user_id] = params;
      const { error } = await supabase
        .from('virtual_cards')
        .update({ is_primary: 0 })
        .eq('id', id)
        .eq('user_id', user_id);
      if (error) throw error;
      return [{ affectedRows: 1 }];
    }

    // J) Get primary card
    if (/^select \* from virtual_cards where user_id = \? and is_primary = 1 order by created_at desc limit 1$/.test(compact)) {
      const [user_id] = params;
      const { data, error } = await supabase
        .from('virtual_cards')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_primary', 1)
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return [data ? data : []];
    }

    // K) Debit spending limit by id (store purchase)
    if (/^update virtual_cards set spending_limit = spending_limit - \? where id = \?$/.test(compact)) {
      const [purchaseAmount, id] = params;
      // Supabase needs explicit new value: spending_limit - amount
      // Fetch current then update to keep it simple.
      const { data: rows, error: selErr } = await supabase
        .from('virtual_cards')
        .select('spending_limit')
        .eq('id', id)
        .limit(1);
      if (selErr) throw selErr;
      const current = parseFloat(rows?.[0]?.spending_limit || 0);
      const next = current - parseFloat(purchaseAmount);
      const { error: upErr } = await supabase
        .from('virtual_cards')
        .update({ spending_limit: next })
        .eq('id', id);
      if (upErr) throw upErr;
      return [{ affectedRows: 1 }];
    }

    // EXPENSES
    if (/^select sum\(amount\) as total from expenses where user_id = \? and month\(date\) = month\(\?\) and year\(date\) = year\(\?\)$/.test(compact)) {
      const [user_id, dateA] = params;
      const d = new Date(dateA);
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth();
      const start = new Date(Date.UTC(year, month, 1));
      const end = new Date(Date.UTC(year, month + 1, 1));

      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user_id)
        .gte('date', start.toISOString().slice(0, 10))
        .lt('date', end.toISOString().slice(0, 10));
      if (error) throw error;

      const total = (data || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);
      return [[{ total }]];
    }


    if (/^insert into expenses \(user_id, amount, category, description, date, receipt_url, is_subscription, account\) values \(\?, \?, \?, \?, \?, \?, \?, \?\)$/.test(compact)) {
      const [user_id, amount, category, description, date, receipt_url, is_subscription, account] = params;
      const row = await insertOne(
        'expenses',
        { user_id, amount, category, description, date, receipt_url, is_subscription, account },
        'id'
      );
      return [{ insertId: row.id }];
    }

    if (/^select \* from expenses where user_id = \? order by date desc, id desc$/.test(compact)) {
      const [user_id] = params;
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user_id)
        .order('date', { ascending: false });
      if (error) throw error;
      const arr = Array.isArray(data) ? data : [];
      return [arr.sort((a, b) => (b.id || 0) - (a.id || 0))];
    }

    throw new Error(`Supabase adapter cannot handle query yet: ${text}`);
  },

  getPool: () => ({
    getConnection: async () => {
      throw new Error('Supabase transaction adapter not implemented yet');
    }
  })
};


