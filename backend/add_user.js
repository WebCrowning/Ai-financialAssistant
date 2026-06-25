// add_user.js – script to add a new demo user to the MySQL database
// Usage: node add_user.js
// Make sure the backend is running in MySQL mode (no SUPABASE_URL/KEY env vars).

const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const db = require('./db');

// Change these credentials as needed
const NEW_USER_EMAIL = 'newuser@finvision.com';
const NEW_USER_PASSWORD = 'newuserpassword'; // plaintext, will be hashed
const ROLE = 'user';
const MONTHLY_INCOME = 3000.00;

async function addUser() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(NEW_USER_PASSWORD, salt);
    const [result] = await db.query(
      'INSERT INTO users (email, password, role, monthly_income) VALUES (?, ?, ?, ?)',
      [NEW_USER_EMAIL, hashedPassword, ROLE, MONTHLY_INCOME]
    );
    console.log('✅ New user added with ID:', result.insertId);
    console.log('Credentials:');
    console.log('  Email:', NEW_USER_EMAIL);
    console.log('  Password:', NEW_USER_PASSWORD);
  } catch (err) {
    console.error('❌ Failed to add user:', err.message);
    process.exit(1);
  }
}

addUser();
