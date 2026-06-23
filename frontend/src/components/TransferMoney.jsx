import React, { useState, useEffect } from 'react';

// Font Awesome CDN (add to index.html)
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

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
  black: '#000000'
};

export default function TransferMoney({ token }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [transferType, setTransferType] = useState('goal_to_goal');
  const [fromGoalId, setFromGoalId] = useState('');
  const [toGoalId, setToGoalId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [incomeSource, setIncomeSource] = useState('');
  const [selectedFromGoal, setSelectedFromGoal] = useState(null);
  const [selectedToGoal, setSelectedToGoal] = useState(null);

  useEffect(() => {
    fetchGoals();
  }, [token]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/goals', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setGoals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (transferType === 'goal_to_goal') {
        if (fromGoalId === toGoalId) {
          throw new Error('Cannot transfer to the same goal.');
        }
        const response = await fetch('/api/goals/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            fromGoalId: parseInt(fromGoalId),
            toGoalId: parseInt(toGoalId),
            amount: parseFloat(transferAmount)
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to transfer');
        setSuccess('Funds successfully transferred between goals!');
      } else {
        const incRes = await fetch('/api/income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            amount: parseFloat(transferAmount),
            source: incomeSource || 'External Transfer',
            category: 'transfer',
            is_irregular: true,
            date: new Date().toISOString().split('T')[0],
            notes: `Direct allocation to goal ID ${toGoalId}`
          })
        });
        if (!incRes.ok) throw new Error('Failed to record income');
        setSuccess('Funds received and logged as external income!');
      }

      setTransferAmount('');
      setIncomeSource('');
      fetchGoals();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalGoalSavings = goals.reduce((s, g) => s + parseFloat(g.current_amount || 0), 0);
  const fromGoal = goals.find(g => g.id === parseInt(fromGoalId));
  const toGoal = goals.find(g => g.id === parseInt(toGoalId));

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIconWrapper}>
            <i className="fas fa-arrow-right-arrow-left" style={{ color: COLORS.white, fontSize: '24px' }}></i>
          </div>
          <div>
            <h1 style={styles.title}>Money Transfers</h1>
            <p style={styles.subtitle}>Shift funds between your saving milestones or receive external income directly</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button onClick={fetchGoals} style={styles.refreshBtn}>
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            Refresh
          </button>
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div style={styles.errorAlert}>
          <i className="fas fa-exclamation-triangle" style={{ color: COLORS.danger }}></i>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div style={styles.successAlert}>
          <i className="fas fa-check-circle" style={{ color: COLORS.success }}></i>
          <span>{success}</span>
        </div>
      )}

      <div style={styles.mainGrid}>
        {/* Balances Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.balanceCard}>
            <div style={styles.balanceIconWrapper}>
              <i className="fas fa-wallet" style={{ color: COLORS.primary, fontSize: '20px' }}></i>
            </div>
            <div>
              <span style={styles.balanceLabel}>Total Goal Reserves</span>
              <span style={styles.balanceValue}>CFA {Math.round(totalGoalSavings).toLocaleString()}</span>
            </div>
          </div>
          
          <div style={styles.goalsCard}>
            <h3 style={styles.goalsTitle}>
              <i className="fas fa-bullseye" style={{ color: COLORS.secondary }}></i>
              Active Goals
            </h3>
            {loading ? (
              <div style={styles.loadingState}>
                <div style={styles.loadingSpinner}></div>
                <span>Loading goals...</span>
              </div>
            ) : goals.length === 0 ? (
              <div style={styles.emptyGoals}>
                <i className="fas fa-inbox" style={{ fontSize: '32px', color: COLORS.gray[300] }}></i>
                <p style={styles.emptyGoalsText}>No goals available</p>
                <span style={styles.emptyGoalsSub}>Create a goal first</span>
              </div>
            ) : (
              <div style={styles.goalsList}>
                {goals.map(g => {
                  const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
                  const isCompleted = pct >= 100;
                  return (
                    <div key={g.id} style={styles.goalItem}>
                      <div style={styles.goalHeader}>
                        <span style={styles.goalName}>{g.name}</span>
                        <span style={styles.goalAmount}>CFA {parseFloat(g.current_amount).toLocaleString()}</span>
                      </div>
                      <div style={styles.goalProgress}>
                        <div style={styles.goalProgressBar}>
                          <div style={{
                            ...styles.goalProgressFill,
                            width: `${Math.min(pct, 100)}%`,
                            background: isCompleted ? COLORS.success : COLORS.primary
                          }} />
                        </div>
                        <span style={styles.goalProgressText}>{Math.round(Math.min(pct, 100))}%</span>
                      </div>
                      {isCompleted && (
                        <span style={styles.goalCompleted}>
                          <i className="fas fa-check-circle"></i>
                          Completed!
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Transfer Form */}
        <div style={styles.formCard}>
          {/* Tabs */}
          <div style={styles.tabsContainer}>
            <button
              onClick={() => setTransferType('goal_to_goal')}
              style={{
                ...styles.tab,
                ...(transferType === 'goal_to_goal' ? styles.tabActive : {})
              }}
            >
              <i className="fas fa-arrows-left-right"></i>
              Internal Transfer
            </button>
            <button
              onClick={() => setTransferType('external_income')}
              style={{
                ...styles.tab,
                ...(transferType === 'external_income' ? styles.tabActive : {})
              }}
            >
              <i className="fas fa-arrow-trend-up"></i>
              External Income
            </button>
          </div>

          <form onSubmit={handleTransfer} style={styles.form}>
            {transferType === 'goal_to_goal' ? (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    <i className="fas fa-arrow-right-from-bracket" style={{ color: COLORS.danger }}></i>
                    Transfer From (Source Goal)
                  </label>
                  <div style={styles.selectWrapper}>
                    <i className="fas fa-wallet" style={styles.selectIcon}></i>
                    <select 
                      style={styles.select} 
                      value={fromGoalId} 
                      onChange={e => {
                        setFromGoalId(e.target.value);
                        setSelectedFromGoal(goals.find(g => g.id === parseInt(e.target.value)));
                      }}
                      required
                    >
                      <option value="" style={{ background: COLORS.white, color: COLORS.gray[700] }}>
                        Select source goal...
                      </option>
                      {goals.map(g => (
                        <option 
                          key={g.id} 
                          value={g.id} 
                          style={{ 
                            background: COLORS.white, 
                            color: COLORS.gray[900],
                            padding: '8px 12px'
                          }}
                        >
                          {g.name} (Available: CFA {parseFloat(g.current_amount).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  {fromGoal && (
                    <div style={styles.goalInfo}>
                      <span style={styles.goalInfoLabel}>Available balance:</span>
                      <span style={{...styles.goalInfoValue, color: COLORS.success}}>
                        CFA {parseFloat(fromGoal.current_amount).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div style={styles.transferArrow}>
                  <div style={styles.transferArrowLine}></div>
                  <div style={styles.transferArrowIcon}>
                    <i className="fas fa-arrow-down" style={{ color: COLORS.primary, fontSize: '18px' }}></i>
                  </div>
                  <div style={styles.transferArrowLine}></div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    <i className="fas fa-arrow-right-to-bracket" style={{ color: COLORS.success }}></i>
                    Transfer To (Destination Goal)
                  </label>
                  <div style={styles.selectWrapper}>
                    <i className="fas fa-bullseye" style={styles.selectIcon}></i>
                    <select 
                      style={styles.select} 
                      value={toGoalId} 
                      onChange={e => {
                        setToGoalId(e.target.value);
                        setSelectedToGoal(goals.find(g => g.id === parseInt(e.target.value)));
                      }}
                      required
                    >
                      <option value="" style={{ background: COLORS.white, color: COLORS.gray[700] }}>
                        Select destination goal...
                      </option>
                      {goals.map(g => (
                        <option 
                          key={g.id} 
                          value={g.id} 
                          style={{ 
                            background: COLORS.white, 
                            color: COLORS.gray[900],
                            padding: '8px 12px'
                          }}
                        >
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {toGoal && (
                    <div style={styles.goalInfo}>
                      <span style={styles.goalInfoLabel}>Current balance:</span>
                      <span style={styles.goalInfoValue}>
                        CFA {parseFloat(toGoal.current_amount).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    <i className="fas fa-user" style={{ color: COLORS.primary }}></i>
                    Income Source / Sender
                  </label>
                  <div style={styles.inputWrapper}>
                    <i className="fas fa-trend-up" style={styles.inputIcon}></i>
                    <input
                      type="text"
                      style={styles.input}
                      value={incomeSource}
                      onChange={e => setIncomeSource(e.target.value)}
                      placeholder="e.g. Bonus, Friend Transfer"
                      required
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    <i className="fas fa-bullseye" style={{ color: COLORS.secondary }}></i>
                    Allocate Directly to Goal (Optional)
                  </label>
                  <div style={styles.selectWrapper}>
                    <i className="fas fa-flag" style={styles.selectIcon}></i>
                    <select 
                      style={styles.select} 
                      value={toGoalId} 
                      onChange={e => setToGoalId(e.target.value)}
                    >
                      <option value="" style={{ background: COLORS.white, color: COLORS.gray[700] }}>
                        Just log as general income
                      </option>
                      {goals.map(g => (
                        <option 
                          key={g.id} 
                          value={g.id} 
                          style={{ 
                            background: COLORS.white, 
                            color: COLORS.gray[900],
                            padding: '8px 12px'
                          }}
                        >
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <i className="fas fa-money-bill-wave" style={{ color: COLORS.warning }}></i>
                Amount to Transfer (CFA)
              </label>
              <div style={styles.amountInputWrapper}>
                <span style={styles.amountPrefix}>CFA</span>
                <input
                  type="number"
                  style={styles.amountInput}
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  min="1"
                  step="100"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={submitting || goals.length === 0}
              style={{
                ...styles.submitBtn,
                opacity: (submitting || goals.length === 0) ? 0.6 : 1,
                cursor: (submitting || goals.length === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  {transferType === 'goal_to_goal' ? 'Execute Transfer' : 'Record & Receive Funds'}
                </>
              )}
            </button>

            {goals.length === 0 && (
              <p style={styles.noGoalsWarning}>
                <i className="fas fa-exclamation-circle" style={{ color: COLORS.warning }}></i>
                You must create at least one saving goal first.
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .tab:hover:not(.tab-active) {
          background: ${COLORS.gray[100]};
        }
        .refresh-btn:hover {
          background: ${COLORS.gray[100]};
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
        }
        .select:focus, .input:focus, .amount-input:focus {
          border-color: ${COLORS.primary};
          box-shadow: 0 0 0 3px ${COLORS.primaryLight};
        }
        
        /* Fix for dark dropdown options */
        .select option {
          background: ${COLORS.white} !important;
          color: ${COLORS.gray[900]} !important;
          padding: 8px 12px !important;
        }
        
        /* Fix for dark dropdown in Firefox */
        .select option:hover {
          background: ${COLORS.primaryLight} !important;
          color: ${COLORS.primary} !important;
        }
        
        /* Fix for dark dropdown in Chrome/Safari */
        .select optgroup {
          background: ${COLORS.white} !important;
          color: ${COLORS.gray[900]} !important;
        }
        
        .select::-webkit-listbox {
          background: ${COLORS.white} !important;
          color: ${COLORS.gray[900]} !important;
        }
        
        @media (max-width: 1024px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
          .sidebar {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 16px !important;
          }
        }
        
        @media (max-width: 640px) {
          .sidebar {
            grid-template-columns: 1fr !important;
          }
          .header {
            flex-direction: column !important;
            text-align: center !important;
          }
          .header-left {
            flex-direction: column !important;
          }
          .tabs-container {
            flex-direction: column !important;
          }
          .container {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

// Styles
const styles = {
  container: {
    padding: '28px',
    maxWidth: '1100px',
    margin: '0 auto',
    background: COLORS.gray[50],
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    padding: '20px 24px',
    background: COLORS.white,
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
    fontSize: '24px',
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
    padding: '8px 16px',
    background: COLORS.white,
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    color: COLORS.gray[600],
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  errorAlert: {
    padding: '12px 18px',
    background: COLORS.dangerLight,
    border: `1px solid ${COLORS.danger}`,
    borderRadius: '10px',
    color: COLORS.danger,
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '20px',
  },
  successAlert: {
    padding: '12px 18px',
    background: COLORS.successLight,
    border: `1px solid ${COLORS.success}`,
    borderRadius: '10px',
    color: COLORS.success,
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '20px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '24px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  balanceCard: {
    padding: '20px',
    background: COLORS.white,
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  balanceIconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: COLORS.primaryLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  balanceLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  balanceValue: {
    display: 'block',
    fontSize: '22px',
    fontWeight: '700',
    color: COLORS.gray[900],
    marginTop: '2px',
  },
  goalsCard: {
    padding: '20px',
    background: COLORS.white,
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
    flex: 1,
  },
  goalsTitle: {
    margin: '0 0 16px 0',
    fontSize: '15px',
    fontWeight: '600',
    color: COLORS.gray[700],
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '20px',
    color: COLORS.gray[500],
  },
  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: `2px solid ${COLORS.gray[200]}`,
    borderTop: `2px solid ${COLORS.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyGoals: {
    textAlign: 'center',
    padding: '20px 0',
  },
  emptyGoalsText: {
    margin: '8px 0 4px 0',
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  emptyGoalsSub: {
    fontSize: '13px',
    color: COLORS.gray[400],
  },
  goalsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  goalItem: {
    padding: '12px',
    background: COLORS.gray[50],
    borderRadius: '10px',
    border: `1px solid ${COLORS.gray[100]}`,
  },
  goalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  goalName: {
    fontSize: '13px',
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  goalAmount: {
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  goalProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  goalProgressBar: {
    flex: 1,
    height: '4px',
    background: COLORS.gray[200],
    borderRadius: '2px',
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.5s ease',
  },
  goalProgressText: {
    fontSize: '11px',
    fontWeight: '600',
    color: COLORS.gray[500],
    minWidth: '30px',
  },
  goalCompleted: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: COLORS.success,
  },
  formCard: {
    padding: '32px',
    background: COLORS.white,
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  tabsContainer: {
    display: 'flex',
    gap: '4px',
    background: COLORS.gray[50],
    padding: '4px',
    borderRadius: '12px',
    marginBottom: '24px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  tab: {
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    color: COLORS.gray[500],
    fontWeight: '500',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: COLORS.white,
    color: COLORS.primary,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.gray[700],
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  selectWrapper: {
    position: 'relative',
  },
  selectIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: COLORS.gray[400],
    fontSize: '16px',
  },
  select: {
    width: '100%',
    padding: '12px 16px 12px 44px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '10px',
    fontSize: '14px',
    background: COLORS.white,
    color: COLORS.gray[900],
    outline: 'none',
    transition: 'all 0.2s',
    appearance: 'none',
    cursor: 'pointer',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: COLORS.gray[400],
    fontSize: '16px',
  },
  input: {
    width: '100%',
    padding: '12px 16px 12px 44px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '10px',
    fontSize: '14px',
    background: COLORS.white,
    color: COLORS.gray[900],
    outline: 'none',
    transition: 'all 0.2s',
  },
  goalInfo: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    color: COLORS.gray[500],
    marginTop: '4px',
  },
  goalInfoLabel: {
    color: COLORS.gray[400],
  },
  goalInfoValue: {
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  transferArrow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '4px 0',
  },
  transferArrowLine: {
    flex: 1,
    height: '1px',
    background: COLORS.gray[200],
  },
  transferArrowIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: COLORS.primaryLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  amountInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '10px',
    background: COLORS.white,
    overflow: 'hidden',
  },
  amountPrefix: {
    padding: '12px 16px',
    background: COLORS.gray[100],
    color: COLORS.gray[600],
    fontWeight: '700',
    fontSize: '14px',
    borderRight: `1px solid ${COLORS.gray[200]}`,
  },
  amountInput: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    background: 'transparent',
    fontSize: '20px',
    fontWeight: '700',
    outline: 'none',
    color: COLORS.gray[900],
  },
  submitBtn: {
    padding: '14px',
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
    color: COLORS.white,
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    marginTop: '4px',
  },
  noGoalsWarning: {
    textAlign: 'center',
    color: COLORS.danger,
    fontSize: '13px',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
};

// Inject styles with dropdown fixes
if (typeof document !== 'undefined') {
  const styleId = 'transfer-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = `
      .select::-webkit-scrollbar {
        width: 6px;
      }
      .select::-webkit-scrollbar-track {
        background: ${COLORS.gray[100]};
      }
      .select::-webkit-scrollbar-thumb {
        background: ${COLORS.gray[300]};
        border-radius: 3px;
      }
      
      /* Fix for dark dropdown options in all browsers */
      select option {
        background: ${COLORS.white} !important;
        color: ${COLORS.gray[900]} !important;
        padding: 8px 12px !important;
      }
      
      select optgroup {
        background: ${COLORS.white} !important;
        color: ${COLORS.gray[900]} !important;
      }
      
      select option:hover {
        background: ${COLORS.primaryLight} !important;
        color: ${COLORS.primary} !important;
      }
      
      /* For Firefox */
      select:-moz-focusring {
        color: transparent;
        text-shadow: 0 0 0 ${COLORS.gray[900]};
      }
      
      /* For Chrome/Safari */
      select option:checked {
        background: ${COLORS.primaryLight} !important;
        color: ${COLORS.primary} !important;
      }
      
      .goals-list::-webkit-scrollbar {
        width: 4px;
      }
      .goals-list::-webkit-scrollbar-track {
        background: transparent;
      }
      .goals-list::-webkit-scrollbar-thumb {
        background: ${COLORS.gray[300]};
        border-radius: 2px;
      }
      
      @media (max-width: 1024px) {
        .main-grid {
          grid-template-columns: 1fr !important;
        }
        .sidebar {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 16px !important;
        }
      }
      
      @media (max-width: 640px) {
        .sidebar {
          grid-template-columns: 1fr !important;
        }
        .header {
          flex-direction: column !important;
          text-align: center !important;
        }
        .header-left {
          flex-direction: column !important;
        }
        .tabs-container {
          flex-direction: column !important;
        }
        .container {
          padding: 16px !important;
        }
        .form-card {
          padding: 20px !important;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}