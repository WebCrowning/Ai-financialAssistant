import React, { useState, useEffect } from 'react';

// Font Awesome CDN
// Add to index.html: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

// Professional color system
const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#dbeafe',
  secondary: '#7c3aed',
  secondaryLight: '#ede9fe',
  success: '#059669',
  successLight: '#d1fae5',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  warning: '#d97706',
  warningLight: '#fef3c7',
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
  },
  white: '#ffffff',
  dark: '#0f172a',
  cardBg: '#1e293b',
  border: 'rgba(255,255,255,0.06)'
};

export default function SavingsGoals({ token }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ 
    name: '🏠 Buy a House', 
    target: '', 
    deadline: '',
    icon: 'fa-home'
  });
  const [alertMsg, setAlertMsg] = useState(null);
  const [alertType, setAlertType] = useState('success');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [fundAmount, setFundAmount] = useState('');

  useEffect(() => {
    fetchGoals();
  }, [token]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/goals', { headers });
      const data = await res.json();
      if (res.ok) {
        setGoals(data);
      }
    } catch (err) {
      console.error('Error fetching savings goals:', err);
      showAlert('Failed to load goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlertMsg(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMsg(null);
    }, 4000);
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target) {
      showAlert('Please fill in all required fields', 'error');
      return;
    }

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newGoal.name,
          target_amount: parseFloat(newGoal.target),
          current_amount: 0.00,
          deadline: newGoal.deadline || null
        })
      });

      if (response.ok) {
        showAlert(`Savings goal "${newGoal.name}" created successfully!`);
        setNewGoal({ name: '🏠 Buy a House', target: '', deadline: '', icon: 'fa-home' });
        setShowAddGoal(false);
        fetchGoals();
      } else {
        showAlert('Failed to create goal', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('An error occurred', 'error');
    }
  };

  const handleFundGoal = async (id, amount) => {
    try {
      const response = await fetch(`/api/goals/${id}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      if (response.ok) {
        showAlert(`Added CFA ${amount.toLocaleString()} to savings target!`);
        fetchGoals();
        setSelectedGoal(null);
        setFundAmount('');
      }
    } catch (err) {
      console.error(err);
      showAlert('Failed to add funds', 'error');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Delete this savings goal?')) return;
    
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showAlert('Savings goal deleted.');
        fetchGoals();
      }
    } catch (err) {
      console.error(err);
      showAlert('Failed to delete goal', 'error');
    }
  };

  const getGoalIcon = (name) => {
    const icons = {
      '🏠 Buy a House': 'fa-home',
      '✈️ Vacation Fund': 'fa-plane',
      '🚗 New Car Fund': 'fa-car',
      '💻 Laptop Fund': 'fa-laptop',
      '📱 iPhone 17 Target': 'fa-mobile-alt',
      '🎓 Education / Tuition': 'fa-graduation-cap',
      '💵 Emergency Savings': 'fa-shield-alt'
    };
    return icons[name] || 'fa-bullseye';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <i className="fas fa-bullseye fa-3x" style={{ color: COLORS.primary, marginBottom: '16px' }}></i>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingTitle}>Loading your savings goals...</p>
          <p style={styles.loadingSubtitle}>Preparing your financial targets</p>
        </div>
      </div>
    );
  }

  const totalTarget = goals.reduce((sum, g) => sum + (parseFloat(g.target_amount) || 0), 0);
  const totalSaved = goals.reduce((sum, g) => sum + (parseFloat(g.current_amount) || 0), 0);
  const completionRate = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIconWrapper}>
            <i className="fas fa-bullseye" style={{ color: COLORS.white, fontSize: '24px' }}></i>
          </div>
          <div>
            <h1 style={styles.title}>Savings Goals</h1>
            <p style={styles.subtitle}>Track and achieve your financial milestones</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button
            onClick={fetchGoals}
            style={styles.refreshBtn}
            title="Refresh data"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            style={styles.addBtn}
          >
            <i className="fas fa-plus"></i>
            {showAddGoal ? 'Close Form' : 'New Goal'}
          </button>
        </div>
      </header>

      {/* Alert Messages */}
      {alertMsg && (
        <div style={{
          ...styles.alert,
          ...(alertType === 'success' ? styles.alertSuccess : styles.alertError)
        }}>
          <i className={`fas ${alertType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          <span>{alertMsg}</span>
          <button onClick={() => setAlertMsg(null)} style={styles.alertClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Add Goal Form */}
      {showAddGoal && (
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>
            <i className="fas fa-plus-circle" style={{ color: COLORS.primary, marginRight: '8px' }}></i>
            Create New Savings Goal
          </h2>
          <form onSubmit={handleCreateGoal} style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Goal Name</label>
                <select
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  style={styles.formSelect}
                >
                  <option value="🏠 Buy a House">🏠 Buy a House</option>
                  <option value="✈️ Vacation Fund">✈️ Vacation Fund</option>
                  <option value="🚗 New Car Fund">🚗 New Car Fund</option>
                  <option value="💻 Laptop Fund">💻 Laptop Fund</option>
                  <option value="📱 iPhone 17 Target">📱 iPhone 17 Target</option>
                  <option value="🎓 Education / Tuition">🎓 Education / Tuition</option>
                  <option value="💵 Emergency Savings">💵 Emergency Savings</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Target Amount (CFA)</label>
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                  required
                  style={styles.formInput}
                  min="0"
                  step="100"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Target Date (Optional)</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>&nbsp;</label>
                <button
                  type="submit"
                  style={styles.formSubmit}
                >
                  <i className="fas fa-check"></i>
                  Create Goal
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Stats Summary */}
      <div style={styles.statsContainer}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{...styles.statIconWrapper, background: COLORS.primaryLight}}>
              <i className="fas fa-flag" style={{ color: COLORS.primary, fontSize: '20px' }}></i>
            </div>
            <div>
              <span style={styles.statLabel}>Active Goals</span>
              <span style={styles.statValue}>{goals.length}</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIconWrapper, background: COLORS.secondaryLight}}>
              <i className="fas fa-bullseye" style={{ color: COLORS.secondary, fontSize: '20px' }}></i>
            </div>
            <div>
              <span style={styles.statLabel}>Total Target</span>
              <span style={{...styles.statValue, color: COLORS.secondary}}>
                CFA {totalTarget.toLocaleString()}
              </span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIconWrapper, background: COLORS.successLight}}>
              <i className="fas fa-check-circle" style={{ color: COLORS.success, fontSize: '20px' }}></i>
            </div>
            <div>
              <span style={styles.statLabel}>Total Saved</span>
              <span style={{...styles.statValue, color: COLORS.success}}>
                CFA {totalSaved.toLocaleString()}
              </span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statIconWrapper, background: COLORS.warningLight}}>
              <i className="fas fa-chart-line" style={{ color: COLORS.warning, fontSize: '20px' }}></i>
            </div>
            <div>
              <span style={styles.statLabel}>Completion</span>
              <span style={{...styles.statValue, color: COLORS.warning}}>
                {completionRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div style={styles.emptyState}>
          <i className="fas fa-bullseye" style={{ fontSize: '64px', color: COLORS.gray[300], marginBottom: '16px' }}></i>
          <p style={styles.emptyStateText}>No savings goals yet</p>
          <span style={styles.emptyStateSub}>Start by creating your first savings goal</span>
        </div>
      ) : (
        <div style={styles.goalsGrid}>
          {goals.map(goal => {
            const current = parseFloat(goal.current_amount) || 0;
            const target = parseFloat(goal.target_amount) || 1;
            const progress = Math.min(Math.round((current / target) * 100), 100);
            const isComplete = current >= target;
            const remaining = target - current;
            const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
            
            const icon = getGoalIcon(goal.name);

            return (
              <div key={goal.id} style={styles.goalCard}>
                <div style={styles.goalHeader}>
                  <div style={styles.goalIconWrapper}>
                    <i className={`fas ${icon}`} style={{ color: COLORS.primary, fontSize: '24px' }}></i>
                  </div>
                  <div style={styles.goalInfo}>
                    <h3 style={styles.goalName}>{goal.name}</h3>
                    {goal.deadline && (
                      <div style={styles.goalDeadline}>
                        <i className="fas fa-calendar-alt" style={{ fontSize: '12px' }}></i>
                        <span>{new Date(goal.deadline).toLocaleDateString()}</span>
                        {daysLeft !== null && daysLeft > 0 && (
                          <span style={styles.goalDaysLeft}>{daysLeft} days left</span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    style={styles.goalDeleteBtn}
                    title="Delete goal"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>

                <div style={styles.goalProgress}>
                  <div style={styles.progressInfo}>
                    <span style={styles.progressLabel}>
                      CFA {current.toLocaleString()} saved
                    </span>
                    <span style={styles.progressTarget}>
                      Target: CFA {target.toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${progress}%`,
                        background: isComplete 
                          ? `linear-gradient(90deg, ${COLORS.success}, ${COLORS.success})`
                          : `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`
                      }}
                    ></div>
                  </div>
                  <div style={styles.progressFooter}>
                    <span style={styles.progressPercent}>{progress}% Complete</span>
                    {!isComplete && (
                      <span style={styles.progressRemaining}>
                        Remaining: CFA {remaining.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {isComplete ? (
                  <div style={styles.completeBadge}>
                    <i className="fas fa-check-circle"></i>
                    <span>Goal Achieved! 🎉</span>
                  </div>
                ) : (
                  <div style={styles.fundActions}>
                    <div style={styles.fundPresets}>
                      <button
                        onClick={() => handleFundGoal(goal.id, 10000)}
                        style={styles.fundPresetBtn}
                      >
                        +10k
                      </button>
                      <button
                        onClick={() => handleFundGoal(goal.id, 50000)}
                        style={styles.fundPresetBtn}
                      >
                        +50k
                      </button>
                      <button
                        onClick={() => handleFundGoal(goal.id, 100000)}
                        style={styles.fundPresetBtn}
                      >
                        +100k
                      </button>
                    </div>
                    <div style={styles.fundCustom}>
                      <input
                        type="number"
                        placeholder="Custom amount"
                        value={selectedGoal === goal.id ? fundAmount : ''}
                        onChange={(e) => {
                          setSelectedGoal(goal.id);
                          setFundAmount(e.target.value);
                        }}
                        style={styles.fundInput}
                      />
                      <button
                        onClick={() => {
                          if (fundAmount && parseFloat(fundAmount) > 0) {
                            handleFundGoal(goal.id, parseFloat(fundAmount));
                          }
                        }}
                        style={styles.fundSubmitBtn}
                      >
                        <i className="fas fa-plus"></i> Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Tips */}
      {goals.length > 0 && (
        <div style={styles.tipsContainer}>
          <div style={styles.tipsHeader}>
            <i className="fas fa-lightbulb" style={{ color: COLORS.warning }}></i>
            <h3 style={styles.tipsTitle}>Savings Insights</h3>
          </div>
          <div style={styles.tipsGrid}>
            <div style={styles.tipCard}>
              <i className="fas fa-rocket" style={{ color: COLORS.primary, fontSize: '18px' }}></i>
              <p style={styles.tipText}>
                {goals.filter(g => parseFloat(g.current_amount) === 0).length > 0
                  ? `${goals.filter(g => parseFloat(g.current_amount) === 0).length} goals need initial funding`
                  : 'All goals have been started! Keep the momentum going!'}
              </p>
            </div>
            <div style={styles.tipCard}>
              <i className="fas fa-trophy" style={{ color: COLORS.warning, fontSize: '18px' }}></i>
              <p style={styles.tipText}>
                {goals.filter(g => parseFloat(g.current_amount) >= parseFloat(g.target_amount)).length > 0
                  ? `${goals.filter(g => parseFloat(g.current_amount) >= parseFloat(g.target_amount)).length} goals completed!`
                  : `Set aside CFA ${Math.round(totalTarget * 0.1).toLocaleString()} monthly to reach your goals`}
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
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: COLORS.gray[50],
  },
  loadingContent: {
    textAlign: 'center',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: `3px solid ${COLORS.gray[200]}`,
    borderTop: `3px solid ${COLORS.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  loadingTitle: {
    color: COLORS.gray[700],
    fontSize: '16px',
    fontWeight: '500',
    margin: 0,
  },
  loadingSubtitle: {
    color: COLORS.gray[400],
    fontSize: '13px',
    margin: '4px 0 0 0',
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
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
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
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
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
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
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
  formSubmit: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '8px',
    background: `linear-gradient(135deg, ${COLORS.success}, ${COLORS.success})`,
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
    height: '42px',
    marginTop: 'auto',
  },
  statsContainer: {
    marginBottom: '24px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIconWrapper: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    display: 'block',
    fontSize: '20px',
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  goalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  goalCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: `1px solid ${COLORS.gray[200]}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'all 0.2s',
  },
  goalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
  },
  goalIconWrapper: {
    width: '48px',
    height: '48px',
    background: COLORS.primaryLight,
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  goalDeadline: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
    fontSize: '12px',
    color: COLORS.gray[500],
  },
  goalDaysLeft: {
    padding: '2px 8px',
    background: COLORS.warningLight,
    color: COLORS.warning,
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  goalDeleteBtn: {
    padding: '6px',
    border: 'none',
    background: 'transparent',
    color: COLORS.gray[400],
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  goalProgress: {
    marginBottom: '16px',
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
  progressTarget: {
    color: COLORS.gray[500],
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
  progressFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '6px',
    fontSize: '12px',
  },
  progressPercent: {
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  progressRemaining: {
    color: COLORS.gray[500],
  },
  completeBadge: {
    padding: '12px',
    background: COLORS.successLight,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: COLORS.success,
    fontWeight: '600',
    fontSize: '14px',
  },
  fundActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  fundPresets: {
    display: 'flex',
    gap: '8px',
  },
  fundPresetBtn: {
    flex: 1,
    padding: '8px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '6px',
    background: 'white',
    color: COLORS.gray[700],
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  fundCustom: {
    display: 'flex',
    gap: '8px',
  },
  fundInput: {
    flex: 1,
    padding: '8px 12px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none',
    transition: 'all 0.2s',
  },
  fundSubmitBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    background: COLORS.primary,
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 0',
    background: 'white',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
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
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
  }
  
  .form-input:focus, .form-select:focus {
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 3px ${COLORS.primaryLight};
  }
  
  .form-submit:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
  }
  
  .goal-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }
  
  .goal-delete-btn:hover {
    background: ${COLORS.dangerLight};
    color: ${COLORS.danger};
  }
  
  .fund-preset-btn:hover {
    background: ${COLORS.primaryLight};
    border-color: ${COLORS.primary};
    color: ${COLORS.primary};
  }
  
  .fund-input:focus {
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 3px ${COLORS.primaryLight};
  }
  
  .fund-submit-btn:hover {
    background: ${COLORS.primaryDark};
    transform: scale(1.02);
  }
  
  .alert-close:hover {
    opacity: 0.7;
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }
`;
document.head.appendChild(styleSheet);