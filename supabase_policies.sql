-- ==============================================================================
-- COMPLETE SUPABASE RLS POLICIES FOR FINVISION DOCKER / SERVERLESS DEPLOYMENT
-- Resolves uuid = integer type errors by using subqueries to join on email.
-- Copy and run this in your Supabase SQL Editor.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. USERS Table RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated selects" ON public.users;
CREATE POLICY "Allow authenticated selects" ON public.users
  FOR SELECT TO authenticated USING (auth.email() = email);

DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.users;
CREATE POLICY "Allow authenticated inserts" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.email() = email);

DROP POLICY IF EXISTS "Allow authenticated updates" ON public.users;
CREATE POLICY "Allow authenticated updates" ON public.users
  FOR UPDATE TO authenticated USING (auth.email() = email) WITH CHECK (auth.email() = email);


-- ------------------------------------------------------------------------------
-- 2. USER-SPECIFIC TABLES RLS (using email-joins to lookup integer user_id)
-- ------------------------------------------------------------------------------

-- Expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to own expenses" ON public.expenses;
CREATE POLICY "Allow access to own expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (auth.email() = (SELECT email FROM public.users WHERE id = user_id))
  WITH CHECK (auth.email() = (SELECT email FROM public.users WHERE id = user_id));

-- Budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to own budgets" ON public.budgets;
CREATE POLICY "Allow access to own budgets" ON public.budgets
  FOR ALL TO authenticated
  USING (auth.email() = (SELECT email FROM public.users WHERE id = user_id))
  WITH CHECK (auth.email() = (SELECT email FROM public.users WHERE id = user_id));

-- Goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to own goals" ON public.goals;
CREATE POLICY "Allow access to own goals" ON public.goals
  FOR ALL TO authenticated
  USING (auth.email() = (SELECT email FROM public.users WHERE id = user_id))
  WITH CHECK (auth.email() = (SELECT email FROM public.users WHERE id = user_id));

-- Income
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to own income" ON public.income;
CREATE POLICY "Allow access to own income" ON public.income
  FOR ALL TO authenticated
  USING (auth.email() = (SELECT email FROM public.users WHERE id = user_id))
  WITH CHECK (auth.email() = (SELECT email FROM public.users WHERE id = user_id));

-- Chatbot Conversations
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to own chatbot_conversations" ON public.chatbot_conversations;
CREATE POLICY "Allow access to own chatbot_conversations" ON public.chatbot_conversations
  FOR ALL TO authenticated
  USING (auth.email() = (SELECT email FROM public.users WHERE id = user_id))
  WITH CHECK (auth.email() = (SELECT email FROM public.users WHERE id = user_id));

-- Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to own transactions" ON public.transactions;
CREATE POLICY "Allow access to own transactions" ON public.transactions
  FOR ALL TO authenticated
  USING (auth.email() = (SELECT email FROM public.users WHERE id = user_id))
  WITH CHECK (auth.email() = (SELECT email FROM public.users WHERE id = user_id));

-- Virtual Cards
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to own virtual_cards" ON public.virtual_cards;
CREATE POLICY "Allow access to own virtual_cards" ON public.virtual_cards
  FOR ALL TO authenticated
  USING (auth.email() = (SELECT email FROM public.users WHERE id = user_id))
  WITH CHECK (auth.email() = (SELECT email FROM public.users WHERE id = user_id));

-- Deposits
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to own deposits" ON public.deposits;
CREATE POLICY "Allow access to own deposits" ON public.deposits
  FOR ALL TO authenticated
  USING (auth.email() = (SELECT email FROM public.users WHERE id = user_id))
  WITH CHECK (auth.email() = (SELECT email FROM public.users WHERE id = user_id));

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to own orders" ON public.orders;
CREATE POLICY "Allow access to own orders" ON public.orders
  FOR ALL TO authenticated
  USING (auth.email() = (SELECT email FROM public.users WHERE id = user_id))
  WITH CHECK (auth.email() = (SELECT email FROM public.users WHERE id = user_id));

-- User Activities
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to own user_activities" ON public.user_activities;
CREATE POLICY "Allow access to own user_activities" ON public.user_activities
  FOR ALL TO authenticated
  USING (auth.email() = (SELECT email FROM public.users WHERE id = user_id))
  WITH CHECK (auth.email() = (SELECT email FROM public.users WHERE id = user_id));


-- ------------------------------------------------------------------------------
-- 3. PUBLICLY VIEWABLE, ADMIN WRITABLE TABLES RLS
-- ------------------------------------------------------------------------------

-- Store Products
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public select on store_products" ON public.store_products;
CREATE POLICY "Allow public select on store_products" ON public.store_products
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow admin write on store_products" ON public.store_products;
CREATE POLICY "Allow admin write on store_products" ON public.store_products
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE email = auth.email() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE email = auth.email() AND role = 'admin'));

-- Local Jobs
ALTER TABLE public.local_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public select on local_jobs" ON public.local_jobs;
CREATE POLICY "Allow public select on local_jobs" ON public.local_jobs
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow admin write on local_jobs" ON public.local_jobs;
CREATE POLICY "Allow admin write on local_jobs" ON public.local_jobs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE email = auth.email() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE email = auth.email() AND role = 'admin'));
