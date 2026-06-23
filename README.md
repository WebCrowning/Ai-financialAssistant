# FinVision — AI-Powered Personal Finance Dashboard & Assistant

FinVision is a modern, premium glassmorphic web application built with **React**, **Node.js/Express**, and **MySQL**. It features real-time financial tracking, budget configurations, simulated automated receipt scanning, saving milestones with money transfer options, and an AI assistant providing predictive expenditure forecasts and overspending shields.

---

## 🛠️ Tech Stack & Key Integrations
1. **Frontend**: React (Vite-based) + Vanilla CSS (Custom dark glassmorphic design system).
2. **Backend**: Node.js + Express + JWT Session Security.
3. **Database**: MySQL (local via XAMPP) + Supabase (pluggable remote file storage for scanned receipt images).

---

## 🚀 Quick Start Guide

### Step 1: Start XAMPP MySQL
Ensure your XAMPP Control Panel is open and that the **MySQL** service is active. FinVision's database engine connects to MySQL at `localhost:3306` with user `root` and empty password by default.

### Step 2: Configure Environment Settings (Optional)
If you'd like to integrate active Supabase storage for scanned receipts, edit the environment configurations inside `backend/.env`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_public_key
```

### Step 3: Run the Backend API Server
Navigate to the `backend` folder and start the API server:
```bash
cd backend
npm run start
```
*Note: The server will automatically connect to MySQL, create the `financial_assistance` database, verify all tables, and seed the default testing accounts.*

### Step 4: Run the React Development Server
In a new terminal window, navigate to the `frontend` folder and launch the Vite dev server:
```bash
cd frontend
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🔑 Default Seed accounts for testing

- **Standard User**:
  - **Email**: `user@finvision.com`
  - **Password**: `userpassword`
- **System Administrator**:
  - **Email**: `admin@finvision.com`
  - **Password**: `adminpassword`

---

## 🌟 Core Functionality Overview

1. **Dual Role Access Control**:
   - **Admin Portal**: View audit trails (user actions logged dynamically), see registered users, and provision/remove user accounts.
   - **User Portal**: Manage budgets, savings, and expense ledgers.

2. **Log Cash Expense via Photo Scan (Receipt Scanner)**:
   - Upload any photo of a receipt. Experience the animated blue scanning overlay while the OCR engine parses description text keywords and amounts, updating databases.

3. **Guardian Overspending & Subscription Shield**:
   - Compares month-to-date outflows to your expected monthly income.
   - Toggling **Guardian Shield Mode ON** will refuse excessive outflows and block unusual subscriptions (e.g. costs exceeding category thresholds by 1.5x) with descriptive warnings.

4. **Saving Goal Milestones**:
   - Establish targets (e.g., buying a laptop or phone) and track progress bars.
   - **Inter-Goal Transfer**: Shift money instantly between defined goals.

5. **Tomorrow's Forecasts & AI suggestions**:
   - Predictions of tomorrow's expenditures based on average daily spending trends and utility bill schedules.
   - Dynamic system recommendations (e.g. flagging high subscription ratios or overspent targets).

6. **Scheduled Irregular Income Logging**:
   - Log freelance/gig income. Simulate background schedulers executing every 5 minutes using the automated trigger button.

7. **1-Page Printable Statement Sheet**:
   - Sleek print page layouts to download a PDF summary or print statements.
