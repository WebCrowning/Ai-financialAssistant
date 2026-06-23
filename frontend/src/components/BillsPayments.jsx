import React, { useState, useEffect } from 'react';
import { Receipt, Plus, RefreshCw, CreditCard, Repeat, Calendar, AlertTriangle, Trash2, CheckCircle, X, Filter } from 'lucide-react';

const CATEGORIES = ['Food', 'Rent', 'Bills', 'Transport', 'Education', 'Shopping', 'Entertainment', 'Healthcare', 'Other'];
const ACCOUNTS = ['Main Bank Account', 'MTN MoMo', 'Orange Money', 'Virtual Card'];

export default function BillsPayments({ token }) {
  const [bills, setBills] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('bills');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    amount: '', category: 'Bills', description: '', date: new Date().toISOString().split('T')[0],
    account: 'Main Bank Account', is_subscription: false
  });

  useEffect(() => {
    fetchBills();
  }, [token]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/expenses', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setAllExpenses(data);
        setBills(data.filter(e => ['Bills', 'Rent'].includes(e.category)));
        setSubscriptions(data.filter(e => e.is_subscription === 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          category: form.category,
          description: form.description,
          date: form.date,
          account: form.account,
          is_subscription: form.is_subscription ? 1 : 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add');
      setSuccess('Bill/payment recorded successfully!');
      setShowAddForm(false);
      setForm({ amount: '', category: 'Bills', description: '', date: new Date().toISOString().split('T')[0], account: 'Main Bank Account', is_subscription: false });
      fetchBills();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill/payment record?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { fetchBills(); setSuccess('Deleted successfully.'); setTimeout(() => setSuccess(''), 3000); }
    } catch (err) { console.error(err); }
  };

  const totalBills = bills.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totalSubs = subscriptions.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const unusualBills = bills.filter(b => b.is_unusual);

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Receipt size={28} style={{ color: 'var(--primary)' }} /> Bills & Payments
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Track recurring bills, utility payments, and subscriptions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchBills} style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={() => setShowAddForm(true)} style={{ padding: '10px 18px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Record Bill
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div style={{ padding: '12px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#f87171', display: 'flex', gap: '8px' }}><AlertTriangle size={16} />{error}</div>}
      {success && <div style={{ padding: '12px 18px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', color: '#34d399', display: 'flex', gap: '8px' }}><CheckCircle size={16} />{success}</div>}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Total Bills', value: `CFA ${Math.round(totalBills).toLocaleString()}`, color: '#6366f1', icon: Receipt },
          { label: 'Subscriptions', value: `CFA ${Math.round(totalSubs).toLocaleString()}`, color: '#f87171', icon: Repeat },
          { label: 'Bill Records', value: bills.length, color: '#34d399', icon: Calendar },
          { label: 'Active Subs', value: subscriptions.length, color: '#fbbf24', icon: CreditCard },
        ].map((s, i) => (
          <div key={i} style={{ padding: '18px', background: `${s.color}0d`, border: `1px solid ${s.color}30`, borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add Bill Modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: '100%', maxWidth: '480px', background: 'var(--color-bg-secondary, #0f172a)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>Record Bill / Payment</h3>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddBill} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Amount (CFA)</label>
                  <input type="number" className="form-input" value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))} placeholder="0" required min="0.01" step="0.01" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}>
                    {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0f172a' }}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Description</label>
                <input type="text" className="form-input" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="e.g. Electricity Bill" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Date</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Account</label>
                  <select className="form-input" value={form.account} onChange={e => setForm(p => ({...p, account: e.target.value}))}>
                    {ACCOUNTS.map(a => <option key={a} value={a} style={{ background: '#0f172a' }}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <input type="checkbox" id="isSub" checked={form.is_subscription} onChange={e => setForm(p => ({...p, is_subscription: e.target.checked}))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <label htmlFor="isSub" style={{ cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  <Repeat size={13} style={{ display: 'inline', marginRight: '5px', color: '#f87171' }} />
                  This is a recurring subscription charge
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '13px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Recording...' : 'Record Bill'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: '13px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px' }}>
        {[
          { id: 'bills', label: `Bills & Utilities (${bills.length})` },
          { id: 'subscriptions', label: `Subscriptions (${subscriptions.length})` }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: activeTab === tab.id ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
            color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
            fontWeight: activeTab === tab.id ? '700' : '500', fontSize: '0.9rem', transition: 'all 0.2s'
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Bills Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
          {unusualBills.length > 0 && activeTab === 'bills' && (
            <div style={{ padding: '12px 20px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: '8px', alignItems: 'center', color: '#f87171', fontSize: '0.88rem' }}>
              <AlertTriangle size={15} /> {unusualBills.length} bill(s) flagged as unusual by the Guardian system.
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  {['Date', 'Description', 'Category', 'Account', 'Amount', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'bills' ? bills : subscriptions).map(bill => (
                  <tr key={bill.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(bill.date).toLocaleDateString()}</td>
                    <td style={{ padding: '13px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {bill.description}
                      {bill.is_unusual ? <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#f87171' }}>⚠️</span> : null}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ padding: '3px 10px', background: 'rgba(99,102,241,0.15)', color: '#a78bfa', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>{bill.category}</span>
                    </td>
                    <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{bill.account || 'Main Bank Account'}</td>
                    <td style={{ padding: '13px 16px', fontWeight: '800', color: '#f87171', fontSize: '1rem' }}>CFA {parseFloat(bill.amount).toLocaleString()}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700',
                        background: bill.is_subscription ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
                        color: bill.is_subscription ? '#fbbf24' : '#34d399'
                      }}>
                        {bill.is_subscription ? '🔁 Recurring' : '✓ Paid'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button onClick={() => handleDelete(bill.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#f87171', padding: '6px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {(activeTab === 'bills' ? bills : subscriptions).length === 0 && (
                  <tr><td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No {activeTab === 'bills' ? 'bills' : 'subscriptions'} recorded yet. Click "Record Bill" to add one.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
