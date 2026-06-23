import React, { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Clock, AlertTriangle, CheckCircle, Phone, DollarSign, Filter } from 'lucide-react';

const COLORS = {
  bg: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.06)',
  muted: 'var(--text-muted)',
  primary: '#60a5fa',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
};

function formatDateTime(ts) {
  if (!ts) return '-';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function formatCfa(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return String(v ?? '-');
  return `CFA ${n.toLocaleString()}`;
}

export default function AdminUserTransactions({ token }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deposits, setDeposits] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all|pending|completed

  const fetchDeposits = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/deposits', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
      if (!res.ok) throw new Error(data?.message || 'Failed to load deposits');
      setDeposits(Array.isArray(data) ? data : []);

    } catch (e) {
      setError(e.message || 'Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDeposits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return deposits
      .filter((d) => {
        const matchesStatus = statusFilter === 'all' ? true : String(d.status) === statusFilter;
        if (!matchesStatus) return false;
        if (!term) return true;
        const haystack = [
          d.depositor_email,
          d.phone,
          d.provider,
          d.reference,
          d.operator,
          d.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [deposits, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const pending = deposits.filter((d) => String(d.status) === 'pending');
    const completed = deposits.filter((d) => String(d.status) === 'completed');
    const sum = (arr) => arr.reduce((s, d) => s + Number(d.amount || 0), 0);
    return {
      pendingCount: pending.length,
      completedCount: completed.length,
      pendingAmount: sum(pending),
      completedAmount: sum(completed),
      totalCount: deposits.length,
      totalAmount: sum(deposits),
    };
  }, [deposits]);

  return (
    <div style={{ padding: 28, maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: 'var(--text-primary)' }}>
            Transaction Monitor (Deposits)
          </h1>
          <p style={{ margin: '6px 0 0 0', color: COLORS.muted, fontSize: 13 }}>
            Tracks user deposit transactions (pending & completed) from the user deposit funds.
          </p>
        </div>

        <button
          onClick={fetchDeposits}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: 'rgba(255,255,255,0.02)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 700,
          }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, border: `1px solid rgba(248,113,113,0.35)`, background: 'rgba(248,113,113,0.12)', color: COLORS.danger, display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: COLORS.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: 12 }}>Pending</span>
            <AlertTriangle size={18} style={{ color: COLORS.warning }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 22, fontWeight: 900 }}>{stats.pendingCount}</div>
          <div style={{ color: COLORS.muted, marginTop: 4, fontSize: 13 }}>{formatCfa(stats.pendingAmount)}</div>
        </div>

        <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: COLORS.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: 12 }}>Completed</span>
            <CheckCircle size={18} style={{ color: COLORS.success }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 22, fontWeight: 900 }}>{stats.completedCount}</div>
          <div style={{ color: COLORS.muted, marginTop: 4, fontSize: 13 }}>{formatCfa(stats.completedAmount)}</div>
        </div>

        <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: COLORS.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: 12 }}>Total</span>
            <DollarSign size={18} style={{ color: COLORS.primary }} />
          </div>
          <div style={{ marginTop: 10, fontSize: 22, fontWeight: 900 }}>{stats.totalCount}</div>
          <div style={{ color: COLORS.muted, marginTop: 4, fontSize: 13 }}>{formatCfa(stats.totalAmount)}</div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 320px', minWidth: 260 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.muted }} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by email, phone, reference, provider..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: 10,
              border: `1px solid ${COLORS.border}`,
              background: 'rgba(0,0,0,0.12)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} style={{ color: COLORS.muted }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${COLORS.border}`,
              background: 'rgba(0,0,0,0.12)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontWeight: 800,
            }}
          >
            <option value="all" style={{ background: '#0f172a' }}>All statuses</option>
            <option value="pending" style={{ background: '#0f172a' }}>Pending</option>
            <option value="completed" style={{ background: '#0f172a' }}>Completed</option>
          </select>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 12, textTransform: 'uppercase', color: COLORS.muted }}>User</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 12, textTransform: 'uppercase', color: COLORS.muted }}>Phone</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 12, textTransform: 'uppercase', color: COLORS.muted }}>Provider</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 12, textTransform: 'uppercase', color: COLORS.muted }}>Reference</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 12, textTransform: 'uppercase', color: COLORS.muted }}>Amount</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 12, textTransform: 'uppercase', color: COLORS.muted }}>Status</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 12, textTransform: 'uppercase', color: COLORS.muted }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: COLORS.muted }}>Loading transactions...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: COLORS.muted }}>No deposit transactions found.</td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const status = String(d.status);
                  const badgeStyle =
                    status === 'completed'
                      ? { background: 'rgba(52,211,153,0.12)', color: COLORS.success, border: '1px solid rgba(52,211,153,0.35)' }
                      : { background: 'rgba(251,191,36,0.12)', color: COLORS.warning, border: '1px solid rgba(251,191,36,0.35)' };

                  const providerLabel =
                    d.provider === 'mtn'
                      ? 'MTN'
                      : d.provider === 'orange'
                        ? 'Orange'
                        : d.provider === 'airtel'
                          ? 'Airtel'
                          : d.provider === 'vodafone'
                            ? 'Vodafone'
                            : d.provider || '-';

                  return (
                    <tr key={d.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{d.depositor_email || '-'}</td>
                      <td style={{ padding: 12, color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <Phone size={14} /> {d.phone || '-'}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>{providerLabel}</td>
                      <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{d.reference || '-'}</td>
                      <td style={{ padding: 12, fontWeight: 900 }}>{formatCfa(d.amount)}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ padding: '4px 10px', borderRadius: 999, fontWeight: 900, fontSize: 12, display: 'inline-block', ...badgeStyle }}>
                          {status === 'completed' ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: 12, color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <Clock size={14} /> {formatDateTime(d.created_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

