# Chatbot Analytics Feature - Setup Guide

## Overview
The Chatbot Analytics page allows users to:
- Upload Excel/CSV files containing their transaction data
- Ask AI-powered questions about their spending patterns
- Get personalized financial recommendations and insights
- Track expenditure trends with AI analysis

## Files Created/Modified

### Frontend
1. **New Component**: `/frontend/src/components/ChatbotAnalytics.jsx`
   - Full-featured chat interface with AI assistant
   - File upload support for Excel/CSV
   - Real-time expenditure insights display
   - Quick question suggestions

2. **Updated**: `/frontend/src/App.jsx`
   - Added `ChatbotAnalytics` import
   - Added route: `chatbot-analytics` mapped to "AI Assistant" in sidebar
   - Integrated into navigation menu

### Backend
1. **Updated**: `/backend/server.js`
   - Added axios import for API calls
   - Added 3 new API endpoints:
     - `GET /api/chatbot-analytics/expenditure` - Fetch user's monthly expenditure summary
     - `POST /api/chatbot-analytics/upload` - Handle Excel/CSV file uploads
     - `POST /api/chatbot-analytics/analyze` - Process queries with AI analysis

2. **Updated**: `/backend/package.json`
   - Added `axios` dependency for HTTP requests

3. **New**: `/backend/.env.example`
   - Configuration template with all required environment variables

## Setup Instructions

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend (if not already done)
cd ../frontend
npm install
```

### 2. Configure OpenRouter API Key
⚠️ **IMPORTANT: Security Notice**
- Never commit your API key to version control
- Keep your `.env` file in `.gitignore`

**Steps:**
1. Visit [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Create/retrieve your API key
3. Update `/backend/.env` with your API key:
   ```
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
   ```

### 3. Database Setup
The feature uses existing transaction tables. Optional: Create a conversations table to store chat history:
```sql
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  query TEXT NOT NULL,
  response LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4. Start the Application

**Backend:**
```bash
cd backend
npm start
# or for development with hot reload:
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Access at: `http://localhost:5173` (Vite default)

## Features Explained

### 1. File Upload
- Accepts: `.xlsx`, `.xls`, `.csv` formats
- Automatically extracts transaction data
- Displays upload confirmation with file size

### 2. Chat Interface
- Send questions about spending patterns
- Receive AI-powered financial analysis
- See real-time insights in "Insights" tab
- Quick question suggestions available

### 3. Expenditure Tracking
- Real-time calculation of monthly totals
- Category-based spending breakdown
- Average daily spending calculation
- Top spending category identification

### 4. AI Analysis
Using OpenRouter API with multiple model options:
- **Default**: `openai/gpt-3.5-turbo` (cost-effective)
- Can be upgraded to `openai/gpt-4` for better analysis
- Falls back to helpful tips if API fails

## Supported Questions Examples

Users can ask:
- "What are my top spending categories?"
- "How much did I spend this month?"
- "Where can I save money?"
- "What's my spending trend?"
- "Am I overspending on food?"
- "How can I reduce my expenses?"
- "What's a reasonable budget for my income?"

## API Error Handling

The system gracefully handles:
- **No API key configured**: Shows helpful message
- **API connection issues**: Provides default financial tips
- **Rate limiting (429)**: Suggests trying again later
- **Network errors**: Displays retry message
- **File parsing errors**: Requests valid transaction format

## Architecture

```
Frontend (ChatbotAnalytics.jsx)
    ↓ (HTTP Requests)
Backend (server.js)
    ├─→ authenticateToken (middleware)
    ├─→ Database (transactions, users)
    └─→ OpenRouter API (AI Analysis)
```

## Troubleshooting

### "API key not configured" Error
- Check `.env` file exists in `/backend`
- Verify `OPENROUTER_API_KEY` is set
- Restart backend server after updating `.env`

### File Upload Not Working
- Ensure `/backend/uploads` directory exists
- Check file format is `.xlsx`, `.xls`, or `.csv`
- Verify file size < 10MB

### No Data Showing
- Check user has transactions in the database
- Verify transactions have proper dates and amounts
- Check `transactions` table schema matches expected format

### AI Responses Timeout
- May indicate network issues
- Check OpenRouter API status
- Verify API key has available credits

## Security Notes

✓ API calls are authenticated with JWT tokens
✓ API keys stored in environment variables (not in code)
✓ File uploads validated for type and size
✓ User data isolated by user_id

⚠️ Future improvements:
- Add rate limiting on API calls
- Implement file storage with encryption
- Add conversation history pagination
- Implement user preferences for model selection

## Performance Considerations

- File uploads support up to 10MB (configurable)
- Database queries optimized with date filters
- Chat history pagination recommended for large datasets
- Consider caching expenditure summaries for frequently accessed users

## Future Enhancement Ideas

1. **Multi-Model Support**: Let users choose between different AI models
2. **Scheduled Reports**: Generate weekly/monthly financial reports via AI
3. **Expense Predictions**: AI-powered forecasting based on historical data
4. **Budget Recommendations**: Smart suggestions based on spending patterns
5. **Expense Categorization**: Auto-categorize transactions using AI
6. **Voice Input**: Allow voice commands for financial queries
7. **Export Analysis**: Generate PDF reports of AI insights
