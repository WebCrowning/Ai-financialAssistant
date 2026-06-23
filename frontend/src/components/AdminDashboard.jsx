import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, UserMinus, UserPlus, LogOut, Clock, Activity, Search, Trash2, Database, TrendingUp, AlertTriangle, CreditCard } from 'lucide-react';

export default function AdminDashboard({ token, onLogout }) {
  // NOTE: This is the admin-only “Account/Users plateform” view.
  // User request: show platform user stats (count + list) rather than
  // any current logged-in user display details.
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newIncome, setNewIncome] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch users, activities, and stats
  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const [usersRes, actRes, statsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/activities', { headers }),
        fetch('/api/admin/stats', { headers })
      ]);
      
      if (usersRes.ok) setUsers(await usersRes.json());
      if (actRes.ok) setActivities(await actRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle Add User
  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole, monthlyIncome: parseFloat(newIncome) || 0 })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add user');

      setSuccess(`User ${newEmail} created successfully.`);
      setNewEmail(''); setNewPassword(''); setNewIncome('');
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) { setError(err.message); }
  };

  // Handle Remove User
  const handleRemoveUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to permanently delete user ${userEmail} and ALL their financial data?`)) return;
    setError(''); setSuccess('');
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete user');
      setSuccess(`User account and all associated data deleted.`);
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) { setError(err.message); }
  };

  const filteredActivities = activities.filter(act => 
    act.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={28} style={{ color: '#f87171' }} /> Admin Control Center
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            System-wide analytics, user management, and global audit logs
          </p>
        </div>
        <button onClick={onLogout} style={{ padding: '10px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
          <LogOut size={16} /> Sign Out Admin
        </button>
      </div>

      {error && <div style={{ padding: '12px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#f87171', display: 'flex', gap: '8px' }}><ShieldAlert size={16} /> {error}</div>}
      {success && <div style={{ padding: '12px 18px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', color: '#34d399', display: 'flex', gap: '8px' }}><ShieldAlert size={16} /> {success}</div>}

      {/* System Analytics Section */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={20} style={{ color: '#60a5fa' }} /> Global System Analytics
        </h2>
        
        {loading || !stats ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading system stats...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'rgba(96,165,250,0.08)', borderRadius: '12px', border: '1px solid rgba(96,165,250,0.2)' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Users</p>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={20} /> {stats.totalUsers}</p>
            </div>
            <div style={{ padding: '16px', background: 'rgba(16,185,129,0.08)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Global Processed Income</p>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={20} /> CFA {Math.round(stats.totalIncomeAmount).toLocaleString()}</p>
            </div>
            <div style={{ padding: '16px', background: 'rgba(239,68,68,0.08)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Global Processed Expenses</p>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={20} /> CFA {Math.round(stats.totalExpenseAmount).toLocaleString()}</p>
            </div>
            <div style={{ padding: '16px', background: 'rgba(251,191,36,0.08)', borderRadius: '12px', border: '1px solid rgba(251,191,36,0.2)' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Flagged Anomalies</p>
              <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={20} /> {stats.unusualTransactions}</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
        
        {/* Left Hand: Platform Users (Admin-only) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* User List */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} style={{ color: 'var(--primary)' }} /> Registered Users
            </h2>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Email</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Role</th>
                    <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{u.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', background: u.role === 'admin' ? 'rgba(99,102,241,0.15)' : 'rgba(52,211,153,0.15)', color: u.role === 'admin' ? '#a78bfa' : '#34d399', textTransform: 'uppercase' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => handleRemoveUser(u.id, u.email)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#f87171', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add User Form */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={20} style={{ color: '#34d399' }} /> Provision New User
            </h2>
            
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email</label>
                  <input type="email" className="form-input" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@finvision.com" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Password</label>
                  <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Role</label>
                  <select className="form-input" value={newRole} onChange={e => setNewRole(e.target.value)}>
                    <option value="user" style={{ background: '#0f172a' }}>Standard User</option>
                    <option value="admin" style={{ background: '#0f172a' }}>System Administrator</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Initial Monthly Income (CFA)</label>
                  <input type="number" className="form-input" value={newIncome} onChange={e => setNewIncome(e.target.value)} placeholder="0" />
                </div>
              </div>

              <button type="submit" style={{ padding: '14px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                <UserPlus size={18} /> Create Account
              </button>
            </form>
          </div>

        </div>

        {/* Right Hand: Activity Logs */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} style={{ color: 'var(--secondary)' }} /> Global Audit Trail
            </h2>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-input" placeholder="Search logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: '34px', fontSize: '0.85rem', padding: '8px 12px 8px 34px' }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '700px', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
            {filteredActivities.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No audit activities found.</p>
            ) : (
              filteredActivities.map(act => (
                <div key={act.id} style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.85rem' }}>{act.user_email}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.15)', color: '#a78bfa', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', marginRight: '8px' }}>{act.action}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{act.details}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
