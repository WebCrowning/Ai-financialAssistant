import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, PieChart, LineChart, 
  AlertCircle, ArrowRight, Wallet, Calendar, 
  CreditCard, RefreshCw, ChevronRight, 
  DollarSign, Percent, BarChart3, Target,
  Receipt, Plus, Eye, MoreVertical
} from 'lucide-react';

// Professional color system
const COLORS = {
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  success: '#059669',
  successLight: '#d1fae5',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  warning: '#d97706',
  warningLight: '#fef3c7',
  purple: '#7c3aed',
  purpleLight: '#ede9fe',
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  }
};

export default function FinanceDashboard({ user, token }) {
  const [dashboardData, setDashboardData] = useState({
    totalBalance: 325400,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlySavings: 0,
    budgetStatus: [],
    recentTransactions: [],
    categoryBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [expRes, incRes, budRes] = await Promise.all([
        fetch('/api/expenses', { headers }),
        fetch('/api/income', { headers }),
        fetch('/api/budgets', { headers })
      ]);

      const expensesData = await expRes.json();
      const incomesData = await incRes.json();
      const budgetsData = await budRes.json();

      const expenses = Array.isArray(expensesData) ? expensesData : [];
      const incomes = Array.isArray(incomesData) ? incomesData : [];
      const budgets = Array.isArray(budgetsData) ? budgetsData : [];

      const monthlyIncome = incomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
      const monthlyExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const monthlySavings = monthlyIncome - monthlyExpenses;

      const categoryBreakdown = expenses.reduce((acc, exp) => {
        const existing = acc.find(c => c.category === exp.category);
        if (existing) {
          existing.amount += parseFloat(exp.amount);
        } else {
          acc.push({ category: exp.category, amount: parseFloat(exp.amount) });
        }
        return acc;
      }, []);

      const updatedBudgets = budgets.map(b => {
        const matchingExpenses = expenses
          .filter(e => e.category === b.category)
          .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        return {
          ...b,
          spent: matchingExpenses
        };
      });

      const baselineBalance = 250700;
      const netChange = monthlyIncome - monthlyExpenses;
      const aggregatedBalance = baselineBalance + netChange;

      setDashboardData({
        totalBalance: aggregatedBalance,
        monthlyIncome,
        monthlyExpenses,
        monthlySavings,
        budgetStatus: updatedBudgets,
        recentTransactions: expenses.slice(0, 5),
        categoryBreakdown
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading your financial data...</p>
      </div>
    );
  }

  // Chart calculations
  const maxVal = Math.max(dashboardData.monthlyIncome, dashboardData.monthlyExpenses, 1000) * 1.2;
  const incHeight = maxVal > 0 ? (dashboardData.monthlyIncome / maxVal) * 160 : 0;
  const expHeight = maxVal > 0 ? (dashboardData.monthlyExpenses / maxVal) * 160 : 0;

  // Category icons and colors mapping
  const categoryIcons = {
    'Food': '🍔',
    'Transport': '🚗',
    'Shopping': '🛍️',
    'Bills': '📄',
    'Entertainment': '🎬',
    'Healthcare': '🏥',
    'Education': '📚',
    'Groceries': '🛒',
    'Rent': '🏠',
    'Utilities': '⚡',
    'Insurance': '🛡️',
    'Salary': '💰',
    'Investment': '📈',
    'Default': '💳'
  };
  
  const categoryColors = {
    'Food': '#f59e0b',
    'Transport': '#3b82f6',
    'Shopping': '#8b5cf6',
    'Bills': '#ef4444',
    'Entertainment': '#ec4899',
    'Healthcare': '#14b8a6',
    'Education': '#6366f1',
    'Groceries': '#10b981',
    'Rent': '#f97316',
    'Utilities': '#6b7280',
    'Insurance': '#0ea5e9',
    'Salary': '#059669',
    'Investment': '#7c3aed',
    'Default': '#6b7280'
  };

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Financial Dashboard</h1>
          <p style={styles.subtitle}>Track your finances across all accounts</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.timeframeSelector}>
            <button 
              style={{...styles.timeframeBtn, ...(timeframe === 'week' ? styles.timeframeBtnActive : {})}}
              onClick={() => setTimeframe('week')}
            >
              Week
            </button>
            <button 
              style={{...styles.timeframeBtn, ...(timeframe === 'month' ? styles.timeframeBtnActive : {})}}
              onClick={() => setTimeframe('month')}
            >
              Month
            </button>
            <button 
              style={{...styles.timeframeBtn, ...(timeframe === 'year' ? styles.timeframeBtnActive : {})}}
              onClick={() => setTimeframe('year')}
            >
              Year
            </button>
          </div>
          <button style={styles.refreshBtn} onClick={fetchDashboardData}>
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Summary Cards Grid */}
      <div style={styles.summaryGrid}>
        {/* Total Balance */}
        <div style={{...styles.summaryCard, borderLeft: `4px solid ${COLORS.primary}`}}>
          <div style={styles.summaryCardHeader}>
            <span style={styles.summaryCardLabel}>Total Balance</span>
            <div style={{...styles.iconWrapper, background: COLORS.primaryLight, color: COLORS.primary}}>
              <Wallet size={20} />
            </div>
          </div>
          <div style={styles.summaryCardValue}>
            CFA {dashboardData.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={styles.summaryCardFooter}>
            <span style={styles.summaryCardChange}>↑ 2.4%</span>
            <span style={styles.summaryCardMeta}>vs last month</span>
          </div>
        </div>

        {/* Monthly Income */}
        <div style={{...styles.summaryCard, borderLeft: `4px solid ${COLORS.success}`}}>
          <div style={styles.summaryCardHeader}>
            <span style={styles.summaryCardLabel}>Monthly Income</span>
            <div style={{...styles.iconWrapper, background: COLORS.successLight, color: COLORS.success}}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{...styles.summaryCardValue, color: COLORS.success}}>
            CFA {dashboardData.monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div style={styles.summaryCardFooter}>
            <span style={styles.summaryCardChange}>↑ 8.1%</span>
            <span style={styles.summaryCardMeta}>vs last month</span>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div style={{...styles.summaryCard, borderLeft: `4px solid ${COLORS.danger}`}}>
          <div style={styles.summaryCardHeader}>
            <span style={styles.summaryCardLabel}>Monthly Expenses</span>
            <div style={{...styles.iconWrapper, background: COLORS.dangerLight, color: COLORS.danger}}>
              <TrendingDown size={20} />
            </div>
          </div>
          <div style={{...styles.summaryCardValue, color: COLORS.danger}}>
            CFA {dashboardData.monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={styles.summaryCardFooter}>
            <span style={styles.summaryCardChange}>↓ 3.2%</span>
            <span style={styles.summaryCardMeta}>vs last month</span>
          </div>
        </div>

        {/* Monthly Savings */}
        <div style={{...styles.summaryCard, borderLeft: `4px solid ${dashboardData.monthlySavings >= 0 ? COLORS.success : COLORS.warning}`}}>
          <div style={styles.summaryCardHeader}>
            <span style={styles.summaryCardLabel}>Monthly Savings</span>
            <div style={{...styles.iconWrapper, background: dashboardData.monthlySavings >= 0 ? COLORS.successLight : COLORS.warningLight, color: dashboardData.monthlySavings >= 0 ? COLORS.success : COLORS.warning}}>
              <Target size={20} />
            </div>
          </div>
          <div style={{...styles.summaryCardValue, color: dashboardData.monthlySavings >= 0 ? COLORS.success : COLORS.warning}}>
            CFA {dashboardData.monthlySavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={styles.summaryCardFooter}>
            <span style={styles.summaryCardChange}>↑ 12.5%</span>
            <span style={styles.summaryCardMeta}>of income saved</span>
          </div>
        </div>
      </div>

      {/* Charts & Actions Section */}
      <div style={styles.chartsGrid}>
        {/* Income vs Expenses Chart */}
        <div style={styles.chartCard}>
          <div style={styles.cardHeader}>
            <div style={styles.cardHeaderLeft}>
              <div style={{...styles.iconWrapper, background: COLORS.primaryLight, color: COLORS.primary}}>
                <LineChart size={20} />
              </div>
              <h2 style={styles.cardTitle}>Income vs Expenses</h2>
            </div>
            <span style={styles.cardSubtitle}>This month</span>
          </div>
          <div style={styles.chartContainer}>
            <svg width="100%" height="240" style={{ overflow: 'visible' }}>
              {/* Grid lines */}
              {[20, 80, 140, 200].map((y, i) => (
                <line 
                  key={i}
                  x1="10%" 
                  y1={y} 
                  x2="90%" 
                  y2={y} 
                  stroke={COLORS.gray[200]} 
                  strokeWidth={i === 3 ? 2 : 1}
                  strokeDasharray={i === 3 ? 'none' : '4'}
                />
              ))}

              {/* Income Bar */}
              <rect 
                x="30%" 
                y={200 - incHeight} 
                width="15%" 
                height={incHeight} 
                fill={COLORS.success}
                rx="6" 
                style={{ transition: 'all 0.5s ease', opacity: 0.9 }}
              />
              <text 
                x="37.5%" 
                y={190 - incHeight} 
                textAnchor="middle" 
                fill={COLORS.gray[700]} 
                style={{ fontSize: '12px', fontWeight: '600' }}
              >
                CFA {(dashboardData.monthlyIncome / 1000).toFixed(1)}k
              </text>
              <text 
                x="37.5%" 
                y="225" 
                textAnchor="middle" 
                fill={COLORS.gray[500]} 
                style={{ fontSize: '12px' }}
              >
                Income
              </text>

              {/* Expenses Bar */}
              <rect 
                x="55%" 
                y={200 - expHeight} 
                width="15%" 
                height={expHeight} 
                fill={COLORS.danger}
                rx="6" 
                style={{ transition: 'all 0.5s ease', opacity: 0.9 }}
              />
              <text 
                x="62.5%" 
                y={190 - expHeight} 
                textAnchor="middle" 
                fill={COLORS.gray[700]} 
                style={{ fontSize: '12px', fontWeight: '600' }}
              >
                CFA {(dashboardData.monthlyExpenses / 1000).toFixed(1)}k
              </text>
              <text 
                x="62.5%" 
                y="225" 
                textAnchor="middle" 
                fill={COLORS.gray[500]} 
                style={{ fontSize: '12px' }}
              >
                Expenses
              </text>
            </svg>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={styles.chartCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Quick Actions</h2>
          </div>
          <div style={styles.actionsContainer}>
            <p style={styles.actionsSubtitle}>Manage your finances in seconds</p>
            <div style={styles.actionButtons}>
              <button 
                onClick={() => window.location.href = '/Transactions'} 
                style={{...styles.actionBtn, background: COLORS.dangerLight, color: COLORS.danger}}
              >
                <TrendingDown size={18} />
                Log Expense
              </button>
              <button 
                onClick={() => window.location.href = '/Transactions'} 
                style={{...styles.actionBtn, background: COLORS.successLight, color: COLORS.success}}
              >
                <TrendingUp size={18} />
                Add Income
              </button>
            </div>
            
            <div style={styles.actionCard}>
              <div style={styles.actionCardContent}>
                <Receipt size={20} style={{ color: COLORS.primary }} />
                <div>
                  <h4 style={styles.actionCardTitle}>Scan Receipt</h4>
                  <p style={styles.actionCardDesc}>Automatically log expenses from receipts</p>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/Transactions'} 
                style={styles.actionCardBtn}
              >
                Open Scanner <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div style={styles.chartCard}>
          <div style={styles.cardHeader}>
            <div style={styles.cardHeaderLeft}>
              <div style={{...styles.iconWrapper, background: COLORS.purpleLight, color: COLORS.purple}}>
                <PieChart size={20} />
              </div>
              <h2 style={styles.cardTitle}>Category Breakdown</h2>
            </div>
            <span style={styles.cardSubtitle}>By spending</span>
          </div>
          <div style={styles.categoryList}>
            {dashboardData.categoryBreakdown.length > 0 ? (
              dashboardData.categoryBreakdown.map((cat, idx) => {
                const totalSpent = dashboardData.monthlyExpenses || 1;
                const percentage = Math.round((cat.amount / totalSpent) * 100);
                const colors = [COLORS.primary, COLORS.purple, COLORS.warning, COLORS.success, COLORS.danger];
                const color = colors[idx % colors.length];

                return (
                  <div key={idx} style={styles.categoryItem}>
                    <div style={styles.categoryHeader}>
                      <span style={styles.categoryLabel}>
                        <span style={{...styles.categoryDot, background: color}}></span>
                        {cat.category}
                      </span>
                      <span style={styles.categoryAmount}>
                        CFA {cat.amount.toLocaleString()}
                        <span style={styles.categoryPercentage}>({percentage}%)</span>
                      </span>
                    </div>
                    <div style={styles.categoryBar}>
                      <div 
                        style={{
                          ...styles.categoryBarFill,
                          width: `${percentage}%`,
                          background: color
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={styles.emptyState}>
                <p>No categorized transactions yet</p>
                <span style={styles.emptyStateSub}>Start logging your expenses</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Progress Section */}
      <div style={styles.budgetSection}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionHeaderLeft}>
            <div style={{...styles.iconWrapper, background: COLORS.warningLight, color: COLORS.warning}}>
              <AlertCircle size={20} />
            </div>
            <h2 style={styles.sectionTitle}>Budget Status</h2>
          </div>
          <button style={styles.viewAllBtn}>
            View All <ChevronRight size={16} />
          </button>
        </div>
        
        <div style={styles.budgetGrid}>
          {dashboardData.budgetStatus.length > 0 ? (
            dashboardData.budgetStatus.map((budget, idx) => {
              const spent = budget.spent || 0;
              const limit = budget.limit_amount || budget.limit || 100;
              const pct = (spent / limit) * 100;
              const isOverspent = spent > limit;
              const progressColor = isOverspent ? COLORS.danger : pct > 75 ? COLORS.warning : COLORS.success;

              return (
                <div key={idx} style={styles.budgetCard}>
                  <div style={styles.budgetCardHeader}>
                    <div>
                      <h4 style={styles.budgetCategory}>{budget.category}</h4>
                      <span style={styles.budgetLimit}>Limit: CFA {limit.toLocaleString()}</span>
                    </div>
                    {isOverspent && (
                      <span style={styles.budgetOverspent}>Overlimit</span>
                    )}
                  </div>
                  <div style={styles.budgetProgress}>
                    <div style={styles.budgetProgressBar}>
                      <div 
                        style={{
                          ...styles.budgetProgressFill,
                          width: `${Math.min(pct, 100)}%`,
                          background: progressColor
                        }}
                      ></div>
                    </div>
                    <div style={styles.budgetProgressInfo}>
                      <span style={styles.budgetSpent}>Spent: CFA {spent.toLocaleString()}</span>
                      <span style={{...styles.budgetPercentage, color: progressColor}}>
                        {Math.round(pct)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={styles.emptyState}>
              <p>No active budgets</p>
              <span style={styles.emptyStateSub}>Create your first budget to start tracking</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions - Redesigned */}
      <div style={styles.transactionSection}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionHeaderLeft}>
            <div style={{...styles.iconWrapper, background: COLORS.primaryLight, color: COLORS.primary}}>
              <Receipt size={20} />
            </div>
            <h2 style={styles.sectionTitle}>Recent Transactions</h2>
          </div>
          <div style={styles.sectionHeaderRight}>
            <span style={styles.transactionCount}>{dashboardData.recentTransactions.length} transactions</span>
            <button style={styles.viewAllBtn}>
              View All <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div style={styles.transactionList}>
          {dashboardData.recentTransactions.length > 0 ? (
            dashboardData.recentTransactions.map((trans, idx) => {
              const isExpense = true;
              const amount = parseFloat(trans.amount);
              const formattedDate = new Date(trans.date);
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              
              let dateLabel = formattedDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
              
              if (formattedDate.toDateString() === today.toDateString()) {
                dateLabel = 'Today';
              } else if (formattedDate.toDateString() === yesterday.toDateString()) {
                dateLabel = 'Yesterday';
              }

              const icon = categoryIcons[trans.category] || categoryIcons['Default'];
              const color = categoryColors[trans.category] || categoryColors['Default'];

              return (
                <div key={idx} style={styles.transactionItem}>
                  <div style={styles.transactionLeft}>
                    <div style={{...styles.transactionIcon, background: `${color}15`}}>
                      <span style={{ fontSize: '18px' }}>{icon}</span>
                    </div>
                    <div style={styles.transactionInfo}>
                      <div style={styles.transactionHeader}>
                        <span style={styles.transactionMerchant}>{trans.description}</span>
                        <span style={styles.transactionCategory}>
                          {trans.category}
                        </span>
                      </div>
                      <div style={styles.transactionMeta}>
                        <span style={styles.transactionDate}>
                          <Calendar size={12} style={{ marginRight: '4px' }} />
                          {dateLabel}
                        </span>
                        <span style={styles.transactionAccount}>
                          <CreditCard size={12} style={{ marginRight: '4px' }} />
                          {trans.account || 'Main Account'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={styles.transactionRight}>
                    <div style={styles.transactionAmountWrapper}>
                      <span style={{...styles.transactionAmount, color: isExpense ? COLORS.danger : COLORS.success}}>
                        {isExpense ? '−' : '+'}CFA {amount.toLocaleString()}
                      </span>
                      <span style={styles.transactionStatus}>
                        {isExpense ? 'Expense' : 'Income'}
                      </span>
                    </div>
                    <button style={styles.transactionMoreBtn}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateIcon}>📭</div>
              <p style={styles.emptyStateText}>No recent transactions</p>
              <span style={styles.emptyStateSub}>Your transactions will appear here</span>
            </div>
          )}
        </div>

        {/* Quick Summary Footer */}
        {dashboardData.recentTransactions.length > 0 && (
          <div style={styles.transactionFooter}>
            <div style={styles.transactionSummary}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Total Spent</span>
                <span style={{...styles.summaryValue, color: COLORS.danger}}>
                  -CFA {dashboardData.recentTransactions
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                    .toLocaleString()}
                </span>
              </div>
              <div style={styles.summaryDivider}></div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Average Transaction</span>
                <span style={styles.summaryValue}>
                  CFA {Math.round(
                    dashboardData.recentTransactions
                      .reduce((sum, t) => sum + parseFloat(t.amount), 0) / 
                      dashboardData.recentTransactions.length
                  ).toLocaleString()}
                </span>
              </div>
              <div style={styles.summaryDivider}></div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Most Common</span>
                <span style={styles.summaryValue}>
                  {Object.entries(
                    dashboardData.recentTransactions.reduce((acc, t) => {
                      acc[t.category] = (acc[t.category] || 0) + 1;
                      return acc;
                    }, {})
                  ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                </span>
              </div>
            </div>
            <button style={styles.exportBtn}>
              Export <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    padding: '24px',
    maxWidth: '1440px',
    margin: '0 auto',
    background: COLORS.gray[50],
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: COLORS.gray[50],
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: `3px solid ${COLORS.gray[200]}`,
    borderTop: `3px solid ${COLORS.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: COLORS.gray[500],
    fontSize: '14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: COLORS.gray[900],
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: '4px 0 0 0',
    color: COLORS.gray[500],
    fontSize: '14px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  timeframeSelector: {
    display: 'flex',
    background: 'white',
    borderRadius: '8px',
    padding: '4px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  timeframeBtn: {
    padding: '6px 16px',
    border: 'none',
    background: 'transparent',
    borderRadius: '6px',
    color: COLORS.gray[600],
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  timeframeBtnActive: {
    background: COLORS.primary,
    color: 'white',
  },
  refreshBtn: {
    padding: '8px 12px',
    background: 'white',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    color: COLORS.gray[600],
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  summaryCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  summaryCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  summaryCardLabel: {
    color: COLORS.gray[500],
    fontSize: '13px',
    fontWeight: '500',
  },
  iconWrapper: {
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: '8px',
  },
  summaryCardFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  summaryCardChange: {
    fontSize: '12px',
    fontWeight: '600',
    color: COLORS.success,
  },
  summaryCardMeta: {
    fontSize: '12px',
    color: COLORS.gray[400],
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  chartCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  cardSubtitle: {
    fontSize: '12px',
    color: COLORS.gray[400],
  },
  chartContainer: {
    height: '260px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  actionsSubtitle: {
    margin: 0,
    color: COLORS.gray[500],
    fontSize: '13px',
  },
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  actionBtn: {
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'transform 0.2s',
  },
  actionCard: {
    padding: '16px',
    background: COLORS.gray[50],
    borderRadius: '8px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  actionCardContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  actionCardTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  actionCardDesc: {
    margin: 0,
    fontSize: '12px',
    color: COLORS.gray[500],
  },
  actionCardBtn: {
    width: '100%',
    padding: '8px',
    background: 'white',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '6px',
    color: COLORS.gray[700],
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    transition: 'all 0.2s',
  },
  categoryList: {
    maxHeight: '240px',
    overflowY: 'auto',
  },
  categoryItem: {
    paddingBottom: '16px',
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    fontSize: '13px',
  },
  categoryLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: COLORS.gray[700],
  },
  categoryDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  categoryAmount: {
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  categoryPercentage: {
    marginLeft: '6px',
    fontSize: '12px',
    color: COLORS.gray[400],
    fontWeight: '400',
  },
  categoryBar: {
    width: '100%',
    height: '6px',
    background: COLORS.gray[200],
    borderRadius: '3px',
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  budgetSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  sectionHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  viewAllBtn: {
    padding: '6px 12px',
    border: 'none',
    background: 'transparent',
    color: COLORS.primary,
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  budgetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  budgetCard: {
    padding: '16px',
    background: COLORS.gray[50],
    borderRadius: '8px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  budgetCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  budgetCategory: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  budgetLimit: {
    fontSize: '12px',
    color: COLORS.gray[500],
  },
  budgetOverspent: {
    fontSize: '11px',
    background: COLORS.dangerLight,
    color: COLORS.danger,
    padding: '2px 8px',
    borderRadius: '12px',
    fontWeight: '600',
  },
  budgetProgress: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  budgetProgressBar: {
    width: '100%',
    height: '6px',
    background: COLORS.gray[200],
    borderRadius: '3px',
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  budgetProgressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  budgetSpent: {
    color: COLORS.gray[500],
  },
  budgetPercentage: {
    fontWeight: '600',
  },
  transactionSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  transactionCount: {
    fontSize: '13px',
    color: COLORS.gray[500],
  },
  transactionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  },
  transactionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: COLORS.gray[50],
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    border: '1px solid transparent',
  },
  transactionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
    minWidth: 0,
  },
  transactionIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },
  transactionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
    flexWrap: 'wrap',
  },
  transactionMerchant: {
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.gray[900],
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  transactionCategory: {
    fontSize: '11px',
    fontWeight: '500',
    color: COLORS.gray[500],
    background: COLORS.gray[200],
    padding: '2px 10px',
    borderRadius: '12px',
    whiteSpace: 'nowrap',
  },
  transactionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '12px',
    color: COLORS.gray[400],
  },
  transactionDate: {
    display: 'flex',
    alignItems: 'center',
  },
  transactionAccount: {
    display: 'flex',
    alignItems: 'center',
  },
  transactionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  transactionAmountWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  transactionAmount: {
    fontSize: '15px',
    fontWeight: '700',
  },
  transactionStatus: {
    fontSize: '11px',
    fontWeight: '500',
    color: COLORS.gray[400],
  },
  transactionMoreBtn: {
    padding: '4px',
    border: 'none',
    background: 'transparent',
    color: COLORS.gray[400],
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  transactionFooter: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: `1px solid ${COLORS.gray[200]}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  transactionSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  summaryLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: COLORS.gray[400],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  summaryValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  summaryDivider: {
    width: '1px',
    height: '30px',
    background: COLORS.gray[200],
  },
  exportBtn: {
    padding: '8px 16px',
    background: 'transparent',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    color: COLORS.gray[600],
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  emptyState: {
    textAlign: 'center',
    padding: '32px 0',
    color: COLORS.gray[500],
  },
  emptyStateIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  emptyStateText: {
    fontSize: '16px',
    fontWeight: '500',
    color: COLORS.gray[700],
    margin: 0,
  },
  emptyStateSub: {
    display: 'block',
    fontSize: '12px',
    color: COLORS.gray[400],
  },
};

// Add keyframes for loading spinner animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .transaction-item:hover {
    background: white !important;
    border-color: ${COLORS.gray[200]} !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
    transform: translateX(4px) !important;
  }
  
  .action-btn:hover {
    transform: translateY(-2px);
  }
  
  .refresh-btn:hover {
    background: ${COLORS.gray[50]};
  }
  
  .view-all-btn:hover {
    color: ${COLORS.primary} !important;
  }
  
  .export-btn:hover {
    background: ${COLORS.gray[50]};
    border-color: ${COLORS.gray[300]};
  }
  
  .more-btn:hover {
    background: ${COLORS.gray[200]};
    color: ${COLORS.gray[600]};
  }
`;
document.head.appendChild(styleSheet);