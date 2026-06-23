const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'financial_assistance';

async function run() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
  });

  try {
    // 1. Find user ID for user@finvision.com
    const [users] = await connection.query("SELECT id FROM users WHERE email = 'user@finvision.com'");
    if (users.length === 0) {
      console.error('Demo user not found. Run the server first to initialize.');
      process.exit(1);
    }
    const userId = users[0].id;
    console.log(`Found demo user ID: ${userId}`);

    // 2. Clear current expenses and income for this user
    await connection.query("DELETE FROM expenses WHERE user_id = ?", [userId]);
    await connection.query("DELETE FROM income WHERE user_id = ?", [userId]);
    console.log('Cleared existing expenses and income for demo user.');

    // 3. Seed exact income: Total = 4,250
    const incomes = [
      { amount: 3800.00, source: 'Monthly Salary', category: 'salary', is_irregular: 0, date: '2026-06-01' },
      { amount: 450.00, source: 'Freelance Design', category: 'freelance', is_irregular: 1, date: '2026-06-15' }
    ];

    for (const inc of incomes) {
      await connection.query(
        "INSERT INTO income (user_id, amount, source, category, is_irregular, date) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, inc.amount, inc.source, inc.category, inc.is_irregular, inc.date]
      );
    }
    console.log('Seeded exact income logs. Total = 4,250.00');

    // 4. Seed exact expenses: Total = 6,713.15
    const expenses = [
      { amount: 2300.50, category: 'Rent', description: 'Monthly Rent Payment', date: '2026-06-01', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 15.00, category: 'Bills', description: 'Unused Fitness App Subscription', date: '2026-06-02', is_subscription: 1, is_unusual: 1, account: 'Virtual Card' },
      { amount: 285.50, category: 'Food', description: 'Groceries at Supermarket', date: '2026-06-02', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 32.00, category: 'Transport', description: 'Uber Ride City Center', date: '2026-06-03', is_subscription: 0, is_unusual: 0, account: 'MTN MoMo' },
      { amount: 145.00, category: 'Food', description: 'Restaurant Dinner', date: '2026-06-03', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 9.99, category: 'Bills', description: 'Spotify Premium Family', date: '2026-06-04', is_subscription: 1, is_unusual: 0, account: 'Virtual Card' },
      { amount: 250.00, category: 'Other', description: 'Shopping at Zara', date: '2026-06-04', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 25.00, category: 'Transport', description: 'Train Ticket Weekend', date: '2026-06-05', is_subscription: 0, is_unusual: 0, account: 'Orange Money' },
      { amount: 110.00, category: 'Bills', description: 'Electricity Bill Utilities', date: '2026-06-05', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 30.00, category: 'Food', description: 'Office Lunch Delivery', date: '2026-06-06', is_subscription: 0, is_unusual: 0, account: 'MTN MoMo' },
      { amount: 55.00, category: 'Other', description: 'Local Pharmacy Medicines', date: '2026-06-06', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 14.99, category: 'Bills', description: 'Netflix UHD Subscription', date: '2026-06-07', is_subscription: 1, is_unusual: 0, account: 'Virtual Card' },
      { amount: 120.00, category: 'Food', description: 'Weekly Anomaly Groceries', date: '2026-06-07', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 18.50, category: 'Transport', description: 'Fuel Refill Station', date: '2026-06-08', is_subscription: 0, is_unusual: 0, account: 'Orange Money' },
      { amount: 40.00, category: 'Bills', description: 'Broadband Fiber Internet', date: '2026-06-08', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 7.50, category: 'Food', description: 'Coffee Shop Pastry', date: '2026-06-09', is_subscription: 0, is_unusual: 0, account: 'Virtual Card' },
      { amount: 95.00, category: 'Other', description: 'New Running Shoes', date: '2026-06-09', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 22.00, category: 'Transport', description: 'Uber Ride to Airport', date: '2026-06-10', is_subscription: 0, is_unusual: 0, account: 'MTN MoMo' },
      { amount: 65.00, category: 'Food', description: 'Weekend Sushi Platter', date: '2026-06-10', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 29.99, category: 'Bills', description: 'Adobe Creative Suite', date: '2026-06-11', is_subscription: 1, is_unusual: 0, account: 'Virtual Card' },
      { amount: 180.00, category: 'Other', description: 'Mechanical Keyboard Gadget', date: '2026-06-11', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 11.50, category: 'Food', description: 'McDonalds Combo', date: '2026-06-12', is_subscription: 0, is_unusual: 0, account: 'MTN MoMo' },
      { amount: 35.00, category: 'Transport', description: 'Gasoline Refueling', date: '2026-06-12', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 50.00, category: 'Bills', description: 'Mobile Recharge Plan', date: '2026-06-13', is_subscription: 0, is_unusual: 0, account: 'Orange Money' },
      { amount: 1500.00, category: 'Other', description: 'Night Gambling Deposit Anomaly', date: '2026-06-13', is_subscription: 0, is_unusual: 1, account: 'Main Bank Account' },
      { amount: 8.00, category: 'Food', description: 'Boba Bubble Tea', date: '2026-06-14', is_subscription: 0, is_unusual: 0, account: 'Virtual Card' },
      { amount: 300.00, category: 'Bills', description: 'AWS Cloud Hosting Server', date: '2026-06-14', is_subscription: 1, is_unusual: 1, account: 'Virtual Card' },
      { amount: 15.00, category: 'Transport', description: 'City Parking Fee', date: '2026-06-15', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 15.20, category: 'Food', description: 'Sandwiches for Picnic', date: '2026-06-15', is_subscription: 0, is_unusual: 0, account: 'MTN MoMo' },
      { amount: 85.00, category: 'Other', description: 'Books from Amazon', date: '2026-06-16', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 200.00, category: 'Other', description: 'Crypto Purchase Coinbase Anomaly', date: '2026-06-16', is_subscription: 0, is_unusual: 1, account: 'Virtual Card' },
      { amount: 18.00, category: 'Food', description: 'Subway Sandwich Lunch', date: '2026-06-01', is_subscription: 0, is_unusual: 0, account: 'MTN MoMo' },
      { amount: 35.00, category: 'Transport', description: 'Taxi to Office', date: '2026-06-03', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 120.00, category: 'Bills', description: 'Gym Membership Annual Plan', date: '2026-06-05', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 6.50, category: 'Food', description: 'Donut & Coffee breakfast', date: '2026-06-06', is_subscription: 0, is_unusual: 0, account: 'Virtual Card' },
      { amount: 240.00, category: 'Other', description: 'Luxury Brand Cologne Store', date: '2026-06-08', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 14.00, category: 'Transport', description: 'Metro Subcard Refill', date: '2026-06-10', is_subscription: 0, is_unusual: 0, account: 'Orange Money' },
      { amount: 50.00, category: 'Food', description: 'Pizza Party Delivery', date: '2026-06-11', is_subscription: 0, is_unusual: 0, account: 'MTN MoMo' },
      { amount: 75.00, category: 'Bills', description: 'Water Bill Payment Utilities', date: '2026-06-12', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 12.99, category: 'Bills', description: 'Github Copilot Pro Subscription', date: '2026-06-13', is_subscription: 1, is_unusual: 0, account: 'Virtual Card' },
      { amount: 45.00, category: 'Transport', description: 'Car Wash Full Detail Service', date: '2026-06-14', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 25.99, category: 'Bills', description: 'Professional Online Course Subscription', date: '2026-06-15', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' }
    ];

    let sum = 0;
    for (const exp of expenses) {
      sum += exp.amount;
      await connection.query(
        "INSERT INTO expenses (user_id, amount, category, description, date, is_subscription, is_unusual, account) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [userId, exp.amount, exp.category, exp.description, exp.date, exp.is_subscription, exp.is_unusual, exp.account]
      );
    }
    console.log(`Seeded ${expenses.length} expenses. Total = ${sum.toFixed(2)} (expected: 6713.15)`);

  } catch (err) {
    console.error('Error during run:', err);
  } finally {
    await connection.end();
  }
}

run();
