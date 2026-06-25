# TODO

## GitHub + Supabase refactor

### Step 1: Remove remaining `/api/expenses` + `/api/income*`
- ✅ Completed: `frontend/src/components/Transactions.jsx`
- ✅ Completed: `frontend/src/components/IncomeLogger.jsx`

### Step 2: Fix Vercel 502 (rewrite architecture)
- ⏳ Update `vercel.json` to remove `/api/*` rewrites if using Supabase directly
  - Remove: `source: "/api/:path*"`
  - Remove: `source: "/uploads/:path*"` unless backend serves uploads
- ⏳ Redeploy frontend

### Step 3: Replace remaining `/api/*` calls
- ⏳ Deposit.jsx: `/api/deposits` → Supabase `deposits` table
- ⏳ VirtualCards.jsx: `/api/auth/me` + `/api/virtual-cards*` → Supabase
- ⏳ StoreSimulation.jsx: `/api/store/*` + `/api/store/purchase` → Supabase
- ⏳ ChatbotAnalytics* pages: `/api/chatbot-analytics/*` → Supabase

### Step 4: Commit + push
- ⏳ Commit changes on a `blackboxai/` branch and push

