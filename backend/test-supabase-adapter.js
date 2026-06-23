const db = require('./db');

async function run() {
  const email = 'user@finvision.com';

  console.log('--- Supabase mode adapter test ---');

  // 1) SELECT users by email (adapter mapping #1)
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('users-by-email rows length:', rows.length);
    if (rows[0]) console.log('users-by-email first row keys:', Object.keys(rows[0]));
  } catch (e) {
    console.error('FAIL users-by-email:', e && e.message ? e.message : e);
  }

  // 2) INSERT into users (adapter mapping #2)
  // If the record already exists, Supabase will throw due to unique email.
  try {
    const saltHash = '$2b$10$test.test.test.test.test.test.test.test.test.test';
    const [res] = await db.query(
      'INSERT INTO users (email, password, role, monthly_income) VALUES (?, ?, ?, ?)',
      ['test@finvision.com', saltHash, 'user', 3500.0]
    );
    console.log('insert users insertId:', res && res.insertId ? res.insertId : res);
  } catch (e) {
    console.error('FAIL insert users:', e && e.message ? e.message : e);
  }

  console.log('--- Done ---');
}

run().catch((e) => {
  console.error('Unhandled:', e);
});

