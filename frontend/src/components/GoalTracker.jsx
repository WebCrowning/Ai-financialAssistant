import React, { useState } from 'react';
import { Target, Plus, Send, RefreshCw, Calendar, CheckCircle2 } from 'lucide-react';

export default function GoalTracker({ goals, token, onRefresh }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  // Transfer state
  const [fromGoalId, setFromGoalId] = useState('');
  const [toGoalId, setToGoalId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          target_amount: parseFloat(targetAmount),
          current_amount: parseFloat(currentAmount) || 0,
          deadline: deadline || null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create goal');
      }

      setSuccess(`Goal "${name}" created successfully!`);
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setDeadline('');
      setShowAddForm(false);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (fromGoalId === toGoalId) {
      setError('Cannot transfer money to the same goal.');
      return;
    }

    try {
      const response = await fetch('/api/goals/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fromGoalId: parseInt(fromGoalId),
          toGoalId: parseInt(toGoalId),
          amount: parseFloat(transferAmount)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to transfer funds');
      }

      setSuccess(data.message || 'Funds moved successfully!');
      setTransferAmount('');
      onRefresh();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {error && <div className="alert-banner" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>{error}</div>}
      {success && <div className="alert-banner" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Goals List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Target style={{ color: 'var(--primary)' }} />
              <h2 style={{ margin: 0 }}>Saving Milestones</h2>
            </div>
            <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
              <Plus size={16} /> New Goal
            </button>
          </div>

          {showAddForm && (
            <div style={{
              padding: '20px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              marginBottom: '10px'
            }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Define New Financial Milestone</h3>
              <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Goal Name (e.g. Laptop)</label>
                    <input type="text" className="form-input" placeholder="MacBook Pro" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Cost ($)</label>
                    <input type="number" className="form-input" placeholder="1200.00" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Initial Savings ($)</label>
                    <input type="number" className="form-input" placeholder="0.00" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Date / Deadline</label>
                    <input type="date" className="form-input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                    {loading ? 'Creating...' : 'Establish Goal'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {goals.map(goal => {
              const current = parseFloat(goal.current_amount || 0);
              const target = parseFloat(goal.target_amount);
              const percentage = Math.min((current / target) * 100, 100);
              const isCompleted = current >= target;

              return (
                <div key={goal.id} style={{
                  padding: '16px 20px',
                  background: isCompleted ? 'rgba(16, 185, 129, 0.03)' : 'rgba(255,255,255,0.01)',
                  border: isCompleted ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid var(--border-glass)',
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                        {goal.name} {isCompleted && <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />}
                      </h3>
                      {goal.deadline && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Calendar size={12} /> Target: {goal.deadline}
                        </span>
                      )}
                    </div>
                    <span style={{ color: isCompleted ? 'var(--success)' : 'var(--primary)', fontWeight: '700' }}>
                      ${current.toFixed(2)} / ${target.toFixed(2)} ({percentage.toFixed(0)}%)
                    </span>
                  </div>

                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${percentage}%`,
                        background: isCompleted 
                          ? 'linear-gradient(90deg, var(--success), #34d399)' 
                          : 'linear-gradient(90deg, var(--primary), var(--secondary))'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No goals defined. Set some milestones to begin saving!</p>
            )}
          </div>
        </div>

        {/* Transfer Funds panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Send style={{ color: 'var(--secondary)' }} />
            <h2 style={{ margin: 0 }}>Inter-Goal transfers</h2>
          </div>
          <p style={{ fontSize: '0.9rem' }}>Shift savings directly between goals. Keeps records in sync without logging extra deposits.</p>

          <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Source Goal</label>
              <select className="form-input" value={fromGoalId} onChange={(e) => setFromGoalId(e.target.value)} required>
                <option value="">-- Choose Source Goal --</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id} style={{ background: '#0f172a' }}>{g.name} (${parseFloat(g.current_amount).toFixed(2)})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Destination Goal</label>
              <select className="form-input" value={toGoalId} onChange={(e) => setToGoalId(e.target.value)} required>
                <option value="">-- Choose Destination Goal --</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id} style={{ background: '#0f172a' }}>{g.name} (${parseFloat(g.current_amount).toFixed(2)})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Transfer Amount ($)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="0.00" 
                value={transferAmount} 
                onChange={(e) => setTransferAmount(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={goals.length < 2}>
              <RefreshCw size={16} /> Execute Transfer
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
