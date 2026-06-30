import React, { useState } from 'react';
import { DollarSign, Wallet, ShieldAlert, Sliders, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function SpendingOverview({ expenses, budgets, token, onRefresh, monthlyIncome }) {
  const [category, setCategory] = useState('Food');
  const [limitAmount, setLimitAmount] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Calculations
  const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  // Group expenses by category
  const categoryTotals = expenses.reduce((acc, exp) => {
    const amt = parseFloat(exp.amount);
    acc[exp.category] = (acc[exp.category] || 0) + amt;
    return acc;
  }, {});

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const userId = JSON.parse(localStorage.getItem('user') || 'null')?.id;
      if (!userId) throw new Error('User not authenticated');
      if (!supabase) throw new Error('Supabase client not initialized');

      // Check if a budget limit already exists for this category and user
      const { data: existing, error: findErr } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', userId)
        .eq('category', category)
        .maybeSingle();

      if (findErr) throw findErr;

      let resultError = null;
      if (existing) {
        const { error } = await supabase
          .from('budgets')
          .update({ limit_amount: parseFloat(limitAmount) })
          .eq('id', existing.id);
        resultError = error;
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert({
            user_id: userId,
            category,
            limit_amount: parseFloat(limitAmount)
          });
        resultError = error;
      }

      if (resultError) {
        throw resultError;
      }

      setSuccess(`Updated budget limit for ${category}`);
      setLimitAmount('');
      onRefresh();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
      
      {/* Top Total Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
        
        {/* Total Spent Card */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
            <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Wallet size={32} />
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Total Spent (This Month)</span>
              <h2 style={{ fontSize: 'var(--font-size-2xl)', margin: 'var(--spacing-sm) 0 0 0', color: 'var(--color-text-primary)' }}>CFA {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            </div>
          </div>
        </div>

        {/* Monthly Income Card */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
            <div style={{ padding: '12px', borderRadius: 'var(--radius-lg)', background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
              <DollarSign size={32} />
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Defined Monthly Income</span>
              <h2 style={{ fontSize: 'var(--font-size-2xl)', margin: 'var(--spacing-sm) 0 0 0', color: 'var(--color-success)' }}>CFA {parseFloat(monthlyIncome || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            </div>
          </div>
        </div>

      </div>

      {/* Income alert if overspent */}
      {totalSpent > parseFloat(monthlyIncome || 0) && (
        <div className="alert alert-danger">
          <ShieldAlert size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>Expected Income Exceeded!</strong>
            Your total spending (CFA {totalSpent.toFixed(2)}) is higher than your expected income (CFA {parseFloat(monthlyIncome || 0).toFixed(2)}). Consider curtailing variable category costs.
          </div>
        </div>
      )}

      {/* Analytics SVG Bar Chart */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>Visual Outflow Distribution</h2>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', minHeight: '240px', gap: 'var(--spacing-xl)', padding: 'var(--spacing-lg) var(--spacing-2xl)', borderBottom: '1px solid var(--color-border)' }}>
          {['Food', 'Rent', 'Bills', 'Sub', 'Other'].map((cat, idx) => {
            const amount = categoryTotals[cat] || 0;
            const maxVal = Math.max(...Object.values(categoryTotals).concat([100]));
            const normalizedHeight = maxVal > 0 ? (amount / maxVal) * 160 : 0;
            
            // Design system colors for different categories
            const colorMap = {
              'Food': '#8b5cf6',      // Purple
              'Rent': '#ec4899',      // Pink
              'Bills': '#f59e0b',     // Amber
              'Sub': '#3b82f6',       // Blue
              'Other': '#10b981'      // Green
            };

            return (
              <div key={cat} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 'var(--spacing-md)', position: 'relative', minWidth: '60px' }}>
                {/* Floating Tooltip */}
                {amount > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: `-${normalizedHeight + 40}px`,
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    padding: 'var(--spacing-sm)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.3s ease'
                  }}>
                    CFA {amount.toLocaleString()}
                  </div>
                )}

                {/* SVG Bar */}
                <svg width="100%" height="160" style={{ overflow: 'visible', minWidth: '40px' }}>
                  {/* Bar background */}
                  <rect 
                    x="0" 
                    y="0" 
                    width="100%" 
                    height="160" 
                    fill="var(--color-border)" 
                    rx="4"
                    opacity="0.2"
                  />

                  {/* Bar fill */}
                  <rect 
                    x="0" 
                    y={160 - normalizedHeight} 
                    width="100%" 
                    height={normalizedHeight} 
                    fill={colorMap[cat] || 'var(--color-primary)'} 
                    rx="4"
                    style={{ transition: 'all 0.3s ease', opacity: 0.85 }}
                  />
                </svg>

                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}>{cat}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
        
        {/* Budget categories listing */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div style={{ padding: '8px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-lg)', color: 'var(--color-primary)' }}>
                <Sliders size={20} />
              </div>
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Category Budget Limits & Usage</h2>
            </div>
          </div>
          
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {budgets.map(bud => {
              const spent = categoryTotals[bud.category] || 0;
              const limit = parseFloat(bud.limit_amount);
              const percentage = Math.min((spent / limit) * 100, 100);
              const isOver = spent > limit;
              const progressColor = isOver ? 'var(--color-danger)' : percentage > 80 ? 'var(--color-warning)' : 'var(--color-success)';

              return (
                <div key={bud.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>{bud.category}</span>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: isOver ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                      <strong>CFA {spent.toLocaleString()}</strong> / CFA {limit.toLocaleString()} ({Math.round((spent/limit)*100)}%)
                    </span>
                  </div>
                  
                  <div style={{ width: '100%', height: '8px', background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%',
                        width: `${percentage}%`,
                        background: progressColor,
                        borderRadius: 'var(--radius-full)',
                        transition: 'all 0.3s ease'
                      }} 
                    />
                  </div>

                  {isOver && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}>
                      <AlertTriangle size={14} /> Exceeded limit by CFA {(spent - limit).toLocaleString()}!
                    </div>
                  )}
                </div>
              );
            })}
            {budgets.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>No budgets set yet. Set your category limits using the form on the right.</p>
            )}
          </div>
        </div>

        {/* Set Budget Form */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Configure Limit</h2>
          </div>
          
          <div className="card-body">
            {error && <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>{error}</p>}
            {success && <p style={{ color: 'var(--color-success)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>{success}</p>}

            <form onSubmit={handleUpdateBudget} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}>Budget Category</label>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Food">Food</option>
                  <option value="Rent">Rent</option>
                  <option value="Bills">Bills & Light</option>
                  <option value="Sub">Subscriptions</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)' }}>Maximum Monthly Limit (CFA)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 50000"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Apply Budget Limit
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
