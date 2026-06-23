import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, PieChart, BarChart2, Activity, Zap, RefreshCw, Calendar, Sparkles } from 'lucide-react';

export default function Analytics({ token }) {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30days'); // 7days, 30days, 90days, year

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const [expRes, incRes] = await Promise.all([
        fetch('/api/expenses', { headers }),
        fetch('/api/income', { headers })
      ]);
      if (expRes.ok) setExpenses(await expRes.json());
      if (incRes.ok) setIncomes(await incRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterByTimeframe = (data) => {
    const now = new Date();
    const daysMap = { '7days': 7, '30days': 30, '90days': 90, 'year': 365 };
    const cutoff = new Date(now.getTime() - (daysMap[timeframe] * 24 * 60 * 60 * 1000));
    return data.filter(d => new Date(d.date) >= cutoff);
  };

  const filteredExpenses = filterByTimeframe(expenses);
  const filteredIncomes = filterByTimeframe(incomes);

  const totalSpent = filteredExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const totalEarned = filteredIncomes.reduce((s, e) => s + parseFloat(e.amount), 0);
  const netSavings = totalEarned - totalSpent;
  const savingsRate = totalEarned > 0 ? (netSavings / totalEarned) * 100 : 0;

  // Category breakdown
  const catMap = {};
  filteredExpenses.forEach(e => {
    catMap[e.category] = (catMap[e.category] || 0) + parseFloat(e.amount);
  });
  const sortedCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'None';
  const topCategoryAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;

  const COLORS = ['#6366f1', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#60a5fa', '#fb923c', '#e879f9'];

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={28} style={{ color: 'var(--primary)' }} /> Financial Analytics
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Deep dive into your spending habits and financial forecasting
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            value={timeframe} 
            onChange={e => setTimeframe(e.target.value)}
            style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="7days" style={{ background: '#0f172a' }}>Last 7 Days</option>
            <option value="30days" style={{ background: '#0f172a' }}>Last 30 Days</option>
            <option value="90days" style={{ background: '#0f172a' }}>Last 90 Days</option>
            <option value="year" style={{ background: '#0f172a' }}>This Year</option>
          </select>
          <button onClick={fetchData} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', color: 'var(--primary)' }} />
          Calculating metrics...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Key Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '20px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Earned</p>
              <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#34d399' }}>CFA {Math.round(totalEarned).toLocaleString()}</p>
            </div>
            <div style={{ padding: '20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Spent</p>
              <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: '#f87171' }}>CFA {Math.round(totalSpent).toLocaleString()}</p>
            </div>
            <div style={{ padding: '20px', background: netSavings >= 0 ? 'rgba(99,102,241,0.08)' : 'rgba(251,191,36,0.08)', border: `1px solid ${netSavings >= 0 ? 'rgba(99,102,241,0.2)' : 'rgba(251,191,36,0.2)'}`, borderRadius: '16px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Cashflow</p>
              <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: netSavings >= 0 ? '#818cf8' : '#fbbf24' }}>
                {netSavings >= 0 ? '+' : ''}CFA {Math.round(netSavings).toLocaleString()}
              </p>
            </div>
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Savings Rate</p>
              <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: savingsRate > 20 ? '#34d399' : savingsRate > 0 ? '#fbbf24' : '#f87171' }}>
                {savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Category Breakdown */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={18} style={{ color: 'var(--primary)' }} /> Spending by Category
              </h3>
              {sortedCategories.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No spending data for this period.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {sortedCategories.map(([cat, amt], i) => {
                    const pct = totalSpent > 0 ? (amt / totalSpent) * 100 : 0;
                    const color = COLORS[i % COLORS.length];
                    return (
                      <div key={cat}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{cat}</span>
                          <span style={{ color: color, fontWeight: '700' }}>CFA {Math.round(amt).toLocaleString()} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: color, width: `${pct}%`, borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Insights & Alerts */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: '#fbbf24' }} /> Smart Insights
              </h3>
              
              <div style={{ padding: '16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px' }}>
                <p style={{ margin: '0 0 6px 0', fontWeight: '700', color: '#34d399', fontSize: '0.95rem' }}>Income Status</p>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  {netSavings > 0 
                    ? `Great job! You have saved CFA ${Math.round(netSavings).toLocaleString()} this period. This is an excellent cash reserve buffer.` 
                    : `You are running a deficit of CFA ${Math.round(Math.abs(netSavings)).toLocaleString()}. Consider adjusting your budgets or reducing variable costs.`}
                </p>
              </div>

              {sortedCategories.length > 0 && (
                <div style={{ padding: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 6px 0', fontWeight: '700', color: '#f87171', fontSize: '0.95rem' }}>Largest Expense Driver</p>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    <strong>{topCategory}</strong> makes up {((topCategoryAmount / totalSpent) * 100).toFixed(1)}% of your total spending. This is the best place to look if you want to cut back.
                  </p>
                </div>
              )}

              {filteredExpenses.filter(e => e.is_subscription).length > 0 && (
                <div style={{ padding: '16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 6px 0', fontWeight: '700', color: '#818cf8', fontSize: '0.95rem' }}>Subscription Leakage</p>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    You have active recurring subscriptions draining CFA {Math.round(filteredExpenses.filter(e => e.is_subscription).reduce((s, e) => s + parseFloat(e.amount), 0)).toLocaleString()} this period. Review the Bills & Payments tab.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
