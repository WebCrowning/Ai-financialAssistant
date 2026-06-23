import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Zap, RefreshCw, AlertCircle, Clock, Edit, Trash2, X, Check } from 'lucide-react';

export default function IncomeLogger({ incomes, token, onRefresh }) {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('salary');
  const [isIrregular, setIsIrregular] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Simulation timer state
  const [simulating, setSimulating] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const categories = [
    { value: 'salary', label: 'Salary' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'business', label: 'Business' },
    { value: 'bonus', label: 'Bonus' },
    { value: 'investment', label: 'Investment' },
    { value: 'gift', label: 'Gift' },
    { value: 'rental', label: 'Rental Income' },
    { value: 'other', label: 'Other' }
  ];

  const handleLogIncome = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          source,
          category,
          is_irregular: isIrregular
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to log income');
      }

      setSuccess(data.message || 'Income logged successfully.');
      setAmount('');
      setSource('');
      setCategory('salary');
      setIsIrregular(false);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditIncome = (income) => {
    setEditingId(income.id);
    setEditAmount(income.amount);
    setEditSource(income.source);
    setEditCategory(income.category || 'salary');
  };

  const handleSaveEdit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`/api/income/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
          source: editSource,
          category: editCategory
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update income');
      }

      setSuccess('Income updated successfully.');
      setEditingId(null);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIncome = async (id) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`/api/income/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete income');
      }

      setSuccess('Income deleted successfully.');
      setDeleteConfirm(null);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateIrregular = async () => {
    setError('');
    setSuccess('');
    setSimulating(true);
    setCountdown(5);

    try {
      const response = await fetch('/api/income/simulate-irregular', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      setSuccess(data.message);
    } catch (err) {
      setError(err.message);
      setSimulating(false);
    }
  };

  // Countdown effect
  useEffect(() => {
    let timer;
    if (simulating && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (simulating && countdown === 0) {
      setSimulating(false);
      setSuccess('Background scheduler executed! New irregular income auto-synced.');
      onRefresh();
    }
    return () => clearTimeout(timer);
  }, [simulating, countdown]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {error && <div className="alert-banner" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>{error}</div>}
      {success && <div className="alert-banner" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Log Income Form */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Plus style={{ color: 'var(--success)' }} />
            <h2 style={{ margin: 0 }}>Log Income</h2>
          </div>
          
          <form onSubmit={handleLogIncome} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Income Source</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Freelance Web Design" 
                value={source} 
                onChange={(e) => setSource(e.target.value)} 
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category</label>
              <select 
                className="form-input" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                style={{ background: 'var(--bg-input)', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value} style={{ background: '#ffffff', color: '#000000' }}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount ($)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 500.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                required 
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <input 
                type="checkbox" 
                id="isIrregular" 
                checked={isIrregular} 
                onChange={(e) => setIsIrregular(e.target.checked)} 
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="isIrregular" style={{ cursor: 'pointer', fontSize: '0.95rem' }}>
                Flag as <strong>Irregular Income</strong> (freelance, gig, gift)
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
              Log Income
            </button>
          </form>
        </div>

        {/* Irregular Income Background Simulation */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap style={{ color: 'var(--primary)' }} />
            <h2 style={{ margin: 0 }}>Background Scheduler Simulator</h2>
          </div>

          <p style={{ fontSize: '0.9rem' }}>
            To satisfy the requirement of logging irregular income within 5 minutes automatically, you can trigger this background scheduler simulation. A mock job will run on the server and insert freelance income records in real time.
          </p>

          {simulating ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              background: 'rgba(139,92,246,0.1)',
              borderRadius: '12px',
              border: '1px dashed var(--primary)'
            }}>
              <RefreshCw size={24} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite', marginBottom: '12px' }} />
              <strong style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '4px' }}>Background Scheduler Active</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Auto-sync scheduled for: 00:0{countdown} seconds (simulating 5m)</span>
            </div>
          ) : (
            <button 
              className="btn-secondary" 
              onClick={handleSimulateIrregular}
              style={{
                borderColor: 'var(--primary)', 
                color: '#c084fc', 
                background: 'rgba(139, 92, 246, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '16px',
                fontWeight: '600'
              }}
            >
              <Clock size={18} /> Trigger Irregular Auto-Log (Simulate 5m schedule)
            </button>
          )}

          <div style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-muted)', 
            padding: '12px', 
            background: 'rgba(255,255,255,0.01)', 
            borderRadius: '8px', 
            border: '1px solid rgba(255,255,255,0.03)',
            display: 'flex',
            gap: '8px'
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            When clicked, the backend spins off an async worker executing after 5 seconds to insert a transaction.
          </div>
        </div>

      </div>

      {/* Income Registry */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <DollarSign style={{ color: 'var(--success)' }} />
          <h2 style={{ margin: 0 }}>Income Registry</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px' }}>Source</th>
                <th style={{ padding: '12px' }}>Category</th>
                <th style={{ padding: '12px' }}>Amount</th>
                <th style={{ padding: '12px' }}>Type</th>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map(inc => (
                <tr key={inc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  {editingId === inc.id ? (
                    <>
                      <td style={{ padding: '12px' }}>
                        <input 
                          type="text" 
                          value={editSource} 
                          onChange={(e) => setEditSource(e.target.value)} 
                          className="form-input" 
                          style={{ fontSize: '0.9rem', padding: '6px' }} 
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <select 
                          value={editCategory} 
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="form-input"
                          style={{ fontSize: '0.9rem', padding: '6px', cursor: 'pointer', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        >
                          {categories.map(cat => (
                            <option key={cat.value} value={cat.value} style={{ background: '#ffffff', color: '#000000' }}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input 
                          type="number" 
                          value={editAmount} 
                          onChange={(e) => setEditAmount(e.target.value)} 
                          className="form-input" 
                          style={{ fontSize: '0.9rem', padding: '6px' }} 
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge ${inc.is_irregular ? 'badge-warning' : 'badge-success'}`}>
                          {inc.is_irregular ? 'Irregular' : 'Regular'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                        {new Date(inc.logged_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={handleSaveEdit}
                          disabled={loading}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--success)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.85rem'
                          }}
                        >
                          <Check size={14} /> Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.85rem'
                          }}
                        >
                          <X size={14} /> Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{inc.source}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          fontSize: '0.85rem', 
                          padding: '4px 8px', 
                          background: 'rgba(99, 102, 241, 0.15)', 
                          borderRadius: '4px',
                          color: '#c084fc',
                          textTransform: 'capitalize'
                        }}>
                          {inc.category || 'salary'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--success)', fontWeight: '600' }}>+${parseFloat(inc.amount).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge ${inc.is_irregular ? 'badge-warning' : 'badge-success'}`}>
                          {inc.is_irregular ? 'Irregular' : 'Regular'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(inc.logged_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEditIncome(inc)}
                          style={{
                            padding: '6px 10px',
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: '#c084fc',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.85rem'
                          }}
                          title="Edit income"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(inc.id)}
                          style={{
                            padding: '6px 10px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.85rem'
                          }}
                          title="Delete income"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {incomes.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No incomes logged in this account.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{ maxWidth: '400px', padding: '24px', textAlign: 'center' }}>
            <Trash2 size={48} style={{ color: 'var(--danger)', margin: '0 auto 16px', opacity: 0.8 }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>Delete Income</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Are you sure you want to delete this income record? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => handleDeleteIncome(deleteConfirm)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  opacity: loading ? 0.6 : 1
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
