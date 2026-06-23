const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'financial_assistance';

let pool;

async function initializeDatabase() {
  try {
    // Connect without database to create it if it doesn't exist
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD
    });

    // Only CREATE if not exists — do NOT drop (preserves user data)
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await connection.end();

    // Now, create the pool with the database selected
    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log(`Connected to MySQL database: ${DB_NAME}`);

    // Create tables (safe — only if not exist)
    await createTables();

    // Seed initial users only if DB is empty
    await seedUsers();

    // Seed store products if DB is empty
    await seedStoreProducts();

    // Seed local jobs if DB is empty
    await seedLocalJobs();

  } catch (error) {
    console.error('Error initializing database:', error);
    pool = null;
  }
}


async function createTables() {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin') DEFAULT 'user',
      monthly_income DECIMAL(10, 2) DEFAULT 0.00,
      guardian_mode TINYINT(1) DEFAULT 1,
      display_name VARCHAR(255) DEFAULT NULL,
      profile_image VARCHAR(512) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;

  const activitiesTable = `
    CREATE TABLE IF NOT EXISTS user_activities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      action VARCHAR(255) NOT NULL,
      details TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  const expensesTable = `
    CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description VARCHAR(255),
      date DATE NOT NULL,
      receipt_url VARCHAR(255) DEFAULT NULL,
      is_subscription TINYINT(1) DEFAULT 0,
      is_unusual TINYINT(1) DEFAULT 0,
      account VARCHAR(100) DEFAULT 'Main Bank Account',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  const budgetsTable = `
    CREATE TABLE IF NOT EXISTS budgets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      category VARCHAR(100) NOT NULL,
      limit_amount DECIMAL(10, 2) NOT NULL,
      UNIQUE KEY user_category (user_id, category),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  const goalsTable = `
    CREATE TABLE IF NOT EXISTS goals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      target_amount DECIMAL(10, 2) NOT NULL,
      current_amount DECIMAL(10, 2) DEFAULT 0.00,
      deadline DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  const incomeTable = `
    CREATE TABLE IF NOT EXISTS income (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      source VARCHAR(255) NOT NULL,
      category VARCHAR(100) DEFAULT 'salary',
      notes TEXT DEFAULT NULL,
      date DATE DEFAULT (CURRENT_DATE),
      is_irregular TINYINT(1) DEFAULT 0,
      logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  const chatbotConversationsTable = `
    CREATE TABLE IF NOT EXISTS chatbot_conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      query TEXT NOT NULL,
      response TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  const transactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      category VARCHAR(100),
      description VARCHAR(255),
      transaction_date DATE NOT NULL,
      transaction_type ENUM('debit', 'credit') DEFAULT 'debit',
      account VARCHAR(100) DEFAULT 'Main Bank Account',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  const virtualCardsTable = `
    CREATE TABLE IF NOT EXISTS virtual_cards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      card_name VARCHAR(255) NOT NULL,
      card_type ENUM('visa', 'mastercard', 'amex', 'discover') DEFAULT 'visa',
      card_number VARCHAR(32) NOT NULL,
      expiry_date VARCHAR(7) NOT NULL,
      cvv VARCHAR(4) NOT NULL,
      card_holder VARCHAR(255) NOT NULL,
      spending_limit DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      card_color INT DEFAULT 0,
      is_primary TINYINT(1) NOT NULL DEFAULT 0,
      status ENUM('active', 'frozen') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  const depositsTable = `
    CREATE TABLE IF NOT EXISTS deposits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      provider VARCHAR(50) NOT NULL,
      reference VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `;

  const storeProductsTable = `
    CREATE TABLE IF NOT EXISTS store_products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      image_url VARCHAR(512) NOT NULL,
      stock INT DEFAULT 100,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;

  const ordersTable = `
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      card_id INT DEFAULT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      items_json TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES virtual_cards(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `;

  const localJobsTable = `
    CREATE TABLE IF NOT EXISTS local_jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      company VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      salary VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(100) DEFAULT 'Full-Time',
      category VARCHAR(100) DEFAULT 'General Services',
      image_url VARCHAR(512) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;

  await pool.query(usersTable);
  await pool.query(activitiesTable);
  await pool.query(expensesTable);
  await pool.query(budgetsTable);
  await pool.query(goalsTable);
  await pool.query(incomeTable);
  await pool.query(chatbotConversationsTable);
  await pool.query(transactionsTable);
  await pool.query(virtualCardsTable);
  await pool.query(depositsTable);
  await pool.query(storeProductsTable);
  await pool.query(ordersTable);
  await pool.query(localJobsTable);


  // Add missing columns to existing tables (safe migrations)
  try {
    await pool.query(`ALTER TABLE income ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL`);
    await pool.query(`ALTER TABLE income ADD COLUMN IF NOT EXISTS date DATE DEFAULT (CURRENT_DATE)`);
    await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255) DEFAULT NULL`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(512) DEFAULT NULL`);
    await pool.query(`ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS is_primary TINYINT(1) NOT NULL DEFAULT 0`);
  } catch (e) {
    // Ignore if columns already exist
  }

  console.log('Database tables verified/created successfully.');
}

async function seedUsers() {
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
  if (rows[0].count === 0) {
    console.log('Seeding initial admin and user...');
    const salt = await bcrypt.genSalt(10);

    const adminPassword = await bcrypt.hash('adminpassword', salt);
    const userPassword = await bcrypt.hash('userpassword', salt);

    // Insert Admin
    const [adminResult] = await pool.query(
      'INSERT INTO users (email, password, role, monthly_income) VALUES (?, ?, ?, ?)',
      ['admin@finvision.com', adminPassword, 'admin', 5000.00]
    );

    // Insert User
    const [userResult] = await pool.query(
      'INSERT INTO users (email, password, role, monthly_income) VALUES (?, ?, ?, ?)',
      ['user@finvision.com', userPassword, 'user', 3500.00]
    );

    const adminId = adminResult.insertId;
    const userId = userResult.insertId;

    // Seed initial budgets for User
    await pool.query('INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)', [
      userId, 'Food', 500.00,
      userId, 'Rent', 1200.00,
      userId, 'Bills', 300.00,
      userId, 'Transport', 200.00,
      userId, 'Other', 400.00
    ]);

    // Seed initial goals for User
    await pool.query('INSERT INTO goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)', [
      userId, 'New Laptop', 1200.00, 200.00, '2026-12-31',
      userId, 'iPhone 17', 999.00, 50.00, '2027-06-30'
    ]);

    // Seed 42 initial expenses for User
    const mockExpenses = [
      { amount: 1200.00, category: 'Rent', description: 'Monthly Rent Payment', date: '2026-06-01', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 15.00, category: 'Bills', description: 'Unused Fitness App Subscription', date: '2026-06-02', is_subscription: 1, is_unusual: 1, account: 'Virtual Card' },
      { amount: 85.50, category: 'Food', description: 'Groceries at Supermarket', date: '2026-06-02', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 12.00, category: 'Transport', description: 'Uber Ride City Center', date: '2026-06-03', is_subscription: 0, is_unusual: 0, account: 'MTN MoMo' },
      { amount: 45.00, category: 'Food', description: 'Restaurant Dinner', date: '2026-06-03', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
      { amount: 9.99, category: 'Bills', description: 'Spotify Premium Family', date: '2026-06-04', is_subscription: 1, is_unusual: 0, account: 'Virtual Card' },
      { amount: 150.00, category: 'Other', description: 'Shopping at Zara', date: '2026-06-04', is_subscription: 0, is_unusual: 0, account: 'Main Bank Account' },
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
      { amount: 24.50, category: 'Food', description: 'Sandwiches for Picnic', date: '2026-06-15', is_subscription: 0, is_unusual: 0, account: 'MTN MoMo' },
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
      { amount: 15.20, category: 'Food', description: 'Late Night Diner Snack', date: '2026-06-15', is_subscription: 0, is_unusual: 0, account: 'MTN MoMo' }
    ];

    for (const exp of mockExpenses) {
      await pool.query(
        'INSERT INTO expenses (user_id, amount, category, description, date, is_subscription, is_unusual, account) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, exp.amount, exp.category, exp.description, exp.date, exp.is_subscription, exp.is_unusual, exp.account]
      );
    }

    // Seed initial income for User
    await pool.query('INSERT INTO income (user_id, amount, source, category, is_irregular, date) VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)', [
      userId, 3500.00, 'Monthly Salary', 'salary', 0, '2026-06-01',
      userId, 250.00, 'Freelance Web Design', 'freelance', 1, '2026-06-10'
    ]);

    // Log seeding activities
    await pool.query('INSERT INTO user_activities (user_id, action, details) VALUES (?, ?, ?), (?, ?, ?)', [
      adminId, 'System Setup', 'Admin account initialized and seeded tables.',
      userId, 'Account Registration', 'User account initialized with seed data.'
    ]);

    console.log('Seeding completed successfully.');
  }
}

async function seedStoreProducts() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM store_products');
    if (rows[0].count === 0) {
      console.log('Seeding initial store products...');

      const products = [
        // Laptops
        {
          name: 'MacBook Pro 16" (M3 Max)',
          description: 'Apple M3 Max chip with 16‑core CPU and 40‑core GPU, 48GB unified memory, 1TB SSD. Breathtaking Liquid Retina XDR display, professional power for compilation, design and editing.',
          price: 3499.00,
          category: 'Laptops',
          image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
          stock: 50
        },
        {
          name: 'Dell XPS 15 OLED Touch',
          description: 'Intel Core i9 13th Gen, NVIDIA RTX 4070, 32GB DDR5 RAM, 1TB NVMe SSD. Ultra-sharp 15.6" OLED touchscreen. High performance meets premium aesthetic.',
          price: 2199.00,
          category: 'Laptops',
          image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&q=80',
          stock: 30
        },
        {
          name: 'Lenovo ThinkPad X1 Carbon',
          description: 'Intel Core i7 vPro, 16GB LPDDR5, 512GB SSD. The legendary ultra-light business laptop with premium carbon fiber chassis and clicky, satisfying keyboard.',
          price: 1599.00,
          category: 'Laptops',
          image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&q=80',
          stock: 45
        },
        {
          name: 'Asus ROG Zephyrus G14',
          description: 'AMD Ryzen 9, NVIDIA RTX 4060, 16GB RAM, 1TB SSD, 120Hz display. Compact gaming powerhouse with an elegant white design and customizable AniMe Matrix lid.',
          price: 1499.00,
          category: 'Laptops',
          image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&q=80',
          stock: 25
        },
        {
          name: 'HP Spectre x360 2-in-1',
          description: 'Intel Core i7, 16GB RAM, 1TB SSD. Gorgeous gem-cut metallic convertible laptop. Rotates 360 degrees for tablet, tent, or laptop mode with stylus included.',
          price: 1299.00,
          category: 'Laptops',
          image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&q=80',
          stock: 20
        },
        {
          name: 'Microsoft Surface Laptop 5',
          description: 'Intel Core i5, 8GB RAM, 256GB SSD, PixelSense touch screen. Sleek Alcantara palm rest, whisper-quiet operation, and clean minimalist finish.',
          price: 999.00,
          category: 'Laptops',
          image_url: 'https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?w=500&q=80',
          stock: 35
        },
        // Phones
        {
          name: 'iPhone 15 Pro Max',
          description: 'Titanium design, A17 Pro chip, Action button, advanced triple camera system with 5x telephoto zoom, and USB-C connectivity.',
          price: 1199.00,
          category: 'Phones',
          image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&q=80',
          stock: 60
        },
        {
          name: 'Samsung Galaxy S24 Ultra',
          description: 'Galaxy AI integration, Snapdragon 8 Gen 3, quad-camera system with 200MP lens, integrated S Pen stylus, and titanium armor frame.',
          price: 1299.00,
          category: 'Phones',
          image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&q=80',
          stock: 55
        },
        {
          name: 'Google Pixel 8 Pro',
          description: 'Google Tensor G3 chip, advanced AI features (Magic Eraser, Audio Magic Eraser), temperature sensor, and premium matte glass design.',
          price: 999.00,
          category: 'Phones',
          image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&q=80',
          stock: 40
        },
        {
          name: 'OnePlus 12 5G',
          description: 'Snapdragon 8 Gen 3, 16GB RAM, 512GB SSD, 100W SuperVOOC flash charge, Hasselblad triple camera system. Exceptional performance-to-price ratio.',
          price: 799.00,
          category: 'Phones',
          image_url: 'https://images.unsplash.com/photo-1565849906461-0e25eb5f7e6e?w=500&q=80',
          stock: 30
        },
        {
          name: 'Xiaomi 14 Ultra',
          description: 'Leica professional optics, quad-camera array with 1-inch main sensor, Snapdragon 8 Gen 3, and stunning micro-curved display.',
          price: 1099.00,
          category: 'Phones',
          image_url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500&q=80',
          stock: 15
        },
        {
          name: 'Nothing Phone (2)',
          description: 'Unique transparent back with custom Glyph interface, Snapdragon 8+ Gen 1, 6.7" OLED display, and Nothing OS fast widget UI.',
          price: 599.00,
          category: 'Phones',
          image_url: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=500&q=80',
          stock: 25
        },
        // Wearables
        {
          name: 'Apple Watch Series 9',
          description: 'S9 chip with double-tap gesture, bright Always-On Retina display, blood oxygen monitoring, ECG, and sleep tracking metrics.',
          price: 399.00,
          category: 'Wearables',
          image_url: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=500&q=80',
          stock: 50
        },
        {
          name: 'Samsung Galaxy Watch 6',
          description: 'Advanced sleep coaching, heart rhythm alerts, personalized heart rate zones, and a slim rotating bezel UI.',
          price: 299.00,
          category: 'Wearables',
          image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&q=80',
          stock: 45
        },
        {
          name: 'Garmin Fenix 7 Pro Sapphire',
          description: 'Rugged multisport GPS watch with solar charging, built-in LED flashlight, preloaded topo maps, and extensive performance metrics.',
          price: 699.00,
          category: 'Wearables',
          image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
          stock: 18
        },
        {
          name: 'Apple Watch Ultra 2',
          description: 'The ultimate rugged watch. Titanium case, up to 72 hours battery life, precise dual-frequency GPS, siren, and diving computer certification.',
          price: 799.00,
          category: 'Wearables',
          image_url: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?w=500&q=80',
          stock: 20
        },
        {
          name: 'Google Pixel Watch 2',
          description: 'Polished aluminum case, Fitbit health tracking, stress detection, skin temperature sensor, and deep integration with Google Assistant.',
          price: 349.00,
          category: 'Wearables',
          image_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&q=80',
          stock: 25
        },
        {
          name: 'Amazfit GTR 4 Smartwatch',
          description: 'Up to 14 days battery life, dual-band circular-polarized GPS navigation, 150+ sports modes, and direct music storage/playback.',
          price: 199.00,
          category: 'Wearables',
          image_url: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=500&q=80',
          stock: 40
        },
        {
          name: 'Fitbit Charge 6 Tracker',
          description: 'Advanced fitness band with built-in GPS, YouTube Music controls, Google Maps integration, EDA stress scans, and up to 7 days battery.',
          price: 159.00,
          category: 'Wearables',
          image_url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&q=80',
          stock: 35
        },
        // Audio
        {
          name: 'Sony WH-1000XM5 ANC',
          description: 'Industry-leading active noise canceling overhead headphones, 30 hours battery life, multipoint Bluetooth, and ultra-clear microphone array.',
          price: 399.00,
          category: 'Audio',
          image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
          stock: 50
        },
        {
          name: 'Apple AirPods Max',
          description: 'Premium over-ear headphones with custom spatial audio, active noise cancellation, transparency mode, and sleek aluminum earcups.',
          price: 549.00,
          category: 'Audio',
          image_url: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=500&q=80',
          stock: 30
        },
        {
          name: 'Bose QuietComfort Ultra',
          description: 'Custom Immersive Audio, world-class active noise canceling, CustomTune sound calibration, and ultra-soft protein leather ear cushions.',
          price: 429.00,
          category: 'Audio',
          image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&q=80',
          stock: 35
        },
        {
          name: 'Sennheiser Momentum 4',
          description: 'Outstanding audiophile sound quality, active noise cancellation, custom sound profiles, and massive 60 hours battery life.',
          price: 349.00,
          category: 'Audio',
          image_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&q=80',
          stock: 40
        },
        {
          name: 'Apple AirPods Pro 2',
          description: 'USB-C charging case, MagSafe, advanced noise canceling, adaptive transparency, custom touch controls, and high fidelity acoustics.',
          price: 249.00,
          category: 'Audio',
          image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80',
          stock: 75
        },
        {
          name: 'Sony WF-1000XM5 Earbuds',
          description: 'Premium noise-canceling wireless earbuds, high-resolution audio wireless, bone conduction sensor, and compact charging case.',
          price: 299.00,
          category: 'Audio',
          image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80',
          stock: 50
        },
        {
          name: 'JBL Flip 6 Portable Speaker',
          description: 'IP67 waterproof and dustproof, 2-way speaker system, party boost pairing, and 12 hours of high-bass portable playback.',
          price: 129.00,
          category: 'Audio',
          image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80',
          stock: 60
        },
        {
          name: 'Sonos Era 100 Smart Speaker',
          description: 'Premium home acoustics speaker with WiFi, Bluetooth, line-in input, built-in voice control, and trueplay tuning.',
          price: 249.00,
          category: 'Audio',
          image_url: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&q=80',
          stock: 30
        },
        // Accessories
        {
          name: 'iPad Pro 12.9" M2',
          description: 'Liquid Retina XDR display, Apple M2 chip, high-speed 5G, Apple Pencil hover, and double-camera setup with LiDAR scanner.',
          price: 1099.00,
          category: 'Accessories',
          image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80',
          stock: 25
        },
        {
          name: 'Logitech MX Master 3S Mouse',
          description: 'Ergonomic mouse with 8000 DPI track-anywhere sensor, silent click switches, and MagSpeed electromagnetic scroll wheel.',
          price: 99.00,
          category: 'Accessories',
          image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80',
          stock: 80
        },
        {
          name: 'Keychron Q1 Mechanical Keyboard',
          description: 'Fully customizable, 75% layout keyboard with double-gasket design, hot-swappable switches, and programmable rotary knob.',
          price: 199.00,
          category: 'Accessories',
          image_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80',
          stock: 30
        },
        {
          name: 'Dell UltraSharp 34" Curved Monitor',
          description: 'Curved WQHD screen with IPS black panel technology, 90W USB-C hub connectivity, KVM switch, and custom height adjustments.',
          price: 899.00,
          category: 'Accessories',
          image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80',
          stock: 15
        },
        {
          name: 'Samsung T7 Shield 2TB SSD',
          description: 'Rugged portable solid state drive. Transfer speeds up to 1050 MB/s, IP65 water and dust resistance, drop protection.',
          price: 159.00,
          category: 'Accessories',
          image_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&q=80',
          stock: 45
        },
        {
          name: 'Anker 737 Power Bank',
          description: 'Ultra-high capacity power bank with 140W fast output, digital status display, and capacity to recharge laptops/phones simultaneously.',
          price: 149.00,
          category: 'Accessories',
          image_url: 'https://images.unsplash.com/photo-1609592424085-f58c73b067a9?w=500&q=80',
          stock: 50
        },
        {
          name: 'Elgato Stream Deck MK.2',
          description: '15 customizable LCD keys to trigger actions, launch software, adjust audio or light profiles. A necessity for productivity and streaming.',
          price: 149.00,
          category: 'Accessories',
          image_url: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=500&q=80',
          stock: 40
        },
        {
          name: 'Belkin 3-in-1 Wireless Charger',
          description: '15W magnetic wireless charging stand for iPhone, Apple Watch, and AirPods. Beautiful chrome and matte finish.',
          price: 149.00,
          category: 'Accessories',
          image_url: 'https://images.unsplash.com/photo-1622445262465-2481c4574875?w=500&q=80',
          stock: 35
        }
      ];

      for (const prod of products) {
        await pool.query(
          'INSERT INTO store_products (name, description, price, category, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)',
          [prod.name, prod.description, prod.price, prod.category, prod.image_url, prod.stock]
        );
      }
      console.log(`Store products seeded successfully: ${products.length} items.`);
    }
  } catch (error) {
    console.error('Error seeding store products:', error);
  }
}

async function seedLocalJobs() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM local_jobs');
    if (rows[0].count === 0) {
      console.log('Seeding initial local jobs...');
      const initialJobs = [
        { title: "Junior Web Developer", company: "Tech Solutions CM", location: "Douala", salary: "CFA 120,000 / month", description: "Assist in developing and maintaining web applications using React and Node.js.", type: "Full-Time", category: "Technology & IT" },
        { title: "Customer Service Representative", company: "TeleCom CM Ltd", location: "Yaoundé", salary: "CFA 80,000 / month", description: "Handle customer inquiries via phone and email, resolve issues, and maintain records.", type: "Full-Time", category: "Customer Support" },
        { title: "Data Entry Clerk", company: "Finance Corp CM", location: "Bafoussam", salary: "CFA 60,000 / month", description: "Enter financial data into internal systems, ensure accuracy and timely updates.", type: "Part-Time", category: "Administration & HR" }
      ];

      for (const job of initialJobs) {
        await pool.query(
          'INSERT INTO local_jobs (title, company, location, salary, description, type, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [job.title, job.company, job.location, job.salary, job.description, job.type, job.category]
        );
      }
      console.log('Local jobs seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding local jobs:', error);
  }
}

initializeDatabase();

module.exports = {
  query: async (text, params) => {
    if (!pool) {
      throw new Error('Database pool is not initialized (MySQL connection failed).');
    }
    return pool.query(text, params);
  },
  getPool: () => pool
};
