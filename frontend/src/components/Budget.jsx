import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle, Plus, RefreshCw, CheckCircle, Target,
  TrendingDown, ShieldAlert, Wallet, TrendingUp,
  Percent, BarChart3, Settings, Edit2, Trash2,
  Calendar, DollarSign, PieChart, Download,
  Filter, ChevronDown, X, Eye
} from 'lucide-react';
import { supabase } from '../supabaseClient';

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

export default function Budget({ token }) {
  const user = useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, [token]);

  const userId = user?.id;

  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: 'Food', limit: '' });
  const [alertMsg, setAlertMsg] = useState(null);
  const [alertType, setAlertType] = useState('success');
  const [editingBudget, setEditingBudget] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchBudgetData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId]);

  const fetchBudgetData = async () => {
    if (!supabase) {
      showAlert('Supabase client not configured', 'error');
      setLoading(false);
      return;
    }
    if (!userId) {
      showAlert('User not authenticated', 'error');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [{ data: rawBudgets, error: budErr }, { data: rawExpenses, error: expErr }] = await Promise.all([
        supabase.from('budgets').select('*').eq('user_id', userId),
        supabase.from('expenses').select('*').eq('user_id', userId),
      ]);

      if (budErr) throw budErr;
      if (expErr) throw expErr;

      setExpenses(rawExpenses || []);

      const processedBudgets = (rawBudgets || []).map((b) => {
        const spent = (rawExpenses || [])
          .filter((e) => e.category === b.category)
          .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        const limitVal = parseFloat(b.limit_amount) || parseFloat(b.limit) || 0;

        return {
          id: b.id,
          category: b.category,
          limit: limitVal,
          spent,
          remaining: limitVal - spent,
        };
      });

      setBudgets(processedBudgets);
    } catch (err) {
      console.error('Error loading budgets:', err);
      showAlert('Failed to load budget data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlertMsg(message);
    setAlertType(type);
    setTimeout(() => setAlertMsg(null), 5000);
  };

  const handleUpsertBudget = async (e) => {
    e.preventDefault();
    if (!newBudget.category || !newBudget.limit) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    try {
      if (!userId) {
        showAlert('User not authenticated', 'error');
        return;
      }

      // Check if a budget already exists for this category and user
      const { data: existing, error: findErr } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', userId)
        .eq('category', newBudget.category)
        .maybeSingle();

      if (findErr) throw findErr;

      let resultError = null;
      if (existing) {
        const { error } = await supabase
          .from('budgets')
          .update({ limit_amount: parseFloat(newBudget.limit) })
          .eq('id', existing.id);
        resultError = error;
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert({
            user_id: userId,
            category: newBudget.category,
            limit_amount: parseFloat(newBudget.limit)
          });
        resultError = error;
      }

      if (resultError) throw resultError;

      showAlert(`Budget limit of CFA ${parseFloat(newBudget.limit).toLocaleString()} set for ${newBudget.category}`);
      setNewBudget({ category: 'Food', limit: '' });
      setShowAddBudget(false);
      fetchBudgetData();
    } catch (err) {
      console.error(err);
      showAlert(err.message || 'An error occurred', 'error');
    }
  };

  const handleDeleteBudget = async (id, category) => {
    if (!window.confirm(`Delete budget for ${category}?`)) return;
    
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showAlert(`Budget for ${category} deleted`);
      fetchBudgetData();
    } catch (err) {
      console.error(err);
      showAlert('Failed to delete budget', 'error');
    }
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setNewBudget({
      category: budget.category,
      limit: budget.limit.toString()
    });
    setShowAddBudget(true);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading budget data...</p>
      </div>
    );
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const budgetUsagePct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  
  const filteredBudgets = selectedCategory === 'All' 
    ? budgets 
    : budgets.filter(b => b.category === selectedCategory);

  const categoryOptions = ['All', ...new Set(budgets.map(b => b.category))];

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIconWrapper}>
            <Target size={24} style={{ color: COLORS.warning }} />
          </div>
          <div>
            <h1 style={styles.title}>Budget Management</h1>
            <p style={styles.subtitle}>Set and track spending limits across categories</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button
            onClick={fetchBudgetData}
            style={styles.refreshBtn}
            title="Refresh data"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAddBudget(!showAddBudget)}
            style={styles.addBtn}
          >
            <Plus size={18} />
            {showAddBudget ? 'Close Form' : 'New Budget'}
          </button>
        </div>
      </header>

      {/* Alert Messages */}
      {alertMsg && (
        <div style={{
          ...styles.alert,
          ...(alertType === 'success' ? styles.alertSuccess : styles.alertError)
        }}>
          {alertType === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{alertMsg}</span>
          <button onClick={() => setAlertMsg(null)} style={styles.alertClose}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Add/Edit Budget Form */}
      {showAddBudget && (
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>
            {editingBudget ? 'Edit Budget' : 'Create New Budget'}
          </h2>
          <form onSubmit={handleUpsertBudget} style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Category</label>
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  style={styles.formSelect}
                >
                  <option value="Food">🍔 Food</option>
                  <option value="Rent">🏠 Rent</option>
                  <option value="Bills">📄 Bills</option>
                  <option value="Transport">🚗 Transport</option>
                  <option value="Shopping">🛍️ Shopping</option>
                  <option value="Entertainment">🎬 Entertainment</option>
                  <option value="Healthcare">🏥 Healthcare</option>
                  <option value="Education">📚 Education</option>
                  <option value="Groceries">🛒 Groceries</option>
                  <option value="Utilities">⚡ Utilities</option>
                  <option value="Insurance">🛡️ Insurance</option>
                  <option value="Other">📌 Other</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Monthly Limit (CFA)</label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={newBudget.limit}
                  onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                  required
                  style={styles.formInput}
                  min="0"
                  step="100"
                />
              </div>
            </div>
            <div style={styles.formActions}>
              <button
                type="button"
                onClick={() => {
                  setShowAddBudget(false);
                  setEditingBudget(null);
                  setNewBudget({ category: 'Food', limit: '' });
                }}
                style={styles.formCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={styles.formSubmit}
              >
                {editingBudget ? 'Update Budget' : 'Save Budget'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Stats */}
      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, borderBottom: `3px solid ${COLORS.primary}`}}>
          <div style={{...styles.statIconWrapper, background: COLORS.primaryLight}}>
            <Wallet size={20} style={{ color: COLORS.primary }} />
          </div>
          <span style={styles.statLabel}>Total Budget</span>
          <span style={styles.statValue}>CFA {totalBudget.toLocaleString()}</span>
        </div>
        <div style={{...styles.statCard, borderBottom: `3px solid ${COLORS.danger}`}}>
          <div style={{...styles.statIconWrapper, background: COLORS.dangerLight}}>
            <TrendingDown size={20} style={{ color: COLORS.danger }} />
          </div>
          <span style={styles.statLabel}>Total Spent</span>
          <span style={{...styles.statValue, color: COLORS.danger}}>
            CFA {totalSpent.toLocaleString()}
          </span>
        </div>
        <div style={{...styles.statCard, borderBottom: `3px solid ${totalRemaining >= 0 ? COLORS.success : COLORS.danger}`}}>
          <div style={{...styles.statIconWrapper, background: totalRemaining >= 0 ? COLORS.successLight : COLORS.dangerLight}}>
            <Target size={20} style={{ color: totalRemaining >= 0 ? COLORS.success : COLORS.danger }} />
          </div>
          <span style={styles.statLabel}>Remaining</span>
          <span style={{...styles.statValue, color: totalRemaining >= 0 ? COLORS.success : COLORS.danger}}>
            CFA {totalRemaining.toLocaleString()}
          </span>
        </div>
        <div style={{...styles.statCard, borderBottom: `3px solid ${COLORS.warning}`}}>
          <div style={{...styles.statIconWrapper, background: COLORS.warningLight}}>
            <Percent size={20} style={{ color: COLORS.warning }} />
          </div>
          <span style={styles.statLabel}>Usage Rate</span>
          <span style={{...styles.statValue, color: COLORS.warning}}>
            {budgetUsagePct}%
          </span>
        </div>
      </div>

      {/* Filters & Controls */}
      <div style={styles.controlsContainer}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Category Filter</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={styles.filterSelect}
          >
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.viewToggle}>
          <button
            onClick={() => setViewMode('grid')}
            style={{...styles.viewBtn, ...(viewMode === 'grid' ? styles.viewBtnActive : {})}}
          >
            <BarChart3 size={16} />
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{...styles.viewBtn, ...(viewMode === 'list' ? styles.viewBtnActive : {})}}
          >
            <Eye size={16} />
            List
          </button>
        </div>
      </div>

      {/* Budget Cards/List */}
      {filteredBudgets.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>📊</div>
          <p style={styles.emptyStateText}>No budgets found</p>
          <span style={styles.emptyStateSub}>
            {budgets.length === 0 ? 'Create your first budget to start tracking' : 'No budgets match your filter'}
          </span>
        </div>
      ) : (
        <div style={viewMode === 'grid' ? styles.budgetGrid : styles.budgetList}>
          {filteredBudgets.map(budget => {
            const limit = budget.limit || 1;
            const percentage = Math.min((budget.spent / limit) * 100, 100);
            const isOverspent = budget.spent > limit;
            const isNearLimit = percentage > 85 && !isOverspent;
            
            let progressColor = COLORS.success;
            if (isNearLimit) progressColor = COLORS.warning;
            if (isOverspent) progressColor = COLORS.danger;

            const categoryEmojis = {
              'Food': '🍔',
              'Rent': '🏠',
              'Bills': '📄',
              'Transport': '🚗',
              'Shopping': '🛍️',
              'Entertainment': '🎬',
              'Healthcare': '🏥',
              'Education': '📚',
              'Groceries': '🛒',
              'Utilities': '⚡',
              'Insurance': '🛡️',
              'Other': '📌'
            };

            return (
              <div key={budget.id} style={viewMode === 'grid' ? styles.budgetCard : styles.budgetListItem}>
                <div style={styles.budgetHeader}>
                  <div style={styles.budgetTitle}>
                    <span style={styles.budgetEmoji}>
                      {categoryEmojis[budget.category] || '📌'}
                    </span>
                    <div>
                      <h3 style={styles.budgetCategory}>{budget.category}</h3>
                      <span style={styles.budgetLimit}>Limit: CFA {limit.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={styles.budgetActions}>
                    {isOverspent && (
                      <span style={styles.budgetBadge}>
                        <ShieldAlert size={14} />
                        Exceeded
                      </span>
                    )}
                    {isNearLimit && !isOverspent && (
                      <span style={{...styles.budgetBadge, background: COLORS.warningLight, color: COLORS.warning}}>
                        <AlertCircle size={14} />
                        Near Limit
                      </span>
                    )}
                    <button
                      onClick={() => handleEditBudget(budget)}
                      style={styles.budgetActionBtn}
                      title="Edit budget"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteBudget(budget.id, budget.category)}
                      style={{...styles.budgetActionBtn, color: COLORS.danger}}
                      title="Delete budget"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={styles.budgetProgress}>
                  <div style={styles.progressInfo}>
                    <span style={styles.progressLabel}>
                      Spent: CFA {budget.spent.toLocaleString()}
                    </span>
                    <span style={{...styles.progressPercent, color: progressColor}}>
                      {Math.round(percentage)}%
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${percentage}%`,
                        background: progressColor
                      }}
                    ></div>
                  </div>
                </div>

                <div style={styles.budgetFooter}>
                  <span style={styles.remainingLabel}>Remaining</span>
                  <span style={{
                    ...styles.remainingValue,
                    color: isOverspent ? COLORS.danger : COLORS.success
                  }}>
                    {isOverspent ? '−' : '+'}CFA {Math.abs(budget.remaining).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Tips Section */}
      {budgets.length > 0 && (
        <div style={styles.tipsContainer}>
          <div style={styles.tipsHeader}>
            <AlertCircle size={18} style={{ color: COLORS.primary }} />
            <h3 style={styles.tipsTitle}>Budget Insights</h3>
          </div>
          <div style={styles.tipsGrid}>
            <div style={styles.tipCard}>
              <span style={styles.tipIcon}>💡</span>
              <p style={styles.tipText}>
                {totalRemaining > 0 
                  ? `You have CFA ${totalRemaining.toLocaleString()} remaining across all categories`
                  : 'You have exceeded your total budget'}
              </p>
            </div>
            <div style={styles.tipCard}>
              <span style={styles.tipIcon}>🎯</span>
              <p style={styles.tipText}>
                {budgets.filter(b => b.spent > b.limit).length > 0
                  ? `${budgets.filter(b => b.spent > b.limit).length} categories are over budget`
                  : 'All categories are within budget limits'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const styles = {
  container: {
    padding: '28px',
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
    alignItems: 'center',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerIconWrapper: {
    width: '48px',
    height: '48px',
    background: COLORS.warningLight,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  refreshBtn: {
    padding: '10px',
    background: 'white',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    color: COLORS.gray[600],
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  addBtn: {
    padding: '10px 20px',
    background: COLORS.warning,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
  },
  alert: {
    padding: '14px 20px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    position: 'relative',
    fontWeight: '500',
  },
  alertSuccess: {
    background: COLORS.successLight,
    border: `1px solid ${COLORS.success}`,
    color: COLORS.success,
  },
  alertError: {
    background: COLORS.dangerLight,
    border: `1px solid ${COLORS.danger}`,
    color: COLORS.danger,
  },
  alertClose: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    opacity: 0.7,
    transition: 'opacity 0.2s',
  },
  formContainer: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: `1px solid ${COLORS.gray[200]}`,
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
  },
  formTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  formInput: {
    padding: '10px 12px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    fontSize: '14px',
    background: COLORS.gray[50],
    color: COLORS.gray[900],
    outline: 'none',
    transition: 'all 0.2s',
  },
  formSelect: {
    padding: '10px 12px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    fontSize: '14px',
    background: COLORS.gray[50],
    color: COLORS.gray[900],
    outline: 'none',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  formCancel: {
    padding: '10px 20px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    background: 'white',
    color: COLORS.gray[600],
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  formSubmit: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '8px',
    background: COLORS.warning,
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  statIconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  controlsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  filterSelect: {
    padding: '8px 12px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    background: 'white',
    color: COLORS.gray[900],
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
  },
  viewToggle: {
    display: 'flex',
    gap: '4px',
    background: 'white',
    padding: '4px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  viewBtn: {
    padding: '6px 12px',
    border: 'none',
    background: 'transparent',
    borderRadius: '6px',
    color: COLORS.gray[500],
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s',
  },
  viewBtnActive: {
    background: COLORS.primary,
    color: 'white',
  },
  budgetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  budgetList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  budgetCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${COLORS.gray[200]}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'all 0.2s',
  },
  budgetListItem: {
    background: 'white',
    borderRadius: '10px',
    padding: '16px 20px',
    border: `1px solid ${COLORS.gray[200]}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'all 0.2s',
  },
  budgetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  budgetTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  budgetEmoji: {
    fontSize: '24px',
  },
  budgetCategory: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  budgetLimit: {
    fontSize: '12px',
    color: COLORS.gray[500],
  },
  budgetActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  budgetBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '12px',
    background: COLORS.dangerLight,
    color: COLORS.danger,
    fontSize: '11px',
    fontWeight: '600',
  },
  budgetActionBtn: {
    padding: '4px',
    border: 'none',
    background: 'transparent',
    color: COLORS.gray[400],
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  budgetProgress: {
    marginBottom: '12px',
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    fontSize: '13px',
  },
  progressLabel: {
    color: COLORS.gray[600],
  },
  progressPercent: {
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: COLORS.gray[200],
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  budgetFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: `1px solid ${COLORS.gray[100]}`,
  },
  remainingLabel: {
    fontSize: '13px',
    color: COLORS.gray[500],
  },
  remainingValue: {
    fontSize: '15px',
    fontWeight: '700',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 0',
    background: 'white',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  emptyStateIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyStateText: {
    fontSize: '18px',
    fontWeight: '600',
    color: COLORS.gray[700],
    margin: 0,
  },
  emptyStateSub: {
    fontSize: '14px',
    color: COLORS.gray[400],
  },
  tipsContainer: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  tipsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  tipsTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  tipsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '12px',
  },
  tipCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    background: COLORS.gray[50],
    borderRadius: '8px',
  },
  tipIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  tipText: {
    margin: 0,
    fontSize: '13px',
    color: COLORS.gray[700],
    lineHeight: '1.5',
  },
};

// Add keyframes and hover styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .refresh-btn:hover {
    background: ${COLORS.gray[50]};
    transform: rotate(90deg);
  }
  
  .add-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(217, 119, 6, 0.4);
  }
  
  .form-input:focus, .form-select:focus {
    border-color: ${COLORS.warning};
    box-shadow: 0 0 0 3px ${COLORS.warningLight};
  }
  
  .form-cancel:hover {
    background: ${COLORS.gray[50]};
  }
  
  .form-submit:hover {
    background: #b45309;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
  }
  
  .budget-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }
  
  .budget-list-item:hover {
    background: ${COLORS.gray[50]};
    transform: translateX(4px);
  }
  
  .budget-action-btn:hover {
    background: ${COLORS.gray[100]};
    transform: scale(1.1);
  }
  
  .view-btn:hover:not(.view-btn-active) {
    background: ${COLORS.gray[50]};
  }
  
  .filter-select:focus {
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 3px ${COLORS.primaryLight};
  }
  
  .alert-close:hover {
    opacity: 1;
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }
`;
document.head.appendChild(styleSheet);