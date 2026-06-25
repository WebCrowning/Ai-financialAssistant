import React, { useState } from 'react';

import { Navigate } from 'react-router-dom';

import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import logoImage from './assets/logo.png';
import AdminLocalJobs from './components/AdminLocalJobs';

// Import sidebar images
import analysisImage from '../../images/analysis.png';
import transactionImage from '../../images/transaction.png';
import savingsImage from '../../images/savings.png';
import purseImage from '../../images/purse.png';
import creditCardImage from '../../images/credit-card.png';
import storeImage from '../../images/store.png';
import aiImage from '../../images/ai.png';
import virtualEnvironmentImage from '../../images/virtual-environment.png';

// Finance Tracker Pages
import FinanceDashboard from './components/FinanceDashboard';
import Transactions from './components/Transactions';
import Accounts from './components/Accounts';
import Analytics from './components/Analytics';
import Budget from './components/Budget';
import TransferMoney from './components/TransferMoney';
import Notifications from './components/Notifications';
import MyProfile from './components/MyProfile';
import ChatbotAnalytics from './components/ChatbotAnalytics';
import VirtualCards from './components/VirtualCards';
import Deposit from './components/Deposit';
import StoreSimulation from './components/store-simulation/StoreSimulation';
import AdminStoreSimulation from './components/AdminStoreSimulation';
import LandingPage from './components/LandingPage';
import LocalJobs from './components/LocalJobs';


// Fraud Detection Pages
import FraudLiveDashboard from './components/FraudLiveDashboard';
import FraudTransactions from './components/FraudTransactions';
import FraudAnalytics from './components/FraudAnalytics';
import RuleEngine from './components/RuleEngine';
import MLScorer from './components/MLScorer';
import UserProfiles from './components/UserProfiles';
import AlertRules from './components/AlertRules';

import AdminUserTransactions from './components/AdminUserTransactions';


import { 
  Sparkle, LayoutDashboard, CreditCard, TrendingUp, Settings, LogOut, Menu, X, ShieldAlert,
  DollarSign, Target, Calendar, Send, Brain, Bell, User, Activity, AlertTriangle, Users, Wallet,
  ShoppingBag
} from 'lucide-react';

// Icon mapping component
const IconComponent = ({ iconName, size = 18, image }) => {
  if (image) {
    return <img src={image} alt="" style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain' }} />;
  }
  const iconMap = {
    LayoutDashboard: <LayoutDashboard size={size} />,
    CreditCard: <CreditCard size={size} />,
    TrendingUp: <TrendingUp size={size} />,
    DollarSign: <DollarSign size={size} />,
    Target: <Target size={size} />,
    Calendar: <Calendar size={size} />,
    Send: <Send size={size} />,
    Brain: <Brain size={size} />,
    Bell: <Bell size={size} />,
    User: <User size={size} />,
    Activity: <Activity size={size} />,
    AlertTriangle: <AlertTriangle size={size} />,
    Settings: <Settings size={size} />,
    Users: <Users size={size} />,
    ShieldAlert: <ShieldAlert size={size} />,
    Wallet: <Wallet size={size} />,
    ShoppingBag: <ShoppingBag size={size} />
  };
  return iconMap[iconName] || null;
};

function Navigation({ user, currentPage, onPageChange, onLogout, isMobileMenuOpen, setMobileMenuOpen, isSidebarOpen, setIsSidebarOpen }) {
  const isFinanceAdmin = user?.role === 'admin' || user?.is_fraud_admin;

  const financePages = [
      // Admin: hide these items from the "Main" navigation only
    ...(isFinanceAdmin ? [] : [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { id: 'chatbot-analytics', label: 'AI Assistant', icon: 'Brain', image: aiImage },
      { id: 'deposit', label: 'Deposit Funds', icon: 'Wallet', image: purseImage },
      { id: 'virtual-cards', label: 'Virtual Card', icon: 'CreditCard', image: creditCardImage },
      { id: 'store-simulation', label: 'Simulation Store', icon: 'ShoppingBag', image: storeImage },
      { id: 'transactions', label: 'Transactions', icon: 'CreditCard', image: transactionImage },
      // New user-facing Local Jobs page
      { id: 'jobs', label: 'Local Jobs', icon: 'Target' },
      // Remaining pages can follow
      { id: 'analytics', label: 'Analytics', icon: 'TrendingUp', image: analysisImage },
      { id: 'budget', label: 'Budget', icon: 'DollarSign', image: savingsImage },
      { id: 'transfer', label: 'Transfer Money', icon: 'Send' },
      { id: 'notifications', label: 'Notifications', icon: 'Bell' },
      { id: 'profile', label: 'My Profile', icon: 'User' }
    ])
  ];


  const fraudPages = isFinanceAdmin ? [
    { id: 'admin-user-transactions', label: 'Transactions Monitor', icon: 'CreditCard' },
    { id: 'admin-account', label: 'Account Overview', icon: 'Users' },
    { id: 'fraud-live', label: 'Live Dashboard', icon: 'Activity' },


    { id: 'fraud-transactions', label: 'Flagged Transactions', icon: 'AlertTriangle' },
    { id: 'fraud-analytics', label: 'Analytics', icon: 'TrendingUp' },
    { id: 'rule-engine', label: 'Rule Engine', icon: 'Settings' },
    { id: 'alert-rules', label: 'Alert Rules', icon: 'Bell' },
    { id: 'admin-store', label: 'Manage Store', icon: 'ShoppingBag' },
    { id: 'admin-jobs', label: 'Local Jobs (Admin)', icon: 'Target' }
  ] : [];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`sidebar no-print ${isSidebarOpen ? '' : 'is-collapsed'}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logoImage} alt="FinVision Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            <strong style={{ fontSize: '1.2rem', color: 'var(--sidebar-accent)', letterSpacing: '0.02em' }}>FinanceApp</strong>
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

        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--sidebar-muted)', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.05em' }}>Main</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
          {financePages.map(page => (
            <button
              key={page.id}
              onClick={() => onPageChange(page.id)}
              className={`nav-item ${currentPage === page.id ? 'active' : ''}`}
              style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent', color: 'inherit', display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <IconComponent iconName={page.icon} size={28} image={page.image} />
              <span>{page.label}</span>
            </button>
          ))}
        </div>

        {isFinanceAdmin && (
          <>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--sidebar-muted)', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.05em' }}>SENTINEL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
              {fraudPages.map(page => (
                <button
                  key={page.id}
                  onClick={() => onPageChange(page.id)}
                  className={`nav-item ${currentPage === page.id ? 'active' : ''}`}
                  style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent', color: 'inherit', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <IconComponent iconName={page.icon} size={28} />
                  <span>{page.label}</span>
                </button>
              ))}
              <a href="/Fraud.html" target="_blank" className="nav-item" style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldAlert size={28} />
                SENTINEL Console
              </a>
            </div>
          </>
        )}

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--sidebar-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={onLogout} className="nav-item" style={{ justifyContent: 'flex-start', border: 'none' }}>
            <LogOut size={28} />
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
          <Sparkle size={24} style={{ color: 'var(--sidebar-accent)' }} />
          <strong style={{ fontSize: '1.1rem', color: '#fff', letterSpacing: '0.02em' }}>FinanceApp</strong>
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
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--sidebar-muted)', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.05em' }}>Main</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
          {financePages.map(page => (
            <button
              key={page.id}
              onClick={() => { onPageChange(page.id); setMobileMenuOpen(false); }}
              className={`nav-item ${currentPage === page.id ? 'active' : ''}`}
              style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent', color: 'inherit', display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <IconComponent iconName={page.icon} size={28} image={page.image} />
              <span>{page.label}</span>
            </button>
          ))}
        </div>

        {isFinanceAdmin && (
          <>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--sidebar-muted)', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.05em' }}>SENTINEL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
              {fraudPages.map(page => (
                <button
                  key={page.id}
                  onClick={() => { onPageChange(page.id); setMobileMenuOpen(false); }}
                  className={`nav-item ${currentPage === page.id ? 'active' : ''}`}
                  style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent', color: 'inherit', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <IconComponent iconName={page.icon} size={28} />
                  <span>{page.label}</span>
                </button>
              ))}
              <a href="/Fraud.html" target="_blank" className="nav-item" style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => setMobileMenuOpen(false)}>
                <ShieldAlert size={28} />
                SENTINEL Console
              </a>
            </div>
          </>
        )}

        <div style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="nav-item" style={{ justifyContent: 'flex-start', border: 'none', color: 'var(--color-danger)' }}>
            <LogOut size={28} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}


function ProtectedRoute({ children, token, user }) {
  if (!token || !user) {
    return <Navigate to="/login" />;
  }
  return children;
}

  // Clean up expired or corrupted tokens before mounting the React app
  (function checkInitialAuth() {
    const token = localStorage.getItem('token');
    if (token) {
      // Only attempt JWT decoding if token appears to be a JWT (contains two dots)
      if (token.split('.').length === 3) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            window.atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const { exp } = JSON.parse(jsonPayload);
          // if (exp && Date.now() >= exp * 1000) {
          //   localStorage.removeItem('token');
          //   localStorage.removeItem('user');
          // }
        } catch (error) {
          // If decoding fails, keep the token (it may be a fallback placeholder)
        }
      }
    }
  })();

function MainApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [authView, setAuthView] = useState('landing'); // 'landing', 'login', 'register'

  const token = localStorage.getItem('token');
  console.log('DEBUG: token from localStorage', token);
  const userStr = localStorage.getItem('user');
  console.log('DEBUG: userStr from localStorage', userStr);
  const user = userStr ? JSON.parse(userStr) : null;
  console.log('DEBUG: parsed user object', user);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!token || !user) {
    if (authView === 'login') {
      return <Login initialIsLogin={true} onBackToLanding={() => setAuthView('landing')} />;
    }
    if (authView === 'register') {
      return <Login initialIsLogin={false} onBackToLanding={() => setAuthView('landing')} />;
    }
    return <LandingPage onNavigateLogin={() => setAuthView('login')} onNavigateRegister={() => setAuthView('register')} />;
  }

  // Render pages based on currentPage
  const renderPage = () => {
    switch (currentPage) {
      // Finance Pages
      case 'dashboard':
        return <FinanceDashboard user={user} token={token} />;
      case 'transactions':
        return <Transactions token={token} />;
      case 'accounts':
        return <Accounts token={token} />;
      case 'analytics':
        return <Analytics token={token} />;
      case 'budget':
        return <Budget token={token} />;

      case 'transfer':
        return <TransferMoney token={token} />;
      case 'chatbot-analytics':
        return <ChatbotAnalytics user={user} token={token} />;
      case 'notifications':
        return <Notifications user={user} token={token} />;
      case 'virtual-cards':
        return <VirtualCards user={user} token={token} />;
      case 'store-simulation':
        return <StoreSimulation token={token} user={user} />;
      case 'deposit':
        return <Deposit user={user} token={token} />;
      case 'profile':
        return <MyProfile user={user} onLogout={handleLogout} />;
      case 'jobs':
        return <LocalJobs token={token} />;
      case 'admin-jobs':
        return <AdminLocalJobs token={token} />;


      // Fraud Detection Pages
      case 'fraud-live':
        return <FraudLiveDashboard />;
      case 'fraud-transactions':
        return <FraudTransactions />;
      case 'fraud-analytics':
        return <FraudAnalytics />;
      case 'rule-engine':
        return <RuleEngine />;
      case 'alert-rules':
        return <AlertRules />;

      case 'admin-store':
        return <AdminStoreSimulation token={token} />;
      case 'admin-account':
        return <AdminDashboard token={token} onLogout={handleLogout} />;
      case 'admin-user-transactions':
        return <AdminUserTransactions token={token} />;


      default:
        return <FinanceDashboard user={user} token={token} />;
    }
  };

  return (
    <>
      <Navigation
        user={user}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <main className={`main-content ${isSidebarOpen ? '' : 'is-collapsed'}`}>
        {renderPage()}
      </main>
    </>
  );
}


function App() {
  return <MainApp />;
}

export default App;
