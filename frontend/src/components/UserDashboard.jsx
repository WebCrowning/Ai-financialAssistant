import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Camera, Target, DollarSign, Printer, LogOut, 
  Settings, User, Plus, Trash2, ShieldAlert, Sparkle, ShoppingBag, ListCollapse
} from 'lucide-react';
const aiIcon = '/ai.png';

// Subcomponents
import SpendingOverview from './SpendingOverview';
import ReceiptScanner from './ReceiptScanner';
import GoalTracker from './GoalTracker';
import IncomeLogger from './IncomeLogger';
import AIAssistant from './AIAssistant';
import ReportGenerator from './ReportGenerator';

export default function UserDashboard({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [userProfile, setUserProfile] = useState(user);
  
  // Quick expense form states
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState('Food');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickIsSub, setQuickIsSub] = useState(false);
  const [refusedMessage, setRefusedMessage] = useState('');
  const [expenseAlerts, setExpenseAlerts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile Settings states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newIncomeVal, setNewIncomeVal] = useState(user.monthly_income);

  // Ledger searching & filtering states
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState('All');

  // Fetch all databases
  const fetchAllUserData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const expRes = await fetch('/api/expenses', { headers });
      const expData = await expRes.json();
      if (expRes.ok) setExpenses(expData);

      const budRes = await fetch('/api/budgets', { headers });
      const budData = await budRes.json();
      if (budRes.ok) setBudgets(budData);

      const goalRes = await fetch('/api/goals', { headers });
      const goalData = await goalRes.json();
      if (goalRes.ok) setGoals(goalData);

      const incRes = await fetch('/api/income', { headers });
      const incData = await incRes.json();
      if (incRes.ok) setIncomes(incData);

      // Re-sync user info
      const meRes = await fetch('/api/auth/me', { headers });
      const meData = await meRes.json();
      if (meRes.ok) setUserProfile(meData);
    } catch (err) {
      console.error('Error fetching user dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchAllUserData();
  }, [token]);

  // Log a quick manual expense
  const handleQuickExpense = async (e) => {
    e.preventDefault();
    setRefusedMessage('');
    setExpenseAlerts([]);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(quickAmount),
          category: quickCategory,
          description: quickDesc,
          date: new Date().toISOString().split('T')[0],
          is_subscription: quickIsSub
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.refused) {
          setRefusedMessage(data.message);
          return;
        }
        throw new Error(data.message || 'Error creating expense');
      }

      setQuickAmount('');
      setQuickDesc('');
      setQuickIsSub(false);
      
      if (data.alerts && data.alerts.length > 0) {
        setExpenseAlerts(data.alerts);
      }

      fetchAllUserData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateIncomeLimit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ monthly_income: parseFloat(newIncomeVal) })
      });

      if (response.ok) {
        setUserProfile(prev => ({ ...prev, monthly_income: newIncomeVal }));
        setShowSettingsModal(false);
        fetchAllUserData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <div className="sidebar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Sparkle size={24} />
          <strong style={{ fontSize: '1.2rem' }}>FinVision</strong>
        </div>

        <div className="nav-section">
          <button onClick={() => setActiveTab('overview')} className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard Overview</span>
          </button>
          <button onClick={() => setActiveTab('scan')} className={`nav-item ${activeTab === 'scan' ? 'active' : ''}`}>
            <Camera size={18} />
            <span>Receipt Scanner</span>
          </button>
          <button onClick={() => setActiveTab('goals')} className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`}>
            <Target size={18} />
            <span>Saving Goals</span>
          </button>
          <button onClick={() => setActiveTab('income')} className={`nav-item ${activeTab === 'income' ? 'active' : ''}`}>
            <DollarSign size={18} />
            <span>Income Registry</span>
          </button>
          <button onClick={() => setActiveTab('assistant')} className={`nav-item ${activeTab === 'assistant' ? 'active' : ''}`}>
            <img src={aiIcon} alt="AI Assistant" style={{ width: '18px', height: '18px', objectFit: 'contain', flexShrink: 0 }} />
            <span>AI Guardian & Forecasts</span>
          </button>
          <button onClick={() => setActiveTab('report')} className={`nav-item ${activeTab === 'report' ? 'active' : ''}`}>
            <Printer size={18} />
            <span>Financial Reports</span>
          </button>
        </div>

        {/* User Card inside Sidebar */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'var(--color-bg-tertiary)', borderRadius: '50%' }}>
              <User size={16} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{userProfile.email}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Guardian Shield: {userProfile.guardian_mode ? 'ACTIVE' : 'OFF'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="nav-item" onClick={() => setShowSettingsModal(true)} style={{ flex: 1, padding: '6px 8px', fontSize: '0.8rem' }}>
              <Settings size={14} />
              <span>Settings</span>
            </button>
            <button className="nav-item" onClick={onLogout} style={{ padding: '6px 8px' }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Panel View */}
      <div className="main-content">
        
        {/* Alerts Center */}
        {expenseAlerts.length > 0 && (
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {expenseAlerts.map((alt, idx) => (
              <div key={idx} className="alert-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} />
                  <span>{alt.message}</span>
                </div>
                <button 
                  onClick={() => setExpenseAlerts(prev => prev.filter((_, i) => i !== idx))}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: '600' }}
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}

        {refusedMessage && (
          <div className="alert-banner no-print" style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} />
              <span>{refusedMessage}</span>
            </div>
            <button onClick={() => setRefusedMessage('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: '600' }}>
              Dismiss
            </button>
          </div>
        )}

        {/* Settings Modal Dialog */}
        {showSettingsModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '350px', padding: '24px' }}>
              <h3>Settings Profile</h3>
              <form onSubmit={handleUpdateIncomeLimit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Expected Monthly Income ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newIncomeVal} 
                    onChange={(e) => setNewIncomeVal(e.target.value)} 
                    required 
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Changes</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dynamic Route Switching */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: 0 }}>Financial Dashboard</h1>
                <p style={{ margin: '4px 0 0 0' }}>Overview of active budgets and daily outlays</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              
              {/* Core spent overview */}
              <SpendingOverview 
                expenses={expenses} 
                budgets={budgets} 
                token={token} 
                monthlyIncome={userProfile.monthly_income}
                onRefresh={fetchAllUserData} 
              />

              {/* Fast log manual expense card */}
              <div className="glass-card" style={{ height: 'fit-content' }}>
                <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShoppingBag size={20} /> Log Expense</h2>
                <form onSubmit={handleQuickExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Expense Category</label>
                    <select className="form-input" value={quickCategory} onChange={(e) => setQuickCategory(e.target.value)}>
                      <option value="Food" style={{ background: '#0f172a' }}>Food</option>
                      <option value="Rent" style={{ background: '#0f172a' }}>Rent</option>
                      <option value="Bills" style={{ background: '#0f172a' }}>Bills & Light</option>
                      <option value="Sub" style={{ background: '#0f172a' }}>Subscription</option>
                      <option value="Other" style={{ background: '#0f172a' }}>Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Merchant / Title</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Starbucks" 
                      value={quickDesc} 
                      onChange={(e) => setQuickDesc(e.target.value)} 
                      required 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount ($)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="0.00" 
                      value={quickAmount} 
                      onChange={(e) => setQuickAmount(e.target.value)} 
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      id="quickIsSub" 
                      checked={quickIsSub} 
                      onChange={(e) => setQuickIsSub(e.target.checked)} 
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="quickIsSub" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Is recurring subscription charge</label>
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={isSubmitting}>
                    {isSubmitting ? 'Logging...' : 'Record Outlay'}
                  </button>
                </form>
              </div>

            </div>

            {/* List of transactions */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ margin: 0 }}>Ledger Debit Logs</h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search merchant..." 
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    style={{ width: '180px', padding: '6px 12px', fontSize: '0.85rem' }}
                  />
                  <select 
                    className="form-input" 
                    value={ledgerCategoryFilter} 
                    onChange={(e) => setLedgerCategoryFilter(e.target.value)}
                    style={{ width: '130px', padding: '6px 12px', fontSize: '0.85rem', background: 'rgba(15, 23, 42, 0.8)' }}
                  >
                    <option value="All" style={{ background: '#0f172a' }}>All Categories</option>
                    <option value="Food" style={{ background: '#0f172a' }}>Food</option>
                    <option value="Rent" style={{ background: '#0f172a' }}>Rent</option>
                    <option value="Bills" style={{ background: '#0f172a' }}>Bills & Light</option>
                    <option value="Sub" style={{ background: '#0f172a' }}>Subscription</option>
                    <option value="Other" style={{ background: '#0f172a' }}>Other</option>
                  </select>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Merchant</th>
                      <th style={{ padding: '12px' }}>Category</th>
                      <th style={{ padding: '12px' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses
                      .filter(exp => {
                        const matchesSearch = exp.description.toLowerCase().includes(ledgerSearch.toLowerCase());
                        const matchesCat = ledgerCategoryFilter === 'All' || exp.category === ledgerCategoryFilter;
                        return matchesSearch && matchesCat;
                      })
                      .map(exp => (
                      <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px', fontWeight: '500' }}>
                          {exp.description} 
                          {exp.is_subscription === 1 && <span className="badge badge-primary" style={{ fontSize: '0.55rem', padding: '1px 5px', marginLeft: '8px' }}>Sub</span>}
                        </td>
                        <td style={{ padding: '12px' }}>{exp.category}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{exp.date}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: exp.is_unusual ? 'var(--danger)' : 'var(--text-primary)' }}>
                          ${parseFloat(exp.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No logs in the transaction ledger. Log an outlay to get started.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scan' && (
          <ReceiptScanner token={token} onRefresh={fetchAllUserData} />
        )}

        {activeTab === 'goals' && (
          <GoalTracker goals={goals} token={token} onRefresh={fetchAllUserData} />
        )}

        {activeTab === 'income' && (
          <IncomeLogger incomes={incomes} token={token} onRefresh={fetchAllUserData} />
        )}

        {activeTab === 'assistant' && (
          <AIAssistant token={token} userSettings={userProfile} onSettingsUpdate={setUserProfile} />
        )}

        {activeTab === 'report' && (
          <ReportGenerator expenses={expenses} budgets={budgets} incomes={incomes} monthlyIncome={userProfile.monthly_income} />
        )}

      </div>
    </div>
  );
}
