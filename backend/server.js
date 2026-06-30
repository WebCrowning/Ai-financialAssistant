const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const XLSX = require('xlsx');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });


const db = require('./db');
const { authenticateToken, requireAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'finvision_super_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if not exists
const uploadsDir = process.env.VERCEL ? require('os').tmpdir() : path.join(__dirname, 'uploads');
if (!process.env.VERCEL && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer receipt upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Supabase Integration Setup (simulated/pluggable)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
let supabaseClient = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase integration successfully initialized!');
  } catch (err) {
    console.warn('Failed to load @supabase/supabase-js package. Standard local storage will be used.', err.message);
  }
} else {
  console.log('Running in local MySQL mode. Set SUPABASE_URL and SUPABASE_KEY in .env for active Supabase storage integration.');
}

// Activity Logging Helper
async function logUserActivity(userId, action, details) {
  try {
    await db.query(
      'INSERT INTO user_activities (user_id, action, details) VALUES (?, ?, ?)',
      [userId, action, details]
    );
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
}

// ================= AUTH ROUTES =================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, monthlyIncome } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if user exists
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO users (email, password, role, monthly_income) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, 'user', monthlyIncome || 0.00]
    );

    const userId = result.insertId;

    // Set up default budgets for the new user
    await db.query(
      'INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
      [userId, 'Food', 300.00, userId, 'Rent', 800.00, userId, 'Bills', 200.00]
    );

    await logUserActivity(userId, 'Account Registration', `User registered with email: ${email}`);

    // Create token
    const token = jwt.sign({ id: userId, email, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      token,
      user: { id: userId, email, role: 'user', monthly_income: monthlyIncome || 0.00, guardian_mode: 1 }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login request received:', { email, password });
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      // Demo credentials fallback — create the demo user in DB if missing so we always have a valid ID
      if (email === 'user@finvision.com' && password === 'userpassword') {
        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash('userpassword', salt);
        const [insertResult] = await db.query(
          'INSERT INTO users (email, password, role, monthly_income) VALUES (?, ?, ?, ?)',
          [email, hashedPw, 'user', 3500.00]
        );
        const demoUser = { id: insertResult.insertId, email, role: 'user', monthly_income: 3500, guardian_mode: 1 };
        // Seed default budgets
        await db.query(
          'INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
          [demoUser.id, 'Food', 500.00, demoUser.id, 'Rent', 1200.00, demoUser.id, 'Bills', 300.00]
        );
        const token = jwt.sign({ id: demoUser.id, email: demoUser.email, role: demoUser.role }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, user: demoUser });
      }
      if (email === 'admin@finvision.com' && password === 'adminpassword') {
        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash('adminpassword', salt);
        const [insertResult] = await db.query(
          'INSERT INTO users (email, password, role, monthly_income) VALUES (?, ?, ?, ?)',
          [email, hashedPw, 'admin', 5000.00]
        );
        const demoUser = { id: insertResult.insertId, email, role: 'admin', monthly_income: 5000, guardian_mode: 1 };
        const token = jwt.sign({ id: demoUser.id, email: demoUser.email, role: demoUser.role }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, user: demoUser });
      }
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    await logUserActivity(user.id, 'User Login', `Logged in from IP/Session.`);

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, monthly_income: user.monthly_income, guardian_mode: user.guardian_mode, display_name: user.display_name }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get profile details
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, email, role, monthly_income, guardian_mode, display_name, profile_image FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update settings (monthly income or guardian mode)
app.put('/api/auth/settings', authenticateToken, async (req, res) => {
  const { monthly_income, guardian_mode, display_name } = req.body;
  try {
    if (monthly_income !== undefined) {
      await db.query('UPDATE users SET monthly_income = ? WHERE id = ?', [monthly_income, req.user.id]);
    }
    if (guardian_mode !== undefined) {
      await db.query('UPDATE users SET guardian_mode = ? WHERE id = ?', [guardian_mode ? 1 : 0, req.user.id]);
    }
    if (display_name !== undefined) {
      await db.query('UPDATE users SET display_name = ? WHERE id = ?', [display_name, req.user.id]);
    }
    await logUserActivity(req.user.id, 'Update Settings', `Updated profile settings.`);
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings' });
  }
});

// ================= PROFILE IMAGE ROUTES =================

// Upload profile image (local uploads)
app.post('/api/auth/profile-image', authenticateToken, upload.single('profile_image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }

  try {
    const imageUrl = `/uploads/${req.file.filename}`;
    await db.query('UPDATE users SET profile_image = ? WHERE id = ?', [imageUrl, req.user.id]);

    await logUserActivity(req.user.id, 'Upload Profile Image', `Uploaded profile image: ${req.file.originalname}`);

    return res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Profile image upload failed:', error);
    return res.status(500).json({ message: 'Failed to upload image' });
  }
});

// Remove profile image
app.delete('/api/auth/profile-image', authenticateToken, async (req, res) => {
  try {
    // Fetch current image url before removing (best-effort delete file)
    const [rows] = await db.query('SELECT profile_image FROM users WHERE id = ?', [req.user.id]);
    const current = rows?.[0]?.profile_image;

    await db.query('UPDATE users SET profile_image = NULL WHERE id = ?', [req.user.id]);
    await logUserActivity(req.user.id, 'Remove Profile Image', 'Removed profile image');

    return res.json({ success: true });
  } catch (error) {
    console.error('Profile image remove failed:', error);
    return res.status(500).json({ message: 'Failed to remove image' });
  }
});


// ================= EXPENSE ROUTES =================


// Get all expenses for current user
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC', [req.user.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses' });
  }
});

// Create new expense (with overspending and subscription alerts)
app.post('/api/expenses', authenticateToken, async (req, res) => {
  const { amount, category, description, date, is_subscription, account } = req.body;
  if (!amount || !category || !date) {
    return res.status(400).json({ message: 'Amount, category and date are required' });
  }

  try {
    // 1. Fetch user details for Guardian blocking & Monthly income checks
    const [userRows] = await db.query('SELECT monthly_income, guardian_mode FROM users WHERE id = ?', [req.user.id]);
    const user = userRows[0];

    // 2. Fetch category budget to check overspending
    const [budgetRows] = await db.query('SELECT limit_amount FROM budgets WHERE user_id = ? AND category = ?', [req.user.id, category]);
    const categoryLimit = budgetRows.length > 0 ? budgetRows[0].limit_amount : null;

    // 3. Fetch current monthly expenses
    const [expenseSum] = await db.query(
      "SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND MONTH(date) = MONTH(?) AND YEAR(date) = YEAR(?)",
      [req.user.id, date, date]
    );
    const currentMonthTotal = parseFloat(expenseSum[0].total || 0);
    const newMonthTotal = currentMonthTotal + parseFloat(amount);

    // Check Guardian refusal:
    // Refuse if:
    // - User has Guardian Mode ON AND:
    //   - The category budget limit is exceeded by this transaction, OR
    //   - It is an unusual subscription cost (subscription > $50, or double-entry simulation)
    let isUnusual = 0;
    if (is_subscription) {
      if (parseFloat(amount) > 50.00 || description.toLowerCase().includes('unused') || description.toLowerCase().includes('fitness')) {
        isUnusual = 1;
      }
    }

    const budgetExceeded = categoryLimit && (newMonthTotal > categoryLimit);
    const incomeExceeded = newMonthTotal > parseFloat(user.monthly_income);

    if (user.guardian_mode === 1) {
      // Habit/Refusal simulation: Block the transaction if budget exceeded on Food/Rent/Bills by more than 20% or unusual subscription
      if ((is_subscription && isUnusual) || (categoryLimit && (parseFloat(amount) > categoryLimit * 1.5))) {
        await logUserActivity(req.user.id, 'Transaction Refused', `Guardian blocked unusual transaction: $${amount} for ${description}`);
        return res.status(400).json({
          refused: true,
          message: `Guardian System Refused: Unusual subscription or extreme overspending detected ($${amount} for ${description}). You can disable Guardian Mode in Settings to bypass this constraint.`
        });
      }
    }

    // Insert expense
    const [result] = await db.query(
      'INSERT INTO expenses (user_id, amount, category, description, date, is_subscription, is_unusual, account) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, amount, category, description || '', date, is_subscription ? 1 : 0, isUnusual, account || 'Main Bank Account']
    );

    await logUserActivity(req.user.id, 'Log Expense', `Added expense: $${amount} in ${category}`);

    // Compile alerts
    const alerts = [];
    if (incomeExceeded) {
      alerts.push({
        type: 'income_exceeded',
        message: `Warning: Your total monthly expenses ($${newMonthTotal.toFixed(2)}) now exceed your monthly income ($${parseFloat(user.monthly_income).toFixed(2)})!`
      });
    }
    if (budgetExceeded) {
      alerts.push({
        type: 'budget_exceeded',
        message: `Alert: You spent more than your allocated $${categoryLimit} budget limit for category: ${category}!`
      });
    }
    if (is_subscription && isUnusual) {
      alerts.push({
        type: 'unusual_subscription',
        message: `Guardian: Unusual or duplicate subscription logged ($${amount} for ${description}). Consider canceling.`
      });
    }

    res.status(201).json({
      success: true,
      expenseId: result.insertId,
      alerts
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging expense' });
  }
});

// Scan receipt (Mock OCR + Supabase interaction)
app.post('/api/expenses/scan', authenticateToken, upload.single('receipt'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No receipt file uploaded' });
  }

  try {
    let finalUrl = `/uploads/${req.file.filename}`;

    // Upload to Supabase if config exists
    if (supabaseClient) {
      const fileBuffer = fs.readFileSync(req.file.path);
      const fileName = `receipts/${Date.now()}-${req.file.originalname}`;

      const { data, error } = await supabaseClient.storage
        .from('receipts-bucket')
        .upload(fileName, fileBuffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (!error) {
        const { data: publicData } = supabaseClient.storage
          .from('receipts-bucket')
          .getPublicUrl(fileName);
        finalUrl = publicData.publicUrl;
        console.log('Successfully uploaded receipt to Supabase storage:', finalUrl);
      } else {
        console.error('Supabase upload error (falling back to local file):', error);
      }
    }

    // Mock OCR engine - parses text from receipt filename or triggers dummy logic
    // We parse basic data points based on keywords to make the scan interactive
    const filenameLower = req.file.originalname.toLowerCase();

    let amount = 24.99;
    let category = 'Food';
    let description = 'Mock Restaurant';
    let date = new Date().toISOString().split('T')[0];
    let is_subscription = 0;

    if (filenameLower.includes('netflix') || filenameLower.includes('sub')) {
      amount = 15.99;
      category = 'Bills';
      description = 'Netflix Subscription';
      is_subscription = 1;
    } else if (filenameLower.includes('uber') || filenameLower.includes('taxi')) {
      amount = 32.50;
      category = 'Other';
      description = 'Uber ride';
    } else if (filenameLower.includes('walmart') || filenameLower.includes('grocery')) {
      amount = 124.80;
      category = 'Food';
      description = 'Walmart Groceries';
    } else if (filenameLower.includes('electric') || filenameLower.includes('power')) {
      amount = 85.00;
      category = 'Bills';
      description = 'Electric Bill';
    }

    // Create DB entry
    const [result] = await db.query(
      'INSERT INTO expenses (user_id, amount, category, description, date, receipt_url, is_subscription, account) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, amount, category, description, date, finalUrl, is_subscription, 'Main Bank Account']
    );

    await logUserActivity(req.user.id, 'Log Expense via Receipt Scan', `Scanned receipt: ${req.file.originalname} -> $${amount}`);

    res.json({
      success: true,
      expense: {
        id: result.insertId,
        amount,
        category,
        description,
        date,
        receipt_url: finalUrl,
        is_subscription
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error scanning receipt' });
  }
});


// ================= BUDGET ROUTES =================

// Get budgets
app.get('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM budgets WHERE user_id = ?', [req.user.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets' });
  }
});

// Upsert budget limit (For Rent, Food, Utilities/Light bills, House rent, etc.)
app.post('/api/budgets', authenticateToken, async (req, res) => {
  const { category, limit_amount } = req.body;
  if (!category || limit_amount === undefined) {
    return res.status(400).json({ message: 'Category and limit amount are required' });
  }

  try {
    await db.query(
      'INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE limit_amount = VALUES(limit_amount)',
      [req.user.id, category, limit_amount]
    );

    await logUserActivity(req.user.id, 'Set Budget Limit', `Set $${limit_amount} budget limit for ${category}`);
    res.json({ success: true, message: `Budget limit updated for ${category}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error setting budget limit' });
  }
});


// ================= GOAL ROUTES =================

// Get goals
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM goals WHERE user_id = ?', [req.user.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching goals' });
  }
});

// Create Goal (e.g. buying laptop, phone)
app.post('/api/goals', authenticateToken, async (req, res) => {
  const { name, target_amount, current_amount, deadline } = req.body;
  if (!name || !target_amount) {
    return res.status(400).json({ message: 'Goal name and target amount are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, name, target_amount, current_amount || 0.00, deadline || null]
    );

    await logUserActivity(req.user.id, 'Create Goal', `Created goal "${name}" with target $${target_amount}`);
    res.status(201).json({ success: true, goalId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating goal' });
  }
});

// Add money to a goal
app.post('/api/goals/:id/add', authenticateToken, async (req, res) => {
  const goalId = req.params.id;
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }
  try {
    await db.query(
      'UPDATE goals SET current_amount = current_amount + ? WHERE id = ? AND user_id = ?',
      [amount, goalId, req.user.id]
    );
    await logUserActivity(req.user.id, 'Fund Goal', `Added CFA ${amount} to goal ID: ${goalId}`);
    res.json({ success: true, message: 'Added savings successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error funding goal' });
  }
});

// Delete a goal
app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  const goalId = req.params.id;
  try {
    await db.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [goalId, req.user.id]);
    await logUserActivity(req.user.id, 'Delete Goal', `Deleted goal ID: ${goalId}`);
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting goal' });
  }
});

// Move money between goals
app.post('/api/goals/transfer', authenticateToken, async (req, res) => {
  const { fromGoalId, toGoalId, amount } = req.body;
  if (!fromGoalId || !toGoalId || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid transfer parameters' });
  }

  const connection = await db.getPool().getConnection();
  try {
    await connection.beginTransaction();

    // 1. Check fromGoal balance
    const [fromRows] = await connection.query('SELECT name, current_amount FROM goals WHERE id = ? AND user_id = ?', [fromGoalId, req.user.id]);
    if (fromRows.length === 0) {
      throw new Error('Source goal not found');
    }
    const fromGoal = fromRows[0];
    if (parseFloat(fromGoal.current_amount) < parseFloat(amount)) {
      throw new Error(`Insufficient funds in source goal "${fromGoal.name}"`);
    }

    // 2. Check toGoal existence
    const [toRows] = await connection.query('SELECT name FROM goals WHERE id = ? AND user_id = ?', [toGoalId, req.user.id]);
    if (toRows.length === 0) {
      throw new Error('Destination goal not found');
    }
    const toGoal = toRows[0];

    // 3. Deduct from source
    await connection.query('UPDATE goals SET current_amount = current_amount - ? WHERE id = ?', [amount, fromGoalId]);

    // 4. Add to destination
    await connection.query('UPDATE goals SET current_amount = current_amount + ? WHERE id = ?', [amount, toGoalId]);

    await connection.commit();

    await logUserActivity(req.user.id, 'Move Money', `Transferred $${amount} from goal "${fromGoal.name}" to "${toGoal.name}"`);
    res.json({ success: true, message: `Transferred $${amount} from "${fromGoal.name}" to "${toGoal.name}" successfully.` });

  } catch (error) {
    await connection.rollback();
    res.status(400).json({ message: error.message || 'Error transferring goal funds' });
  } finally {
    connection.release();
  }
});


// ================= INCOME ROUTES =================

// Get all incomes
app.get('/api/income', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM income WHERE user_id = ? ORDER BY logged_at DESC', [req.user.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching income logs' });
  }
});

// Log income (handles irregular income)
app.post('/api/income', authenticateToken, async (req, res) => {
  const { amount, source, category, is_irregular } = req.body;
  if (!amount || !source) {
    return res.status(400).json({ message: 'Amount and source are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO income (user_id, amount, source, category, is_irregular) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, amount, source, category || 'salary', is_irregular ? 1 : 0]
    );

    await logUserActivity(req.user.id, 'Log Income', `Logged $${amount} from ${source} (${category || 'salary'}) (${is_irregular ? 'Irregular' : 'Regular'})`);

    // If irregular income is logged, simulate immediate update, and send message about logging it "in 5 minutes" tracker
    res.status(201).json({
      success: true,
      incomeId: result.insertId,
      message: is_irregular
        ? `Irregular income of $${amount} registered. The system scheduled a wallet sync check within 5 minutes.`
        : `Regular income logged successfully.`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging income' });
  }
});

// Demo/Simulation route: Trigger quick irregular income log simulating background worker in 5 mins
app.post('/api/income/simulate-irregular', authenticateToken, async (req, res) => {
  const amount = (Math.random() * 200 + 50).toFixed(2);
  const sources = ['Freelance Writing', 'Sold Old Textbook', 'Consulting Tip', 'Gardening Service'];
  const source = sources[Math.floor(Math.random() * sources.length)];

  // Immediately respond that it will log in 5 minutes, but simulate it via server trigger
  // For standard user interactivity, let's log it after a short server-side timeout (e.g. 5 seconds for demonstration, representing 5 mins)
  setTimeout(async () => {
    try {
      await db.query(
        'INSERT INTO income (user_id, amount, source, is_irregular) VALUES (?, ?, ?, 1)',
        [req.user.id, amount, source]
      );
      await logUserActivity(req.user.id, 'Irregular Income Logged (Auto-5min)', `Irregular income system logged $${amount} from ${source}`);
      console.log(`Auto logged irregular income $${amount} for user ${req.user.id}`);
    } catch (e) {
      console.error(e);
    }
  }, 5000); // 5 seconds simulation for live frontend updates

  res.json({
    success: true,
    message: `Irregular Income Automation Triggered: An auto-log of irregular income ($${amount}) will sync to your dashboard in the background in 5 seconds (simulating 5 minutes scheduler).`
  });
});

// Update income
app.put('/api/income/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { amount, source, category } = req.body;

  if (!amount || !source) {
    return res.status(400).json({ message: 'Amount and source are required' });
  }

  try {
    const [income] = await db.query('SELECT * FROM income WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (income.length === 0) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    await db.query(
      'UPDATE income SET amount = ?, source = ?, category = ? WHERE id = ? AND user_id = ?',
      [amount, source, category || 'salary', id, req.user.id]
    );

    await logUserActivity(req.user.id, 'Update Income', `Updated income from ${income[0].source} to ${source} ($${amount})`);

    res.json({
      success: true,
      message: 'Income record updated successfully.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating income' });
  }
});

// Delete income
app.delete('/api/income/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [income] = await db.query('SELECT * FROM income WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (income.length === 0) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    await db.query('DELETE FROM income WHERE id = ? AND user_id = ?', [id, req.user.id]);

    await logUserActivity(req.user.id, 'Delete Income', `Deleted income from ${income[0].source} ($${income[0].amount})`);

    res.json({
      success: true,
      message: 'Income record deleted successfully.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting income' });
  }
});


// ================= ADMIN ROUTES =================

// Get users list (Admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, email, role, monthly_income, guardian_mode, created_at FROM users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users list' });
  }
});

// Add user (Admin only)
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  const { email, password, role, monthlyIncome } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO users (email, password, role, monthly_income) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, role || 'user', monthlyIncome || 0.00]
    );

    // Default budgets
    await db.query(
      'INSERT INTO budgets (user_id, category, limit_amount) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
      [result.insertId, 'Food', 300.00, result.insertId, 'Rent', 800.00, result.insertId, 'Bills', 200.00]
    );

    await logUserActivity(req.user.id, 'Admin Add User', `Admin created user account for: ${email}`);
    res.status(201).json({ success: true, userId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding user' });
  }
});

// Remove user (Admin only)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const userId = req.params.id;
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own admin account' });
  }

  try {
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    await logUserActivity(req.user.id, 'Admin Remove User', `Admin deleted user account ID: ${userId}`);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// View all activities (Admin only)
app.get('/api/admin/activities', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const queryStr = `
      SELECT ua.*, u.email as user_email 
      FROM user_activities ua 
      JOIN users u ON ua.user_id = u.id 
      ORDER BY ua.timestamp DESC 
      LIMIT 100
    `;
    const [rows] = await db.query(queryStr);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching activities' });
  }
});


// ================= AI ASSISTANT & FORECASTS =================

app.get('/api/assistant/insights', authenticateToken, async (req, res) => {
  try {
    // 1. Fetch recent user expenses
    const [expenses] = await db.query('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC', [req.user.id]);

    // 2. Fetch category budgets
    const [budgets] = await db.query('SELECT * FROM budgets WHERE user_id = ?', [req.user.id]);

    // 3. Fetch monthly income
    const [userRows] = await db.query('SELECT monthly_income, guardian_mode FROM users WHERE id = ?', [req.user.id]);
    const monthlyIncome = parseFloat(userRows[0].monthly_income);

    // --- AUTO-SUGGESTIONS LOGIC ---
    const suggestions = [];
    let overspentCategories = [];
    const categoryTotals = {};
    let totalSpent = 0;
    let subscriptionCount = 0;
    let subscriptionTotal = 0;

    expenses.forEach(exp => {
      const amt = parseFloat(exp.amount);
      totalSpent += amt;
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
      if (exp.is_subscription) {
        subscriptionCount++;
        subscriptionTotal += amt;
      }
    });

    // Generate suggestions based on data
    budgets.forEach(bud => {
      const limit = parseFloat(bud.limit_amount);
      const spent = categoryTotals[bud.category] || 0;
      if (spent > limit) {
        overspentCategories.push(bud.category);
        suggestions.push({
          category: 'budget',
          title: `Reduce ${bud.category} Spending`,
          text: `You have exceeded your ${bud.category} budget by $${(spent - limit).toFixed(2)}. Try pausing non-essential logs here.`,
          severity: 'high'
        });
      } else if (spent > limit * 0.85) {
        suggestions.push({
          category: 'budget',
          title: `${bud.category} Near Limit`,
          text: `You spent 85% of your ${bud.category} budget. Keep tracking to avoid going over.`,
          severity: 'medium'
        });
      }
    });

    if (subscriptionTotal > monthlyIncome * 0.15) {
      suggestions.push({
        category: 'subscription',
        title: 'High Subscription Costs',
        text: `Subscriptions account for $${subscriptionTotal.toFixed(2)} (${((subscriptionTotal / monthlyIncome) * 100).toFixed(1)}% of your income). Check for unused or duplicated tools.`,
        severity: 'medium'
      });
    }

    // Default suggestions if none triggered
    if (suggestions.length === 0) {
      suggestions.push({
        category: 'general',
        title: 'Healthy Budgeting',
        text: 'Great job! All category expenses are currently within your defined thresholds.',
        severity: 'low'
      });
    }

    // Add tomorrow's forecast
    // Math: tomorrow's forecast = (daily average variable spending) + (recurring subscription daily equivalent if any bills due soon)
    const distinctDays = new Set(expenses.map(e => e.date)).size || 1;
    const dailyAvg = totalSpent / distinctDays;

    // Tomorrow's bills forecast simulation
    let billsForecast = 0.00;
    // Check if food, lights, or utilities is close to averaging
    const foodAvg = (categoryTotals['Food'] || 0) / distinctDays;
    const billsAvg = (categoryTotals['Bills'] || 0) / distinctDays;

    // Estimate tomorrow's spending
    const estimatedTomorrow = dailyAvg + (billsAvg > 0 ? 5.00 : 0);

    res.json({
      suggestions,
      forecast: {
        estimatedTomorrow: parseFloat(estimatedTomorrow.toFixed(2)),
        explanation: `Based on your average daily spend of $${dailyAvg.toFixed(2)} over ${distinctDays} active days, plus predictive utility bills cycle projections.`,
        upcomingBills: [
          { name: 'Average Utility Bill Pro-rata', amount: (billsAvg || 2.5).toFixed(2), due: 'Tomorrow' },
          { name: 'Estimated Food / Miscellaneous', amount: (foodAvg || 12.0).toFixed(2), due: 'Tomorrow' }
        ]
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating AI insights' });
  }
});


// ================= CHATBOT ANALYTICS ROUTES =================

// Get current user expenditure data
app.get('/api/chatbot-analytics/expenditure', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Get transactions for this month
    let [transactions] = await db.query(
      `SELECT * FROM transactions 
       WHERE user_id = ? AND transaction_date >= ? 
       ORDER BY transaction_date DESC`,
      [userId, firstDayOfMonth]
    );

    // Fallback: If no transactions in current month, fetch all transactions for this user
    if (transactions.length === 0) {
      [transactions] = await db.query(
        `SELECT * FROM transactions 
         WHERE user_id = ? 
         ORDER BY transaction_date DESC LIMIT 500`,
        [userId]
      );
    }

    if (transactions.length === 0) {
      return res.json({
        totalExpenditure: 0,
        averageDaily: 0,
        topCategory: 'No data',
        transactionCount: 0
      });
    }

    // Calculate expenditure metrics
    const totalExpenditure = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Get unique days with transactions
    const uniqueDays = new Set(transactions.map(t =>
      new Date(t.transaction_date).toDateString()
    )).size;

    const averageDaily = uniqueDays > 0 ? totalExpenditure / uniqueDays : totalExpenditure;

    // Get top spending category
    const categoryTotals = {};
    transactions.forEach(t => {
      const category = t.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(t.amount || 0);
    });

    const topCategory = Object.keys(categoryTotals).length > 0
      ? Object.keys(categoryTotals).reduce((a, b) =>
        categoryTotals[a] > categoryTotals[b] ? a : b
      )
      : 'Not available';

    res.json({
      totalExpenditure: parseFloat(totalExpenditure.toFixed(2)),
      averageDaily: parseFloat(averageDaily.toFixed(2)),
      topCategory,
      transactionCount: transactions.length,
      distinctDays: uniqueDays,
      categoryBreakdown: categoryTotals
    });

  } catch (error) {
    console.error('Error fetching expenditure data:', error);
    res.status(500).json({ message: 'Error fetching expenditure data' });
  }
});

// Parse SMS Export file (MTN Mobile Money format)
function parseSMSExport(content) {
  try {
    // Split into lines
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];

    // Find the header row
    let headerIndex = -1;
    let dataStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('date') && line.includes('time') && line.includes('direction') && line.includes('content')) {
        headerIndex = i;
        dataStartIndex = i + 1;
        break;
      }
    }

    // If no header found, try to parse using pattern matching
    if (headerIndex === -1) {
      return parseSMSByPattern(lines);
    }

    // Determine the delimiter dynamically
    let delimiter = '|';
    const headerLine = lines[headerIndex];
    if (headerLine.includes('|')) {
      delimiter = '|';
    } else if (headerLine.includes(',')) {
      delimiter = ',';
    } else if (headerLine.includes('\t')) {
      delimiter = '\t';
    }

    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase());

    // Map headers to indices
    const dateIdx = headers.indexOf('date');
    const timeIdx = headers.indexOf('time');
    const directionIdx = headers.indexOf('direction');
    const contactIdx = headers.indexOf('contact');
    const phoneIdx = headers.indexOf('phone');
    const contentIdx = headers.indexOf('content');
    const typeIdx = headers.indexOf('type');

    const transactions = [];

    for (let i = dataStartIndex; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim());

      // If columns are less than content index, we can't extract the message
      if (cols.length <= Math.max(dateIdx, timeIdx, contentIdx)) continue;

      const date = cols[dateIdx] || '';
      const time = cols[timeIdx] || '';
      const direction = directionIdx !== -1 ? cols[directionIdx] : '';
      const contact = contactIdx !== -1 ? cols[contactIdx] : '';
      const phone = phoneIdx !== -1 ? cols[phoneIdx] : '';
      const contentText = cols[contentIdx] || '';
      const type = typeIdx !== -1 ? cols[typeIdx] : 'SMS';

      // Only process SMS messages (case-insensitive check)
      if (type && type.toUpperCase() !== 'SMS' && type !== '') continue;

      // Parse the SMS content to extract financial data
      const parsed = parseSMSContent(contentText, date, time);
      if (parsed) {
        transactions.push({
          date,
          time,
          direction,
          contact,
          phone,
          content: contentText,
          type,
          ...parsed
        });
      }
    }

    return transactions;
  } catch (error) {
    console.error('Error parsing SMS export:', error);
    return [];
  }
}

// Parse SMS by pattern matching (fallback)
function parseSMSByPattern(lines) {
  const transactions = [];
  let currentDate = '';
  let currentTime = '';

  for (const line of lines) {
    // Try to find date pattern (2026-01-29)
    const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      currentDate = dateMatch[1];
    }

    // Try to find time pattern (00:45:41)
    const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
    if (timeMatch) {
      currentTime = timeMatch[1];
    }

    // Check if it's a MobileMoney message or contains transaction keywords
    const lineLower = line.toLowerCase();
    if (
      lineLower.includes('mobilemoney') ||
      lineLower.includes('momo') ||
      lineLower.includes('received') ||
      lineLower.includes('transferred') ||
      lineLower.includes('payment of') ||
      lineLower.includes('withdrawn')
    ) {
      const parsed = parseSMSContent(line, currentDate, currentTime);
      if (parsed) {
        transactions.push({
          date: currentDate,
          time: currentTime,
          direction: parsed.isIncome ? 'Received' : 'Sent',
          contact: 'MobileMoney',
          phone: 'MobileMoney',
          content: line,
          type: 'SMS',
          ...parsed
        });
      }
    }
  }

  return transactions;
}

// Parse individual SMS content
function parseSMSContent(content, date, time) {
  if (!content) return null;
  const text = content.toLowerCase();

  const result = {
    transactionType: 'unknown',
    amount: 0,
    fee: 0,
    balance: 0,
    sender: '',
    receiver: '',
    description: '',
    isIncome: false,
    isExpense: false,
    category: 'Other'
  };

  const parseAmount = (matchStr) => {
    if (!matchStr) return 0;
    return parseFloat(matchStr.replace(/,/g, '').replace(/\s/g, '')) || 0;
  };

  // Balance Inquiry
  if (text.includes('current balance') && text.includes('available balance')) {
    const balanceMatch = text.match(/(?:current|available)\s*balance[:\s]*([\d,.]+)/i) || text.match(/(?:current balance|available balance)[:\s]*([\d,.]+)/i);
    if (balanceMatch) {
      result.balance = parseAmount(balanceMatch[1]);
      result.transactionType = 'balance_check';
      result.description = 'Balance Inquiry';
      result.category = 'Balance';
      return result;
    }
  }

  // Received payment / deposit received
  if (
    text.includes('you have received') ||
    text.includes('received from') ||
    text.includes('has sent you') ||
    text.includes('deposit of') ||
    text.includes('deposited by')
  ) {
    const amountMatch = text.match(/(?:received|sent you|deposit of|deposited by)\s*(?:of)?\s*(?:fcfa|xaf)?\s*([\d,.]+)\s*(?:xaf|fcfa|fcf a)?/i) ||
      text.match(/(?:received|sent you|deposit of|deposited by)\s*([\d,.]+)/i);

    let amount = 0;
    if (amountMatch) amount = parseAmount(amountMatch[1]);

    if (amount > 0) {
      result.amount = amount;
      result.transactionType = 'receive';
      result.isIncome = true;
      result.isExpense = false;
      result.description = 'Received Money';

      const senderMatch = text.match(/(?:from|of|by)\s+([^(\d]+)(?:\(|on|ref:)/i) ||
        text.match(/(?:from|by)\s+([a-zA-Z\s]+)\b/i);
      if (senderMatch) {
        result.sender = senderMatch[1].trim();
        result.description = `Received from ${senderMatch[1].trim()}`;
      }

      const balanceMatch = text.match(/(?:new balance|balance)[:\s]*([\d,.]+)/i);
      if (balanceMatch) {
        result.balance = parseAmount(balanceMatch[1]);
      }

      if (text.includes('betpawa') || text.includes('gaming') || text.includes('1xbet') || text.includes('ennovative')) {
        result.category = 'Gaming/Betting';
        result.description = 'Betpawa/Gaming Withdrawal';
      } else if (text.includes('transfer') || text.includes('momo')) {
        result.category = 'Transfer';
      } else {
        result.category = 'Received Payment';
      }
      return result;
    }
  }

  // Merchant payments / transaction of X by Y
  if (text.includes('transaction of')) {
    const amountMatch = text.match(/transaction\s+of\s*(?:fcfa|xaf)?\s*([\d,.]+)\s*(?:xaf|fcfa|fcf a)?/i) ||
      text.match(/transaction\s+of\s*([\d,.]+)/i);
    let amount = 0;
    if (amountMatch) amount = parseAmount(amountMatch[1]);

    if (amount > 0) {
      result.amount = amount;
      result.transactionType = 'payment';
      result.isIncome = false;
      result.isExpense = true;

      const receiverMatch = text.match(/by\s+([^(\d]+)(?:\(|on|ref:)/i) ||
        text.match(/by\s+([a-zA-Z\s_]+)\b/i);
      if (receiverMatch) {
        result.receiver = receiverMatch[1].trim();
        result.description = `Transaction via ${receiverMatch[1].trim()}`;
      } else {
        result.description = 'Mobile Money Transaction';
      }

      const feeMatch = text.match(/fee\s+was\s*([\d,.]+)\s*(?:xaf|fcfa|fcf a)?/i);
      if (feeMatch) {
        result.fee = parseAmount(feeMatch[1]);
      }

      const balanceMatch = text.match(/(?:new balance|balance)[:\s]*([\d,.]+)/i);
      if (balanceMatch) {
        result.balance = parseAmount(balanceMatch[1]);
      }

      if (text.includes('bundles') || text.includes('airtime') || text.includes('bundle') || text.includes('internet')) {
        result.category = 'Airtime/Bundles';
      } else if (text.includes('betpawa') || text.includes('gaming') || text.includes('1xbet') || text.includes('ennovative')) {
        result.category = 'Gaming/Betting';
      } else if (text.includes('transfer') || text.includes('transferred')) {
        result.category = 'Transfer';
      } else {
        result.category = 'Payment';
      }

      return result;
    }
  }

  // Payment / transfer / withdrawal / purchase / platform transfer
  if (
    text.includes('your payment of') ||
    text.includes('you have transferred') ||
    text.includes('you have withdrawn') ||
    text.includes('payment of') ||
    text.includes('transferred to') ||
    text.includes('withdrawn from') ||
    text.includes('purchase of') ||
    text.includes('purchased') ||
    text.includes('withdrawal of') ||
    text.includes('pay to')
  ) {
    const amountMatch = text.match(/(?:payment|transfer|withdrawn|transferred|withdrew|purchase|purchased|withdrawal|pay)\s*(?:of)?\s*(?:fcfa|xaf)?\s*([\d,.]+)\s*(?:xaf|fcfa|fcf a)?/i) ||
      text.match(/(?:payment|transfer|withdrawn|transferred|withdrew|purchase|purchased|withdrawal|pay)\s*(?:of)?\s*(?:fcfa|xaf)?\s*([\d,.]+)/i);
    let amount = 0;
    if (amountMatch) amount = parseAmount(amountMatch[1]);

    if (amount > 0) {
      result.amount = amount;
      result.transactionType = (text.includes('withdraw') || text.includes('withdrawal')) ? 'withdrawal' : 'payment';
      result.isIncome = false;
      result.isExpense = true;

      const receiverMatch = text.match(/to\s+([^(\d]+)(?:\(|on|ref:)/i) ||
        text.match(/at\s+([^(\d]+)(?:\(|on|ref:)/i);
      if (receiverMatch) {
        result.receiver = receiverMatch[1].trim();
        result.description = result.transactionType === 'withdrawal' ? `Cash Withdrawal at ${receiverMatch[1].trim()}` : `Payment to ${receiverMatch[1].trim()}`;
      } else {
        result.description = result.transactionType === 'withdrawal' ? 'Cash Withdrawal' : 'Payment / Transfer';
      }

      const feeMatch = text.match(/(?:fee|charges)[:\s]*([\d,.]+)/i);
      if (feeMatch) {
        result.fee = parseAmount(feeMatch[1]);
      }

      const balanceMatch = text.match(/(?:new balance|balance)[:\s]*([\d,.]+)/i);
      if (balanceMatch) {
        result.balance = parseAmount(balanceMatch[1]);
      }

      if (text.includes('bundles') || text.includes('airtime') || text.includes('bundle') || text.includes('internet')) {
        result.category = 'Airtime/Bundles';
        result.description = 'MTN Airtime/Bundles';
      } else if (text.includes('betpawa') || text.includes('gaming') || text.includes('1xbet') || text.includes('ennovative')) {
        result.category = 'Gaming/Betting';
        result.description = 'Betpawa/Gaming Deposit';
      } else if (text.includes('transfer') || text.includes('transferred')) {
        result.category = 'Transfer';
        if (result.receiver) {
          result.description = `Transfer to ${result.receiver}`;
        }
      } else if (result.transactionType === 'withdrawal') {
        result.category = 'Withdrawal';
      } else {
        result.category = 'Payment';
      }
      return result;
    }
  }

  // Advance/loan
  if (text.includes('advance') || text.includes('xtracash') || text.includes('loan')) {
    const amountMatch = text.match(/(?:advance|loan|xtracash)\s*(?:of)?\s*(?:fcfa|xaf)?\s*([\d,.]+)/i);
    if (amountMatch) {
      result.amount = parseAmount(amountMatch[1]);
      result.transactionType = 'advance';
      result.isIncome = true;
      result.isExpense = false;
      result.category = 'Loan/Advance';
      result.description = 'Mobile Money Advance';
      return result;
    }
  }

  // Repayment
  if (text.includes('repaid from your account') || text.includes('loan repayment') || text.includes('repayment of')) {
    const amountMatch = text.match(/(?:amount|repayment|repaid)\s*(?:of)?\s*(?:fcfa|xaf)?\s*([\d,.]+)/i);
    if (amountMatch) {
      result.amount = parseAmount(amountMatch[1]);
      result.transactionType = 'repayment';
      result.isIncome = false;
      result.isExpense = true;
      result.category = 'Loan Repayment';
      result.description = 'Advance Repayment';
      return result;
    }
  }

  return null;
}

// Parse Excel Workbook (MTN Mobile Money export)
function parseExcelExport(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let headerIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (Array.isArray(row)) {
        const rowStr = row.map(cell => String(cell || '').toLowerCase()).join('|');
        if (rowStr.includes('date') && rowStr.includes('time') && rowStr.includes('direction') && rowStr.includes('content')) {
          headerIndex = i;
          break;
        }
      }
    }

    if (headerIndex === -1) {
      console.warn('Could not find header row in Excel file');
      return [];
    }

    const headers = rows[headerIndex].map(h => String(h || '').trim().toLowerCase());
    const dateIdx = headers.indexOf('date');
    const timeIdx = headers.indexOf('time');
    const directionIdx = headers.indexOf('direction');
    const contactIdx = headers.indexOf('contact');
    const phoneIdx = headers.indexOf('phone');
    const contentIdx = headers.indexOf('content');
    const typeIdx = headers.indexOf('type');

    const transactions = [];

    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const date = dateIdx !== -1 ? String(row[dateIdx] || '').trim() : '';
      const time = timeIdx !== -1 ? String(row[timeIdx] || '').trim() : '';
      const direction = directionIdx !== -1 ? String(row[directionIdx] || '').trim() : '';
      const contact = contactIdx !== -1 ? String(row[contactIdx] || '').trim() : '';
      const phone = phoneIdx !== -1 ? String(row[phoneIdx] || '').trim() : '';
      const contentText = contentIdx !== -1 ? String(row[contentIdx] || '').trim() : '';
      const type = typeIdx !== -1 ? String(row[typeIdx] || '').trim() : 'SMS';

      if (!contentText) continue;

      const parsed = parseSMSContent(contentText, date, time);
      if (parsed) {
        transactions.push({
          date,
          time,
          direction,
          contact,
          phone,
          content: contentText,
          type,
          ...parsed
        });
      }
    }

    return transactions;
  } catch (error) {
    console.error('Error parsing Excel export:', error);
    return [];
  }
}

// Enhanced upload route
app.post('/api/chatbot-analytics/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    let transactions = [];
    if (fileExt === '.xlsx' || fileExt === '.xls') {
      transactions = parseExcelExport(filePath);
    } else {
      const content = fs.readFileSync(filePath, 'utf-8');
      transactions = parseSMSExport(content);
    }

    // Store parsed transactions in database
    for (const t of transactions) {
      let dbDate = new Date();
      if (t.date) {
        const parsedDate = new Date(t.date);
        if (!isNaN(parsedDate.getTime())) {
          dbDate = parsedDate;
        }
      }

      const category = t.category || 'Other';
      const description = t.description || t.content || 'SMS Transaction';
      const amount = t.amount || 0;
      const type = t.isIncome ? 'credit' : 'debit';

      // Check for duplicate to avoid multiple inserts of the same transaction
      const [existing] = await db.query(
        'SELECT id FROM transactions WHERE user_id = ? AND amount = ? AND transaction_date = ? AND description = ?',
        [req.user.id, amount, dbDate, description]
      );

      if (existing.length === 0) {
        await db.query(
          `INSERT INTO transactions (user_id, amount, category, description, transaction_date, transaction_type, account) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [req.user.id, amount, category, description, dbDate, type, 'MTN Mobile Money']
        );
      }
    }

    // Calculate summary statistics
    const totalIncome = transactions
      .filter(t => t.isIncome)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.isExpense)
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    // Category breakdown
    const categoryBreakdown = {};
    transactions.forEach(t => {
      const category = t.category || 'Other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + t.amount;
    });

    // Top senders/receivers
    const contacts = {};
    transactions.forEach(t => {
      if (t.sender) {
        contacts[t.sender] = (contacts[t.sender] || 0) + t.amount;
      }
      if (t.receiver) {
        contacts[t.receiver] = (contacts[t.receiver] || 0) + t.amount;
      }
    });

    const sortedContacts = Object.entries(contacts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Store in database or memory
    const summary = {
      totalTransactions: transactions.length,
      totalIncome,
      totalExpenses,
      netBalance,
      categoryBreakdown,
      topContacts: sortedContacts,
      dateRange: {
        start: transactions.length > 0 ? transactions[transactions.length - 1].date : null,
        end: transactions.length > 0 ? transactions[0].date : null
      }
    };

    res.json({
      success: true,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      recordCount: transactions.length,
      transactions: transactions, // Return all parsed transactions for client preview
      summary,
      message: `Successfully parsed ${transactions.length} SMS transactions`
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Enhanced analyze route
app.post('/api/chatbot-analytics/analyze', authenticateToken, async (req, res) => {
  try {
    const { query, hasFileData, expenditureData, fileAnalysis } = req.body;
    const userId = req.user.id;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        message: 'API key not configured',
        analysis: 'I apologize, but the AI service is not properly configured. Please contact support.'
      });
    }

    // Build context for AI with various data sources
    let context = `You are a financial advisor AI assistant helping users understand their financial situation, including SMS transactions, website store purchases, manually recorded expenses, and income.\n\n`;

    let activeTransactions = [];

    // Check if we have fileAnalysis passed from frontend
    if (fileAnalysis && fileAnalysis.transactions && fileAnalysis.transactions.length > 0) {
      activeTransactions = fileAnalysis.transactions;
    } else {
      // Fallback: load transactions and other financial data from the database
      const [dbTransactions] = await db.query(
        'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC, id DESC LIMIT 200',
        [userId]
      );

      const [dbExpenses] = await db.query(
        'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT 100',
        [userId]
      );

      const [dbIncome] = await db.query(
        'SELECT * FROM income WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT 50',
        [userId]
      );

      const [dbOrders] = await db.query(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50',
        [userId]
      );

      if (dbTransactions.length > 0 || dbExpenses.length > 0 || dbIncome.length > 0 || dbOrders.length > 0) {
        const mappedTransactions = dbTransactions.map(t => ({
          date: t.transaction_date,
          amount: parseFloat(t.amount),
          category: t.category || 'Transaction',
          description: t.description,
          isIncome: t.transaction_type === 'credit',
          isExpense: t.transaction_type === 'debit',
          transactionType: t.transaction_type === 'credit' ? 'receive' : 'payment',
          source: 'SMS/Bank'
        }));

        const mappedExpenses = dbExpenses.map(e => ({
          date: e.date,
          amount: parseFloat(e.amount),
          category: e.category || 'Expense',
          description: e.description,
          isIncome: false,
          isExpense: true,
          transactionType: 'payment',
          source: 'Manual Expense'
        }));

        const mappedIncome = dbIncome.map(i => ({
          date: i.date,
          amount: parseFloat(i.amount),
          category: i.category || 'Income',
          description: i.source,
          isIncome: true,
          isExpense: false,
          transactionType: 'receive',
          source: 'Income Record'
        }));

        const mappedOrders = dbOrders.map(o => {
          let items = [];
          try { items = JSON.parse(o.items_json); } catch (e) {}
          const desc = items.map(i => i.name).join(', ') || 'Store Purchase';
          return {
            date: o.created_at,
            amount: parseFloat(o.total_amount),
            category: 'Store Purchase',
            description: desc,
            isIncome: false,
            isExpense: true,
            transactionType: 'payment',
            source: 'Website Store'
          };
        });

        activeTransactions = [...mappedTransactions, ...mappedExpenses, ...mappedIncome, ...mappedOrders];
      }
    }

    if (activeTransactions.length > 0) {
      const totalIncome = activeTransactions.filter(t => t.isIncome).reduce((s, t) => s + t.amount, 0);
      const totalExpenses = activeTransactions.filter(t => t.isExpense).reduce((s, t) => s + t.amount, 0);
      const netBalance = totalIncome - totalExpenses;

      context += `📊 **Financial Data Analysis Summary**\n`;
      context += `• Total Records: ${activeTransactions.length}\n`;
      context += `• Total Income: CFA ${totalIncome.toLocaleString()}\n`;
      context += `• Total Expenses: CFA ${totalExpenses.toLocaleString()}\n`;
      context += `• Net Balance: CFA ${netBalance.toLocaleString()}\n\n`;

      // Category breakdown
      const categories = {};
      activeTransactions.forEach(t => {
        const cat = t.category || 'Other';
        categories[cat] = (categories[cat] || 0) + t.amount;
      });

      context += `📂 **Category Breakdown:**\n`;
      Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, amount]) => {
          context += `• ${cat}: CFA ${amount.toLocaleString()}\n`;
        });

      // Top transactions
      context += `\n💰 **Largest Transactions:**\n`;
      activeTransactions
        .slice()
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)
        .forEach(t => {
          let dateStr = t.date;
          if (t.date instanceof Date) {
            dateStr = t.date.toISOString().split('T')[0];
          }
          context += `• ${dateStr}: [${t.source || 'Unknown'}] ${t.description || t.transactionType} - CFA ${t.amount.toLocaleString()}\n`;
        });

      context += `\n\nUser Query: ${query}\n\n`;
      context += `Provide specific, actionable financial advice based on this comprehensive financial data (including website purchases, recorded expenses, and income).`;

    } else if (expenditureData) {
      context += `📊 **Expenditure Data:**\n`;
      context += `• Total Monthly Expenditure: CFA ${expenditureData.totalExpenditure || 0}\n`;
      context += `• Average Daily Spending: CFA ${expenditureData.averageDaily || 0}\n`;
      context += `• Top Spending Category: ${expenditureData.topCategory}\n`;
      context += `• Total Transactions: ${expenditureData.transactionCount || 0}\n\n`;
      context += `User Query: ${query}\n\n`;
      context += `Provide helpful, specific financial advice based on the data provided.`;
    } else {
      context += `No financial data available yet. Please log some expenses, income, make store purchases, or upload an SMS export file.\n\n`;
      context += `User Query: ${query}\n\n`;
      context += `Provide general financial advice and encourage the user to log their financial data on the website.`;
    }

    console.log('📤 Sending to OpenRouter with context:', context.substring(0, 500) + '...');

    // Call OpenRouter API
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: context
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-OpenRouter-Title': 'FinVision AI Assistant'
        }
      }
    );

    const analysis = response.data.choices[0]?.message?.content ||
      'I could not generate a response. Please try again.';

    // Store conversation
    await db.query(
      `INSERT INTO chatbot_conversations (user_id, query, response) VALUES (?, ?, ?)`,
      [userId, query, analysis]
    ).catch(err => console.warn('Could not store conversation:', err));

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error analyzing query:', error.message);

    let fallbackAnalysis = 'I encountered an error processing your request. ';

    if (error.response?.status === 429) {
      fallbackAnalysis += 'The AI service is temporarily busy. Please try again in a few moments.';
    } else if (error.code === 'ECONNREFUSED') {
      fallbackAnalysis += 'Unable to connect to the AI service. Please check your internet connection.';
    } else {
      fallbackAnalysis += 'Here are some general financial tips:\n\n';
      fallbackAnalysis += '• Review your spending categories regularly\n';
      fallbackAnalysis += '• Set monthly budgets for each category\n';
      fallbackAnalysis += '• Look for opportunities to reduce unnecessary expenses\n';
      fallbackAnalysis += '• Save at least 10-15% of your income\n';
      fallbackAnalysis += 'Please try your question again later.';
    }

    res.status(500).json({
      message: 'Error analyzing query',
      analysis: fallbackAnalysis
    });
  }
});

// Get chat history for current user
app.get('/api/chatbot-analytics/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      'SELECT query, response, created_at FROM chatbot_conversations WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Error fetching chat history' });
  }
});

// Clear chat history for current user
app.delete('/api/chatbot-analytics/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query('DELETE FROM chatbot_conversations WHERE user_id = ?', [userId]);
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ message: 'Error clearing chat history' });
  }
});


// ================= EXPENSE EDIT / DELETE =================


// Edit expense
app.put('/api/expenses/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { amount, category, description, date, account } = req.body;
  if (!amount || !category || !date) {
    return res.status(400).json({ message: 'Amount, category and date are required' });
  }
  try {
    const [expense] = await db.query('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (expense.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    await db.query(
      'UPDATE expenses SET amount = ?, category = ?, description = ?, date = ?, account = ? WHERE id = ? AND user_id = ?',
      [amount, category, description || '', date, account || expense[0].account, id, req.user.id]
    );
    await logUserActivity(req.user.id, 'Edit Expense', `Updated expense: ${description} (CFA ${amount})`);
    res.json({ success: true, message: 'Expense updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating expense' });
  }
});

// Delete expense
app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [expense] = await db.query('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (expense.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    await db.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    await logUserActivity(req.user.id, 'Delete Expense', `Deleted expense: ${expense[0].description} (CFA ${expense[0].amount})`);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting expense' });
  }
});


// ================= NOTIFICATIONS =================

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const [expenses] = await db.query('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
    const [budgets] = await db.query('SELECT * FROM budgets WHERE user_id = ?', [req.user.id]);
    const [userRows] = await db.query('SELECT monthly_income, guardian_mode FROM users WHERE id = ?', [req.user.id]);
    const [goals] = await db.query('SELECT * FROM goals WHERE user_id = ?', [req.user.id]);
    const monthlyIncome = parseFloat(userRows[0]?.monthly_income || 0);

    const notifications = [];

    // Budget alerts
    const categoryTotals = {};
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + parseFloat(exp.amount);
    });

    budgets.forEach(bud => {
      const limit = parseFloat(bud.limit_amount);
      const spent = categoryTotals[bud.category] || 0;
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      if (spent > limit) {
        notifications.push({
          id: `budget-exceeded-${bud.id}`,
          type: 'budget_exceeded',
          severity: 'critical',
          title: `${bud.category} Budget Exceeded`,
          message: `You have exceeded your ${bud.category} budget by CFA ${Math.round(spent - limit).toLocaleString()}. Budget: CFA ${Math.round(limit).toLocaleString()}, Spent: CFA ${Math.round(spent).toLocaleString()}.`,
          timestamp: new Date().toISOString()
        });
      } else if (pct >= 85) {
        notifications.push({
          id: `budget-warning-${bud.id}`,
          type: 'budget_warning',
          severity: 'warning',
          title: `${bud.category} Budget Warning (${Math.round(pct)}% used)`,
          message: `You've used ${Math.round(pct)}% of your ${bud.category} budget. Only CFA ${Math.round(limit - spent).toLocaleString()} remaining out of CFA ${Math.round(limit).toLocaleString()}.`,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Unusual expense alerts
    const unusualExpenses = expenses.filter(e => e.is_unusual === 1);
    unusualExpenses.slice(0, 5).forEach(exp => {
      notifications.push({
        id: `unusual-${exp.id}`,
        type: 'unusual_spending',
        severity: 'warning',
        title: 'Unusual Transaction Detected',
        message: `"${exp.description}" (CFA ${parseFloat(exp.amount).toLocaleString()}) on ${exp.date} was flagged as an unusual transaction by the Guardian system.`,
        timestamp: new Date(exp.date).toISOString()
      });
    });

    // Total income vs expenses alert
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    if (monthlyIncome > 0 && totalExpenses > monthlyIncome) {
      notifications.push({
        id: 'income-exceeded',
        type: 'income_exceeded',
        severity: 'critical',
        title: '⚠️ Spending Exceeds Monthly Income',
        message: `Your total recorded expenses (CFA ${Math.round(totalExpenses).toLocaleString()}) have exceeded your declared monthly income (CFA ${Math.round(monthlyIncome).toLocaleString()}). Consider reviewing your spending or updating your income.`,
        timestamp: new Date().toISOString()
      });
    }

    // Subscription cost alert
    const subscriptionTotal = expenses.filter(e => e.is_subscription).reduce((sum, e) => sum + parseFloat(e.amount), 0);
    if (monthlyIncome > 0 && subscriptionTotal > monthlyIncome * 0.15) {
      notifications.push({
        id: 'high-subscriptions',
        type: 'subscription_alert',
        severity: 'info',
        title: 'High Subscription Costs',
        message: `Your subscription services total CFA ${Math.round(subscriptionTotal).toLocaleString()} (${Math.round((subscriptionTotal / monthlyIncome) * 100)}% of your income). Consider reviewing unused subscriptions.`,
        timestamp: new Date().toISOString()
      });
    }

    // Goal deadline alerts
    goals.forEach(goal => {
      if (goal.deadline) {
        const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        const progress = parseFloat(goal.current_amount) / parseFloat(goal.target_amount);
        if (daysLeft <= 30 && daysLeft > 0 && progress < 0.8) {
          notifications.push({
            id: `goal-deadline-${goal.id}`,
            type: 'goal_deadline',
            severity: 'warning',
            title: `Goal Deadline Approaching: ${goal.name}`,
            message: `Only ${daysLeft} days left to reach your "${goal.name}" goal. You are at ${Math.round(progress * 100)}% progress (CFA ${parseFloat(goal.current_amount).toLocaleString()} / CFA ${parseFloat(goal.target_amount).toLocaleString()}).`,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Sort by severity: critical first
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    notifications.sort((a, b) => (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2));

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});


// ================= ADMIN SYSTEM ANALYTICS =================

app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [[userCount]] = await db.query('SELECT COUNT(*) as count FROM users');
    const [[expenseCount]] = await db.query('SELECT COUNT(*) as count FROM expenses');
    const [[totalExpenseRow]] = await db.query('SELECT SUM(amount) as total FROM expenses');
    const [[totalIncomeRow]] = await db.query('SELECT SUM(amount) as total FROM income');
    const [[goalCount]] = await db.query('SELECT COUNT(*) as count FROM goals');
    const [[activityCount]] = await db.query('SELECT COUNT(*) as count FROM user_activities');
    const [[unusualCount]] = await db.query('SELECT COUNT(*) as count FROM expenses WHERE is_unusual = 1');
    const [[subscriptionCount]] = await db.query('SELECT COUNT(*) as count FROM expenses WHERE is_subscription = 1');
    const [topActions] = await db.query('SELECT action, COUNT(*) as count FROM user_activities GROUP BY action ORDER BY count DESC LIMIT 6');
    const [recentUsers] = await db.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5');
    const [categoryBreakdown] = await db.query('SELECT category, SUM(amount) as total, COUNT(*) as count FROM expenses GROUP BY category ORDER BY total DESC');

    res.json({
      totalUsers: userCount.count,
      totalExpenses: expenseCount.count,
      totalExpenseAmount: parseFloat(totalExpenseRow.total || 0),
      totalIncomeAmount: parseFloat(totalIncomeRow.total || 0),
      totalGoals: goalCount.count,
      totalActivities: activityCount.count,
      unusualTransactions: unusualCount.count,
      subscriptionCount: subscriptionCount.count,
      netFlow: parseFloat(totalIncomeRow.total || 0) - parseFloat(totalExpenseRow.total || 0),
      topActions,
      recentUsers,
      categoryBreakdown
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching system stats' });
  }
});


// ================= ACCOUNT SUMMARY =================

app.get('/api/accounts', authenticateToken, async (req, res) => {
  try {
    const [expenses] = await db.query('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
    const [incomes] = await db.query('SELECT * FROM income WHERE user_id = ? ORDER BY logged_at DESC', [req.user.id]);

    // Define account base balances
    const accountBases = {
      'Main Bank Account': 125500,
      'MTN MoMo': 45200,
      'Orange Money': 30000,
      'Virtual Card': 50000
    };

    const [deposits] = await db.query('SELECT * FROM deposits WHERE user_id = ? AND status = "completed"', [req.user.id]);

    const providerMap = {
      'mtn': 'MTN MoMo',
      'orange': 'Orange Money',
      'airtel': 'Airtel Money',
      'vodafone': 'Vodafone Cash'
    };

    const accounts = Object.keys(accountBases).map(accountName => {
      const accountExpenses = expenses.filter(e => (e.account || 'Main Bank Account') === accountName);
      const totalSpent = accountExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      const accountDeposits = deposits.filter(d => (providerMap[d.provider] || 'MTN MoMo') === accountName);
      const totalDeposited = accountDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);

      const balance = accountBases[accountName] + totalDeposited - totalSpent;
      return {
        name: accountName,
        baseBalance: accountBases[accountName],
        totalDeposited,
        totalSpent,
        balance,
        transactionCount: accountExpenses.length + accountDeposits.length,
        recentTransactions: accountExpenses.slice(0, 5)
      };
    });

    res.json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching accounts' });
  }
});


// ================= VIRTUAL CARD ROUTES =================

// Get virtual cards for current user
app.get('/api/virtual-cards', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, user_id, card_name, card_type, card_number, expiry_date, cvv, card_holder, spending_limit, card_color, is_primary, status, created_at FROM virtual_cards WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // Ensure only one primary is returned per user (defensive)
    // If multiple rows somehow have is_primary=1, the last one in the ordered list is considered primary.
    const primaries = rows.filter(r => Number(r.is_primary) === 1);
    if (primaries.length > 1) {
      const keepId = primaries[primaries.length - 1].id;
      await db.query('UPDATE virtual_cards SET is_primary = CASE WHEN id = ? THEN 1 ELSE 0 END WHERE user_id = ?', [keepId, req.user.id]);
      const [fixed] = await db.query(
        'SELECT id, user_id, card_name, card_type, card_number, expiry_date, cvv, card_holder, spending_limit, card_color, is_primary, status, created_at FROM virtual_cards WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id]
      );
      return res.json(fixed);
    }

    res.json(rows);
  } catch (error) {
    console.error('Error fetching virtual cards:', error);
    res.status(500).json({ message: 'Error fetching virtual cards' });
  }
});


// Create virtual card
app.post('/api/virtual-cards', authenticateToken, async (req, res) => {
  const {
    card_name,
    card_type,
    card_number,
    expiry_date,
    cvv,
    card_holder,
    spending_limit,
    card_color,
    status
  } = req.body;

  if (!card_name || !card_type || !card_number || !expiry_date || !cvv || !card_holder) {
    return res.status(400).json({ message: 'Missing required virtual card fields' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO virtual_cards (user_id, card_name, card_type, card_number, expiry_date, cvv, card_holder, spending_limit, card_color, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        card_name,
        card_type,
        card_number,
        expiry_date,
        cvv,
        card_holder,
        spending_limit ?? 0,
        card_color ?? 0,
        status ?? 'active'
      ]
    );

    const [cards] = await db.query('SELECT * FROM virtual_cards WHERE id = ? AND user_id = ?', [result.insertId, req.user.id]);
    res.status(201).json(cards[0]);
  } catch (error) {
    console.error('Error creating virtual card:', error);
    res.status(500).json({ message: 'Failed to create virtual card' });
  }
});

// Delete virtual card
app.delete('/api/virtual-cards/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    const [cards] = await db.query('SELECT id FROM virtual_cards WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!cards || cards.length === 0) return res.status(404).json({ message: 'Virtual card not found' });

    await db.query('DELETE FROM virtual_cards WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ success: true, message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Error deleting virtual card:', error);
    res.status(500).json({ message: 'Failed to delete card' });
  }
});

// Toggle card status
app.patch('/api/virtual-cards/:id/status', authenticateToken, async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  if (!status || !['active', 'frozen'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const [cards] = await db.query('SELECT id FROM virtual_cards WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!cards || cards.length === 0) return res.status(404).json({ message: 'Virtual card not found' });

    await db.query('UPDATE virtual_cards SET status = ? WHERE id = ? AND user_id = ?', [status, id, req.user.id]);

    const [updated] = await db.query('SELECT * FROM virtual_cards WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating virtual card status:', error);
    res.status(500).json({ message: 'Failed to update card status' });
  }
});

// Set primary virtual card (only one per user)
app.patch('/api/virtual-cards/:id/primary', authenticateToken, async (req, res) => {
  const id = req.params.id;

  try {
    const [cards] = await db.query('SELECT id FROM virtual_cards WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!cards || cards.length === 0) return res.status(404).json({ message: 'Virtual card not found' });

    await db.query('UPDATE virtual_cards SET is_primary = 0 WHERE user_id = ?', [req.user.id]);
    await db.query('UPDATE virtual_cards SET is_primary = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);

    const [updated] = await db.query('SELECT * FROM virtual_cards WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Error setting primary virtual card:', error);
    res.status(500).json({ message: 'Failed to set primary virtual card' });
  }
});

// Ensure deleted/unset cards don't break checkout: only one primary per user
app.delete('/api/virtual-cards/:id/primary', authenticateToken, async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('UPDATE virtual_cards SET is_primary = 0 WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error unsetting primary virtual card:', error);
    res.status(500).json({ message: 'Failed to unset primary virtual card' });
  }
});


// Get primary virtual card for user
app.get('/api/virtual-cards/primary', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM virtual_cards WHERE user_id = ? AND is_primary = 1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch (error) {
    console.error('Error fetching primary virtual card:', error);
    res.status(500).json({ message: 'Failed to fetch primary virtual card' });
  }
});

// ================= DEPOSIT ROUTES =================

// Get deposits history
app.get('/api/deposits', authenticateToken, async (req, res) => {
  try {
    // Automatically fail pending deposits older than 6 minutes
    await db.query(
      `UPDATE deposits 
       SET status = 'failed' 
       WHERE status = 'pending' 
       AND created_at < NOW() - INTERVAL 6 MINUTE`
    );

    const [rows] = await db.query(
      'SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({ message: 'Error fetching deposits' });
  }
});

// Admin: Get all deposits (pending + completed)
app.get('/api/admin/deposits', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Automatically fail pending deposits older than 6 minutes
    await db.query(
      `UPDATE deposits 
       SET status = 'failed' 
       WHERE status = 'pending' 
       AND created_at < NOW() - INTERVAL 6 MINUTE`
    );

    const [rows] = await db.query(
      `SELECT d.*, u.email as depositor_email, u.role as depositor_role
       FROM deposits d
       JOIN users u ON d.user_id = u.id
       ORDER BY d.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching admin deposits:', error);
    res.status(500).json({ message: 'Error fetching deposits' });
  }
});

// Record completed/pending deposit
app.post('/api/deposits', authenticateToken, async (req, res) => {
  const { amount, phone, provider, reference, status } = req.body;
  if (!amount || !phone || !provider || !reference) {
    return res.status(400).json({ message: 'Missing required deposit fields' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO deposits (user_id, amount, phone, provider, reference, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, amount, phone, provider, reference, status || 'completed']
    );

    // If completed, record as an income/wallet credit to automatically update user balances
    if (status === 'completed') {
      const providerName = provider === 'mtn' ? 'MTN MoMo' :
        provider === 'orange' ? 'Orange Money' :
          provider === 'airtel' ? 'Airtel Money' :
            provider === 'vodafone' ? 'Vodafone Cash' : 'Mobile Money';

      await db.query(
        'INSERT INTO income (user_id, amount, source, category, notes, is_irregular) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, amount, `${providerName} Deposit`, 'deposit', `Mobile Money deposit from ${phone} (Ref: ${reference})`, 1]
      );

      await logUserActivity(req.user.id, 'Mobile Money Deposit', `Deposited CFA ${amount} via ${providerName}`);
    }

    res.status(201).json({ success: true, depositId: result.insertId });
  } catch (error) {
    console.error('Error creating deposit:', error);
    res.status(500).json({ message: 'Failed to record deposit' });
  }
});

// ================= STORE SIMULATION ROUTES =================

// Get all store products
app.get('/api/store/products', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM store_products ORDER BY category, name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get user orders history
app.get('/api/store/orders', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.*, vc.card_name, vc.card_number, vc.card_type 
       FROM orders o 
       LEFT JOIN virtual_cards vc ON o.card_id = vc.id 
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Process product purchase with virtual card simulation
app.post('/api/store/purchase', authenticateToken, async (req, res) => {
  const { card_number, expiry_date, cvv, card_holder, items, total_amount } = req.body;

  if (!card_number || !expiry_date || !cvv || !card_holder || !items || !total_amount) {
    return res.status(400).json({ message: 'Missing required checkout information.' });
  }

  const cleanCardNumber = String(card_number).replace(/\s/g, '');

  try {
    // 1. Find virtual card by card number
    const [cards] = await db.query(
      'SELECT * FROM virtual_cards WHERE REPLACE(card_number, " ", "") = ? AND user_id = ?',
      [cleanCardNumber, req.user.id]
    );

    if (cards.length === 0) {
      await logUserActivity(req.user.id, 'Transaction Refused', `Payment failed: Card ending in ${cleanCardNumber.slice(-4)} not found.`);
      return res.status(400).json({
        refused: true,
        message: 'Payment Declined: Invalid card number or card does not belong to this account.'
      });
    }

    const card = cards[0];

    // 2. Validate Expiry, CVV and Card Holder (Case-insensitive verification)
    const checkExpiry = card.expiry_date.trim() === expiry_date.trim();
    const checkCVV = card.cvv.trim() === cvv.trim();
    const checkHolder = card.card_holder.trim().toLowerCase() === card_holder.trim().toLowerCase();

    if (!checkExpiry || !checkCVV || !checkHolder) {
      let failReason = '';
      if (!checkHolder) failReason = 'Cardholder name mismatch';
      else if (!checkExpiry) failReason = 'Invalid expiry date';
      else if (!checkCVV) failReason = 'CVV verification failed';

      await logUserActivity(req.user.id, 'Transaction Refused', `Payment failed: ${failReason} for card ending in ${cleanCardNumber.slice(-4)}.`);
      return res.status(400).json({
        refused: true,
        message: `Payment Declined: Verification failed (${failReason}). Please check card inputs.`
      });
    }

    // 3. Check if card is frozen
    if (card.status === 'frozen') {
      await logUserActivity(req.user.id, 'Transaction Refused', `Payment blocked: Card "${card.card_name}" is frozen.`);
      return res.status(400).json({
        refused: true,
        message: 'Payment Declined: This virtual card is currently frozen. Please unfreeze it in Virtual Cards section.'
      });
    }

    // 4. Check card spending limit
    const purchaseAmount = parseFloat(total_amount);
    const cardLimit = parseFloat(card.spending_limit);
    if (cardLimit < purchaseAmount) {
      await logUserActivity(req.user.id, 'Transaction Refused', `Payment blocked: Insufficient limit on card "${card.card_name}" (Total: $${purchaseAmount}, Limit: $${cardLimit}).`);
      return res.status(400).json({
        refused: true,
        message: `Payment Declined: Insufficient spending limit on this virtual card. Remaining limit: $${cardLimit.toFixed(2)}, Purchase: $${purchaseAmount.toFixed(2)}.`
      });
    }

    // 5. Deduct from card spending limit and record transactions
    const pool = db.getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Deduct card limit
      await connection.query(
        'UPDATE virtual_cards SET spending_limit = spending_limit - ? WHERE id = ?',
        [purchaseAmount, card.id]
      );

      // Create Order
      const [orderResult] = await connection.query(
        'INSERT INTO orders (user_id, card_id, total_amount, items_json) VALUES (?, ?, ?, ?)',
        [req.user.id, card.id, purchaseAmount, JSON.stringify(items)]
      );

      // Prepare purchase description
      let description = `Store Purchase (Card: ${card.card_name}): `;
      if (items.length === 1) {
        description += `${items[0].name} (Qty: ${items[0].quantity})`;
      } else {
        const names = items.map(i => i.name).join(', ');
        description += `${items.length} items (${names.length > 50 ? names.slice(0, 47) + '...' : names})`;
      }

      // Format date to local YYYY-MM-DD
      const localDate = new Date().toISOString().split('T')[0];

      // Create Expense in database
      await connection.query(
        'INSERT INTO expenses (user_id, amount, category, description, date, is_subscription, is_unusual, account) VALUES (?, ?, ?, ?, ?, 0, 0, ?)',
        [
          req.user.id,
          purchaseAmount,
          'Shopping',
          description,
          localDate,
          'Virtual Card' // Maps to the Virtual Card account to reduce the account balance dynamically
        ]
      );

      await connection.commit();

      // Log success activity
      await logUserActivity(req.user.id, 'Store Purchase', `Successfully purchased goods for $${purchaseAmount} using Virtual Card "${card.card_name}".`);

      res.status(201).json({
        success: true,
        orderId: orderResult.insertId,
        message: 'Purchase completed successfully.'
      });

    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error processing store purchase:', error);
    res.status(500).json({ message: 'Error processing purchase. Please try again.' });
  }
});

// ================= FILE UPLOAD ROUTE =================

// Generic upload route for images (jobs, profiles, etc.)
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Construct a URL to access the uploaded file
  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// ================= LOCAL JOBS CRUD =================

// Get all jobs (Public/Authenticated)
app.get('/api/jobs', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM local_jobs ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

// Create job (Admin)
app.post('/api/jobs', authenticateToken, requireAdmin, async (req, res) => {
  const { title, company, location, salary, description, type, category, image_url } = req.body;
  if (!title || !company || !location || !salary || !description) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO local_jobs (title, company, location, salary, description, type, category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, company, location, salary, description, type || 'Full-Time', category || 'General Services', image_url || null]
    );

    const [newJob] = await db.query('SELECT * FROM local_jobs WHERE id = ?', [result.insertId]);
    res.status(201).json(newJob[0]);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Error creating job' });
  }
});

// Update job (Admin)
app.put('/api/jobs/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, company, location, salary, description, type, category, image_url } = req.body;
  try {
    await db.query(
      'UPDATE local_jobs SET title = ?, company = ?, location = ?, salary = ?, description = ?, type = ?, category = ?, image_url = ? WHERE id = ?',
      [title, company, location, salary, description, type, category, image_url || null, id]
    );
    res.json({ success: true, message: 'Job updated successfully' });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Error updating job' });
  }
});

// Delete job (Admin)
app.delete('/api/jobs/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM local_jobs WHERE id = ?', [id]);
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Error deleting job' });
  }
});

// ================= ADMIN STORE PRODUCT CRUD =================

// Get all store products (Admin)
app.get('/api/admin/store-products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM store_products ORDER BY category, name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching admin store products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Create store product (Admin)
app.post('/api/admin/store-products', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description, price, category, image_url, stock } = req.body;
  if (!name || price === undefined || !category || !image_url) {
    return res.status(400).json({ message: 'Name, price, category, and image_url are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO store_products (name, description, price, category, image_url, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description || '', price, category, image_url, stock ?? 100]
    );

    await logUserActivity(req.user.id, 'Admin Create Product', `Created store product: ${name} (CFA ${price})`);

    const [newProduct] = await db.query('SELECT * FROM store_products WHERE id = ?', [result.insertId]);
    res.status(201).json(newProduct[0]);
  } catch (error) {
    console.error('Error creating store product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Update store product (Admin)
app.put('/api/admin/store-products/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, image_url, stock } = req.body;

  if (!name || price === undefined || !category || !image_url) {
    return res.status(400).json({ message: 'Name, price, category, and image_url are required' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM store_products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await db.query(
      'UPDATE store_products SET name = ?, description = ?, price = ?, category = ?, image_url = ?, stock = ? WHERE id = ?',
      [name, description || '', price, category, image_url, stock ?? 100, id]
    );

    await logUserActivity(req.user.id, 'Admin Update Product', `Updated store product #${id}: ${name}`);

    const [updated] = await db.query('SELECT * FROM store_products WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating store product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete store product (Admin)
app.delete('/api/admin/store-products/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query('SELECT * FROM store_products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await db.query('DELETE FROM store_products WHERE id = ?', [id]);

    await logUserActivity(req.user.id, 'Admin Delete Product', `Deleted store product #${id}: ${existing[0].name}`);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting store product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});


// Serve React frontend build (copied to backend/public)
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// SPA fallback: always return index.html for non-API routes
app.get('*', (req, res) => {
  // If request looks like it targets a file (e.g. /assets/x.png), let express.static handle it
  // This prevents interfering with missing asset status codes.
  if (req.path.includes('.') && !req.path.endsWith('.html')) {
    return res.status(404).end();
  }

  return res.sendFile(path.join(publicDir, 'index.html'));
});

// Start server
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`FinVision server running on port ${PORT}`);
  });
}

module.exports = app;