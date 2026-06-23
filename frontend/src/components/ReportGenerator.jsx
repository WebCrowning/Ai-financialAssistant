import React from 'react';
import { Printer, Download, Receipt, Sparkles, TrendingUp } from 'lucide-react';

export default function ReportGenerator({ expenses, budgets, incomes, monthlyIncome }) {
  const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const totalIncome = incomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0);

  const categoryTotals = expenses.reduce((acc, exp) => {
    const amt = parseFloat(exp.amount);
    acc[exp.category] = (acc[exp.category] || 0) + amt;
    return acc;
  }, {});

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Action Buttons (Hidden when printing via index.css no-print) */}
      <div className="glass-card no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Export Account Summary Sheet</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>Generate a print-ready 1-page report containing recent budgets & ledger balances.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="glass-card print-container" style={{
        background: 'rgba(30, 41, 59, 0.25)',
        border: '1px solid var(--border-glass)',
        borderRadius: '16px',
        padding: '30px'
      }}>

        {/* Report Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', webkitTextFillColor: 'initial', color: '#fff', margin: 0 }}>FinVision Financial Ledger</h1>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)' }}>Automated Personal Statement & Expense Audit</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Statement Generated</span>
            <strong style={{ fontSize: '0.95rem' }}>{new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</strong>
          </div>
        </div>

        {/* Ledger Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Total Outflows (Spent)</span>
            <strong style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>${totalSpent.toFixed(2)}</strong>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Expected Monthly Income</span>
            <strong style={{ fontSize: '1.4rem', color: 'var(--success)' }}>${parseFloat(monthlyIncome || 0).toFixed(2)}</strong>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Total Inflow (Logged)</span>
            <strong style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>${totalIncome.toFixed(2)}</strong>
          </div>
        </div>

        {/* Grid for Budget Limits & Transactions side-by-side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginBottom: '30px' }}>

          {/* Budget Limits Summary */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>Category Budgets</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {budgets.map(bud => {
                const spent = categoryTotals[bud.category] || 0;
                const limit = parseFloat(bud.limit_amount);
                const isOver = spent > limit;
                return (
                  <div key={bud.id} style={{ fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{bud.category}</span>
                      <strong style={{ color: isOver ? 'var(--danger)' : 'var(--text-primary)' }}>
                        ${spent.toFixed(0)} / ${limit.toFixed(0)}
                      </strong>
                    </div>
                  </div>
                );
              })}
              {budgets.length === 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No category budget limits set.</span>
              )}
            </div>
          </div>

          {/* Transaction List */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>Recent Ledger Debits</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 0' }}>Description</th>
                  <th style={{ padding: '8px 0' }}>Category</th>
                  <th style={{ padding: '8px 0' }}>Date</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 10).map(exp => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '8px 0', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {exp.description || 'Cash Expense'}
                      {exp.is_subscription === 1 && <span className="badge badge-primary" style={{ fontSize: '0.55rem', padding: '1px 4px', marginLeft: '6px' }}>Sub</span>}
                    </td>
                    <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>{exp.category}</td>
                    <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>{exp.date}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '600', color: exp.is_unusual ? 'var(--danger)' : 'var(--text-primary)' }}>
                      ${parseFloat(exp.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No recent debits found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Footer Audit Declaration */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>System Verified by FinVision Guardian AI Shield</span>
          <span>End of Statement</span>
        </div>

      </div>

    </div>
  );
}
