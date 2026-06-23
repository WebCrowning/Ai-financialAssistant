const db = require('./db');

async function run() {
  console.log('--- Supabase adapter expenses test ---');

  // Use a known user from your existing logic. If it doesn’t exist, adapter will fail.
  const email = 'user@finvision.com';

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      console.error('No seed user found for:', email);
      return;
    }

    const userId = users[0].id;
    console.log('Using userId:', userId);

    // 1) budgets lookup pattern
    try {
      await db.query('SELECT limit_amount FROM budgets WHERE user_id = ? AND category = ?', [userId, 'Food']);
      console.log('budgets lookup mapping: OK');
    } catch (e) {
      console.error('FAIL budgets lookup:', e.message);
    }

    // 2) expense SUM by month/year pattern from /api/expenses POST
    const date = '2026-06-15';
    try {
      await db.query(
        "SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND MONTH(date) = MONTH(?) AND YEAR(date) = YEAR(?)",
        [userId, date, date]
      );
      console.log('expense SUM by month/year mapping: OK');
    } catch (e) {
      console.error('FAIL expense SUM by month/year:', e.message);
    }

    // 3) insert into expenses pattern
    try {
      await db.query(
        'INSERT INTO expenses (user_id, amount, category, description, date, receipt_url, is_subscription, account) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, 12.34, 'Food', 'Test expense', date, null, 0, 'Main Bank Account']
      );
      console.log('insert expenses mapping: OK');
    } catch (e) {
      console.error('FAIL insert expenses:', e.message);
    }

    // 4) list expenses pattern
    try {
      await db.query('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC', [userId]);
      console.log('select expenses list mapping: OK');
    } catch (e) {
      console.error('FAIL select expenses list:', e.message);
    }

  } catch (e) {
    console.error('Unhandled:', e.message);
  }

  console.log('--- Done ---');
}

run();

