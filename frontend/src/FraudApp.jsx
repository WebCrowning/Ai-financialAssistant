import React, { useState } from 'react';
import FraudLiveDashboard from './components/FraudLiveDashboard';
import FraudTransactions from './components/FraudTransactions';
import FraudAnalytics from './components/FraudAnalytics';
import RuleEngine from './components/RuleEngine';
import MLScorer from './components/MLScorer';
import UserProfiles from './components/UserProfiles';
import AlertRules from './components/AlertRules';
import { ShieldAlert, Activity, AlertTriangle, TrendingUp, Settings, Brain, Users, Bell, LogOut, ArrowLeft, Menu, X } from 'lucide-react';

export default function FraudApp() {
  const [activeTab, setActiveTab] = useState('fraud-live');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Verification: requires admin role
  const isFinanceAdmin = user?.role === 'admin';

  const handleBackToFinance = () => {
    window.location.href = '/';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!token || !user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
        <div className="glass-card" style={{ textAlign: 'center', maxWidth: '400px', width: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ShieldAlert size={64} style={{ color: 'var(--danger)', margin: '0 auto' }} />
          <h2 style={{ color: 'var(--text-primary)' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You must be logged in to access the SENTINEL system.</p>
          <button onClick={() => window.location.href = '/'} className="btn-primary" style={{ width: '100%' }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isFinanceAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
        <div className="glass-card" style={{ textAlign: 'center', maxWidth: '400px', width: '100%', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ShieldAlert size={64} style={{ color: 'var(--danger)', margin: '0 auto' }} />
          <h2 style={{ color: 'var(--text-primary)' }}>Unauthorized</h2>
          <p style={{ color: 'var(--text-secondary)' }}>SENTINEL requires administrator privileges. Your current role is not authorized.</p>
          <button onClick={handleBackToFinance} className="btn-primary" style={{ width: '100%' }}>
            Back to Finance Tracker
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'fraud-live':
        return <FraudLiveDashboard />;
      case 'fraud-transactions':
        return <FraudTransactions />;
      case 'fraud-analytics':
        return <FraudAnalytics />;
      case 'rule-engine':
        return <RuleEngine />;
      case 'ml-scorer':
        return <MLScorer />;
      case 'user-profiles':
        return <UserProfiles />;
      case 'alert-rules':
        return <AlertRules />;
      default:
        return <FraudLiveDashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      <div className={`sidebar no-print ${isSidebarOpen ? '' : 'is-collapsed'}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={28} />
            <strong style={{ fontSize: '1.2rem', letterSpacing: '0.02em' }}>SENTINEL</strong>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--sidebar-muted)', cursor: 'pointer', padding: '4px' }}
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="nav-label">Monitor</div>
        <div className="nav-section">
          <button onClick={() => setActiveTab('fraud-live')} className={`nav-item ${activeTab === 'fraud-live' ? 'active' : ''}`}>
            <Activity size={18} />
            <span>Live Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('fraud-transactions')} className={`nav-item ${activeTab === 'fraud-transactions' ? 'active' : ''}`}>
            <AlertTriangle size={18} />
            <span>Flagged Txns</span>
          </button>
          <button onClick={() => setActiveTab('fraud-analytics')} className={`nav-item ${activeTab === 'fraud-analytics' ? 'active' : ''}`}>
            <TrendingUp size={18} />
            <span>Fraud Analytics</span>
          </button>
        </div>

        <div className="nav-label">Engine</div>
        <div className="nav-section">
          <button onClick={() => setActiveTab('rule-engine')} className={`nav-item ${activeTab === 'rule-engine' ? 'active' : ''}`}>
            <Settings size={18} />
            <span>Rule Engine</span>
          </button>
          <button onClick={() => setActiveTab('ml-scorer')} className={`nav-item ${activeTab === 'ml-scorer' ? 'active' : ''}`}>
            <Brain size={18} />
            <span>ML Scorer</span>
          </button>
        </div>

        <div className="nav-label">Config</div>
        <div className="nav-section">
          <button onClick={() => setActiveTab('user-profiles')} className={`nav-item ${activeTab === 'user-profiles' ? 'active' : ''}`}>
            <Users size={18} />
            <span>User Profiles</span>
          </button>
          <button onClick={() => setActiveTab('alert-rules')} className={`nav-item ${activeTab === 'alert-rules' ? 'active' : ''}`}>
            <Bell size={18} />
            <span>Alert Rules</span>
          </button>
        </div>

        {/* Bottom navigation panel */}
        <div style={{ marginTop: 'auto' }}>
          <button className="nav-item" onClick={handleBackToFinance}>
            <ArrowLeft size={16} />
            <span>Finance Tracker</span>
          </button>
          <button className="nav-item" onClick={handleLogout} style={{ marginTop: '6px' }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Floating Toggle Button for collapsed Sidebar on desktop */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="sidebar-toggle-btn no-print"
          title="Expand Sidebar"
          aria-label="Expand Sidebar"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Mobile Top Header */}
      <div className="mobile-header no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={24} style={{ color: 'var(--sidebar-accent)' }} />
          <strong style={{ fontSize: '1.1rem', color: '#fff', letterSpacing: '0.02em' }}>SENTINEL</strong>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
          style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      <div className={`mobile-dropdown no-print ${isMobileMenuOpen ? 'is-open' : ''}`}>
        <div className="nav-label">Monitor</div>
        <div className="nav-section">
          <button onClick={() => { setActiveTab('fraud-live'); setMobileMenuOpen(false); }} className={`nav-item ${activeTab === 'fraud-live' ? 'active' : ''}`}>
            <Activity size={18} />
            <span>Live Dashboard</span>
          </button>
          <button onClick={() => { setActiveTab('fraud-transactions'); setMobileMenuOpen(false); }} className={`nav-item ${activeTab === 'fraud-transactions' ? 'active' : ''}`}>
            <AlertTriangle size={18} />
            <span>Flagged Txns</span>
          </button>
          <button onClick={() => { setActiveTab('fraud-analytics'); setMobileMenuOpen(false); }} className={`nav-item ${activeTab === 'fraud-analytics' ? 'active' : ''}`}>
            <TrendingUp size={18} />
            <span>Fraud Analytics</span>
          </button>
        </div>

        <div className="nav-label">Engine</div>
        <div className="nav-section">
          <button onClick={() => { setActiveTab('rule-engine'); setMobileMenuOpen(false); }} className={`nav-item ${activeTab === 'rule-engine' ? 'active' : ''}`}>
            <Settings size={18} />
            <span>Rule Engine</span>
          </button>
          <button onClick={() => { setActiveTab('ml-scorer'); setMobileMenuOpen(false); }} className={`nav-item ${activeTab === 'ml-scorer' ? 'active' : ''}`}>
            <Brain size={18} />
            <span>ML Scorer</span>
          </button>
        </div>

        <div className="nav-label">Config</div>
        <div className="nav-section">
          <button onClick={() => { setActiveTab('user-profiles'); setMobileMenuOpen(false); }} className={`nav-item ${activeTab === 'user-profiles' ? 'active' : ''}`}>
            <Users size={18} />
            <span>User Profiles</span>
          </button>
          <button onClick={() => { setActiveTab('alert-rules'); setMobileMenuOpen(false); }} className={`nav-item ${activeTab === 'alert-rules' ? 'active' : ''}`}>
            <Bell size={18} />
            <span>Alert Rules</span>
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="nav-item" onClick={handleBackToFinance}>
            <ArrowLeft size={16} />
            <span>Finance Tracker</span>
          </button>
          <button className="nav-item" onClick={handleLogout} style={{ marginTop: '6px' }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main content viewport */}
      <div className={`main-content ${isSidebarOpen ? '' : 'is-collapsed'}`}>
        {renderContent()}
      </div>
    </div>
  );
}
