import React, { useState, useEffect } from 'react';
import { Wallet, TrendingDown, CreditCard, RefreshCw, ArrowRight, Clock, Building2, Smartphone, Wifi } from 'lucide-react';

const ACCOUNT_ICONS = {
  'Main Bank Account': Building2,
  'MTN MoMo': Smartphone,
  'Orange Money': Wifi,
  'Virtual Card': CreditCard
};

const ACCOUNT_COLORS = {
  'Main Bank Account': { primary: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
  'MTN MoMo': { primary: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', gradient: 'linear-gradient(135deg, #fbbf24, #d97706)' },
  'Orange Money': { primary: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)', gradient: 'linear-gradient(135deg, #fb923c, #ea580c)' },
  'Virtual Card': { primary: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', gradient: 'linear-gradient(135deg, #34d399, #059669)' }
};

export default function Accounts({ token }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [allExpenses, setAllExpenses] = useState([]);

  useEffect(() => {
    fetchAccounts();
  }, [token]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const [accountsRes, expRes] = await Promise.all([
        fetch('/api/accounts', { headers }),
        fetch('/api/expenses', { headers })
      ]);
      const accountsData = await accountsRes.json();
      const expData = await expRes.json();
      if (accountsRes.ok) setAccounts(accountsData);
      if (expRes.ok) setAllExpenses(expData);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalSpent = accounts.reduce((sum, a) => sum + (a.totalSpent || 0), 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading account data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wallet size={28} style={{ color: 'var(--primary)' }} /> Accounts Overview
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage all your linked financial accounts and track balances
          </p>
        </div>
        <button onClick={fetchAccounts} style={{
          padding: '10px 20px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer',
          fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Portfolio Summary */}
      <div style={{
        padding: '28px', borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
        border: '1px solid rgba(99,102,241,0.25)'
      }}>
        <p style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Portfolio Balance</p>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '3rem', fontWeight: '900', color: 'white', letterSpacing: '-0.02em' }}>
          CFA {Math.round(totalBalance).toLocaleString()}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          <div>
            <p style={{ margin: '0 0 4px 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>Accounts Linked</p>
            <p style={{ margin: 0, fontWeight: '700', color: 'white', fontSize: '1.2rem' }}>{accounts.length}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>Total Outflows</p>
            <p style={{ margin: 0, fontWeight: '700', color: '#f87171', fontSize: '1.2rem' }}>CFA {Math.round(totalSpent).toLocaleString()}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>Total Transactions</p>
            <p style={{ margin: 0, fontWeight: '700', color: 'white', fontSize: '1.2rem' }}>{allExpenses.length}</p>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
        {accounts.map(account => {
          const cfg = ACCOUNT_COLORS[account.name] || ACCOUNT_COLORS['Main Bank Account'];
          const Icon = ACCOUNT_ICONS[account.name] || Wallet;
          const usagePct = account.baseBalance > 0 ? Math.min((account.totalSpent / account.baseBalance) * 100, 100) : 0;
          const isSelected = selectedAccount?.name === account.name;

          return (
            <div
              key={account.name}
              onClick={() => setSelectedAccount(isSelected ? null : account)}
              style={{
                padding: '22px', borderRadius: '16px', cursor: 'pointer',
                background: isSelected ? cfg.bg : 'rgba(255,255,255,0.03)',
                border: `2px solid ${isSelected ? cfg.primary : 'rgba(255,255,255,0.08)'}`,
                transition: 'all 0.25s', userSelect: 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={22} style={{ color: 'white' }} />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px 0', fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{account.name}</p>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' }}>{account.transactionCount} transactions</p>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.75rem', padding: '4px 10px', borderRadius: '8px', fontWeight: '600',
                  background: account.balance >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)',
                  color: account.balance >= 0 ? '#34d399' : '#f87171'
                }}>
                  {account.balance >= 0 ? 'Active' : 'Overdrawn'}
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>Current Balance</p>
                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: account.balance >= 0 ? cfg.primary : '#f87171' }}>
                  CFA {Math.round(account.balance).toLocaleString()}
                </p>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Spent: CFA {Math.round(account.totalSpent).toLocaleString()}</span>
                  <span style={{ color: cfg.primary, fontWeight: '600' }}>{Math.round(usagePct)}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '4px',
                    background: usagePct > 80 ? '#f87171' : cfg.primary,
                    width: `${usagePct}%`, transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Base: CFA {Math.round(account.baseBalance).toLocaleString()}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: cfg.primary }}>
                  View Details <ArrowRight size={12} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Detail Panel */}
      {selectedAccount && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedAccount.name} — Recent Transactions</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedAccount.recentTransactions?.length || 0} shown</span>
          </div>

          {selectedAccount.recentTransactions?.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Date', 'Description', 'Category', 'Amount'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedAccount.recentTransactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(tx.date).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {tx.description}
                        {tx.is_subscription ? <span style={{ marginLeft: '6px', fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(99,102,241,0.2)', color: '#a78bfa', borderRadius: '4px' }}>Sub</span> : null}
                        {tx.is_unusual ? <span style={{ marginLeft: '4px', fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(239,68,68,0.2)', color: '#f87171', borderRadius: '4px' }}>⚠️</span> : null}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {tx.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#f87171', textAlign: 'right' }}>
                        -CFA {parseFloat(tx.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No recent transactions for this account.
            </div>
          )}
        </div>
      )}

      {/* Spending by Account Chart */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingDown size={18} style={{ color: '#f87171' }} /> Spending Distribution by Account
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {accounts.map(account => {
            const cfg = ACCOUNT_COLORS[account.name] || ACCOUNT_COLORS['Main Bank Account'];
            const pct = totalSpent > 0 ? Math.round((account.totalSpent / totalSpent) * 100) : 0;
            return (
              <div key={account.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{account.name}</span>
                  <span style={{ color: cfg.primary, fontWeight: '700' }}>
                    CFA {Math.round(account.totalSpent).toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '6px', background: cfg.gradient,
                    width: `${pct}%`, transition: 'width 0.6s ease'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
