import React, { useState, useEffect } from 'react';

// Font Awesome CDN (add to index.html)
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#dbeafe',
  secondary: '#7c3aed',
  secondaryLight: '#ede9fe',
  success: '#059669',
  successLight: '#d1fae5',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  warning: '#d97706',
  warningLight: '#fef3c7',
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },
  white: '#ffffff',
  black: '#000000'
};

const SEVERITY_CONFIG = {
  critical: { 
    color: COLORS.danger, 
    bg: COLORS.dangerLight, 
    border: COLORS.danger,
    icon: 'fa-exclamation-triangle', 
    label: 'Critical' 
  },
  warning: { 
    color: COLORS.warning, 
    bg: COLORS.warningLight, 
    border: COLORS.warning,
    icon: 'fa-exclamation-circle', 
    label: 'Warning' 
  },
  info: { 
    color: COLORS.primary, 
    bg: COLORS.primaryLight, 
    border: COLORS.primary,
    icon: 'fa-info-circle', 
    label: 'Info' 
  }
};

const TYPE_ICONS = {
  budget_exceeded: 'fa-arrow-trend-down',
  budget_warning: 'fa-exclamation-circle',
  unusual_spending: 'fa-shield-halved',
  income_exceeded: 'fa-triangle-exclamation',
  subscription_alert: 'fa-credit-card',
  goal_deadline: 'fa-bullseye'
};

export default function Notifications({ user, token }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = (id) => setDismissed(prev => new Set([...prev, id]));
  const dismissAll = () => setDismissed(new Set(notifications.map(n => n.id)));

  const visible = notifications.filter(n =>
    !dismissed.has(n.id) &&
    (filterSeverity === 'all' || n.severity === filterSeverity)
  );

  const counts = {
    critical: notifications.filter(n => !dismissed.has(n.id) && n.severity === 'critical').length,
    warning: notifications.filter(n => !dismissed.has(n.id) && n.severity === 'warning').length,
    info: notifications.filter(n => !dismissed.has(n.id) && n.severity === 'info').length
  };

  const totalActive = counts.critical + counts.warning + counts.info;

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIconWrapper}>
            <i className="fas fa-bell" style={{ color: COLORS.white, fontSize: '24px' }}></i>
          </div>
          <div>
            <h1 style={styles.title}>Notifications</h1>
            <p style={styles.subtitle}>
              Smart alerts for budget limits, unusual spending, and goal deadlines
              {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString()}`}
            </p>
          </div>
        </div>
        <div style={styles.headerRight}>
          {totalActive > 0 && (
            <button onClick={dismissAll} style={styles.dismissAllBtn}>
              <i className="fas fa-check-double"></i>
              Dismiss All
            </button>
          )}
          <button onClick={fetchNotifications} style={styles.refreshBtn}>
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            Refresh
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, borderBottom: `3px solid ${COLORS.danger}`}}>
          <div style={{...styles.statIconWrapper, background: COLORS.dangerLight}}>
            <i className="fas fa-exclamation-triangle" style={{ color: COLORS.danger, fontSize: '18px' }}></i>
          </div>
          <div>
            <span style={styles.statLabel}>Critical</span>
            <span style={{...styles.statValue, color: COLORS.danger}}>{counts.critical}</span>
          </div>
        </div>
        <div style={{...styles.statCard, borderBottom: `3px solid ${COLORS.warning}`}}>
          <div style={{...styles.statIconWrapper, background: COLORS.warningLight}}>
            <i className="fas fa-exclamation-circle" style={{ color: COLORS.warning, fontSize: '18px' }}></i>
          </div>
          <div>
            <span style={styles.statLabel}>Warnings</span>
            <span style={{...styles.statValue, color: COLORS.warning}}>{counts.warning}</span>
          </div>
        </div>
        <div style={{...styles.statCard, borderBottom: `3px solid ${COLORS.primary}`}}>
          <div style={{...styles.statIconWrapper, background: COLORS.primaryLight}}>
            <i className="fas fa-info-circle" style={{ color: COLORS.primary, fontSize: '18px' }}></i>
          </div>
          <div>
            <span style={styles.statLabel}>Info</span>
            <span style={{...styles.statValue, color: COLORS.primary}}>{counts.info}</span>
          </div>
        </div>
        <div style={{...styles.statCard, borderBottom: `3px solid ${COLORS.secondary}`}}>
          <div style={{...styles.statIconWrapper, background: COLORS.secondaryLight}}>
            <i className="fas fa-bell" style={{ color: COLORS.secondary, fontSize: '18px' }}></i>
          </div>
          <div>
            <span style={styles.statLabel}>Total Active</span>
            <span style={{...styles.statValue, color: COLORS.secondary}}>{totalActive}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={styles.tabsContainer}>
        {['all', 'critical', 'warning', 'info'].map(f => {
          const labels = {
            all: `All (${totalActive})`,
            critical: `Critical (${counts.critical})`,
            warning: `Warnings (${counts.warning})`,
            info: `Info (${counts.info})`
          };
          return (
            <button
              key={f}
              onClick={() => setFilterSeverity(f)}
              style={{
                ...styles.tab,
                ...(filterSeverity === f ? styles.tabActive : {})
              }}
            >
              {f !== 'all' && (
                <span style={{
                  ...styles.tabDot,
                  background: f === 'critical' ? COLORS.danger : f === 'warning' ? COLORS.warning : COLORS.primary
                }}></span>
              )}
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* Notification List */}
      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading your alerts...</p>
        </div>
      ) : visible.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <i className="fas fa-check-circle" style={{ fontSize: '48px', color: COLORS.success }}></i>
          </div>
          <h3 style={styles.emptyTitle}>
            {notifications.length === 0 ? 'No Alerts' : 'All Caught Up!'}
          </h3>
          <p style={styles.emptySubtext}>
            {notifications.length === 0
              ? 'Your finances look healthy. Keep tracking your expenses and budgets!'
              : 'All notifications have been dismissed.'}
          </p>
        </div>
      ) : (
        <div style={styles.notificationList}>
          {visible.map(notif => {
            const cfg = SEVERITY_CONFIG[notif.severity] || SEVERITY_CONFIG.info;
            const typeIcon = TYPE_ICONS[notif.type] || 'fa-bell';
            const timeAgo = getTimeAgo(notif.timestamp);
            const isExpanded = expandedId === notif.id;

            return (
              <div 
                key={notif.id} 
                style={{
                  ...styles.notificationItem,
                  borderLeft: `4px solid ${cfg.color}`,
                  background: cfg.bg,
                }}
                onClick={() => toggleExpand(notif.id)}
              >
                <div style={styles.notificationContent}>
                  <div style={{...styles.notificationIconWrapper, background: `${cfg.color}20`}}>
                    <i className={`fas ${typeIcon}`} style={{ color: cfg.color, fontSize: '18px' }}></i>
                  </div>
                  
                  <div style={styles.notificationBody}>
                    <div style={styles.notificationHeader}>
                      <div style={styles.notificationTitleRow}>
                        <span style={styles.notificationTitle}>{notif.title}</span>
                        <span style={{
                          ...styles.severityBadge,
                          background: `${cfg.color}20`,
                          color: cfg.color
                        }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div style={styles.notificationActions}>
                        {timeAgo && (
                          <span style={styles.notificationTime}>
                            <i className="far fa-clock" style={{ marginRight: '4px' }}></i>
                            {timeAgo}
                          </span>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }} 
                          style={styles.dismissBtn}
                          title="Dismiss"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                    
                    <p style={styles.notificationMessage}>
                      {isExpanded ? notif.message : notif.message.length > 120 ? notif.message.slice(0, 120) + '...' : notif.message}
                    </p>
                    
                    {notif.message.length > 120 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleExpand(notif.id); }} 
                        style={styles.expandBtn}
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                        <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ marginLeft: '4px', fontSize: '10px' }}></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dismissed Section */}
      {dismissed.size > 0 && (
        <div style={styles.dismissedFooter}>
          <span style={styles.dismissedText}>
            <i className="fas fa-check-circle" style={{ color: COLORS.success }}></i>
            {dismissed.size} notification(s) dismissed
          </span>
          <button onClick={() => setDismissed(new Set())} style={styles.restoreBtn}>
            <i className="fas fa-undo"></i>
            Restore All
          </button>
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .notification-item {
          animation: fadeIn 0.3s ease;
          transition: all 0.2s ease;
        }
        .notification-item:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .refresh-btn:hover {
          background: ${COLORS.gray[100]} !important;
        }
        .dismiss-all-btn:hover {
          background: ${COLORS.gray[100]} !important;
        }
        .dismiss-btn:hover {
          background: ${COLORS.gray[200]} !important;
        }
        .restore-btn:hover {
          color: ${COLORS.primaryDark} !important;
        }
        
        @media (max-width: 768px) {
          .header {
            flex-direction: column !important;
            text-align: center !important;
          }
          .header-left {
            flex-direction: column !important;
          }
          .header-right {
            flex-wrap: wrap !important;
            justify-content: center !important;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .tabs-container {
            overflow-x: auto !important;
            flex-wrap: nowrap !important;
          }
          .notification-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .notification-actions {
            width: 100% !important;
            justify-content: space-between !important;
          }
        }
      `}</style>
    </div>
  );
}

// Styles
const styles = {
  container: {
    padding: '28px',
    maxWidth: '1100px',
    margin: '0 auto',
    background: COLORS.gray[50],
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    padding: '20px 24px',
    background: COLORS.white,
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerIconWrapper: {
    width: '48px',
    height: '48px',
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: COLORS.gray[900],
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: '4px 0 0 0',
    color: COLORS.gray[500],
    fontSize: '14px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dismissAllBtn: {
    padding: '8px 16px',
    background: COLORS.white,
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    color: COLORS.gray[600],
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  refreshBtn: {
    padding: '8px 16px',
    background: COLORS.primary,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.white,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: COLORS.white,
    padding: '18px 20px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'all 0.2s',
  },
  statIconWrapper: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    display: 'block',
    fontSize: '22px',
    fontWeight: '700',
    marginTop: '2px',
  },
  tabsContainer: {
    display: 'flex',
    gap: '4px',
    background: COLORS.white,
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '24px',
    border: `1px solid ${COLORS.gray[200]}`,
    flexWrap: 'wrap',
  },
  tab: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    background: 'transparent',
    color: COLORS.gray[500],
    fontWeight: '500',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: COLORS.primary,
    color: COLORS.white,
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
  },
  tabDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  loadingState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: COLORS.white,
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: `3px solid ${COLORS.gray[200]}`,
    borderTop: `3px solid ${COLORS.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    color: COLORS.gray[500],
    fontSize: '14px',
    margin: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: COLORS.white,
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  emptyIcon: {
    marginBottom: '16px',
  },
  emptyTitle: {
    margin: '0 0 8px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  emptySubtext: {
    margin: 0,
    color: COLORS.gray[500],
    fontSize: '14px',
  },
  notificationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  notificationItem: {
    padding: '16px 20px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: COLORS.white,
  },
  notificationContent: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  notificationIconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notificationBody: {
    flex: 1,
    minWidth: 0,
  },
  notificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '6px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  notificationTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  notificationTitle: {
    fontWeight: '600',
    color: COLORS.gray[900],
    fontSize: '14px',
  },
  severityBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 10px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  notificationActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  notificationTime: {
    fontSize: '12px',
    color: COLORS.gray[400],
    display: 'flex',
    alignItems: 'center',
  },
  dismissBtn: {
    padding: '4px 8px',
    border: 'none',
    background: 'transparent',
    color: COLORS.gray[400],
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  notificationMessage: {
    margin: '4px 0 0 0',
    color: COLORS.gray[600],
    fontSize: '13px',
    lineHeight: '1.6',
  },
  expandBtn: {
    marginTop: '6px',
    border: 'none',
    background: 'transparent',
    color: COLORS.primary,
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    padding: '4px 0',
  },
  dismissedFooter: {
    marginTop: '16px',
    padding: '12px 20px',
    background: COLORS.white,
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  dismissedText: {
    fontSize: '13px',
    color: COLORS.gray[500],
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  restoreBtn: {
    border: 'none',
    background: 'transparent',
    color: COLORS.primary,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
};

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'notifications-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = `
      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      }
      .tab:hover:not(.tab-active) {
        background: ${COLORS.gray[100]};
      }
      .dismiss-btn:hover {
        background: ${COLORS.gray[100]};
        color: ${COLORS.gray[600]};
      }
      .restore-btn:hover {
        color: ${COLORS.primaryDark};
      }
    `;
    document.head.appendChild(styleSheet);
  }
}