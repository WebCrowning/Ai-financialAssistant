import React, { useState, useEffect, useRef } from 'react';

// Font Awesome CDN
// Add to index.html: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

// Professional color system
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
  dark: '#0f172a'
};

export default function MyProfile({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ 
    totalIncome: 0, 
    totalExpenses: 0, 
    totalGoals: 0,
    savingsRate: 0,
    netBalance: 0,
    totalTransactions: 0,
    unusualCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form states
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [guardianMode, setGuardianMode] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [displayName, setDisplayName] = useState('');

  const fileInputRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      const [profileRes, expRes, incRes, goalRes] = await Promise.all([
        fetch('/api/auth/me', { headers }),
        fetch('/api/expenses', { headers }),
        fetch('/api/income', { headers }),
        fetch('/api/goals', { headers })
      ]);

      const profileData = await profileRes.json();
      const expenses = await expRes.json();
      const incomes = await incRes.json();
      const goals = await goalRes.json();

      if (profileRes.ok) {
        setProfile(profileData);
        setMonthlyIncome(profileData.monthly_income || '');
        setGuardianMode(profileData.guardian_mode === 1);
        setDisplayName(profileData.display_name || profileData.email?.split('@')[0] || 'User');
        if (profileData.profile_image) {
          setImagePreview(profileData.profile_image);
        }
      }

      const totalIncome = Array.isArray(incomes) ? incomes.reduce((s, i) => s + parseFloat(i.amount || 0), 0) : 0;
      const totalExpenses = Array.isArray(expenses) ? expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0) : 0;
      const netBalance = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0;

      setStats({
        totalIncome,
        totalExpenses,
        totalGoals: Array.isArray(goals) ? goals.length : 0,
        savingsRate,
        netBalance,
        totalTransactions: Array.isArray(expenses) ? expenses.length : 0,
        unusualCount: Array.isArray(expenses) ? expenses.filter(e => e.is_unusual).length : 0
      });
    } catch (err) {
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingImage(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('profile_image', file);

      const response = await fetch('/api/auth/profile-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Profile image updated successfully!');
        setProfile(prev => ({ ...prev, profile_image: data.imageUrl }));
        setTimeout(() => setSuccess(''), 4000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to upload image');
      }
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!window.confirm('Remove your profile image?')) return;
    
    try {
      const response = await fetch('/api/auth/profile-image', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setImagePreview(null);
        setProfile(prev => ({ ...prev, profile_image: null }));
        setSuccess('Profile image removed');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError('Failed to remove image');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          monthly_income: parseFloat(monthlyIncome) || 0,
          guardian_mode: guardianMode,
          display_name: displayName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update settings');
      setSuccess('Profile settings updated successfully!');
      fetchProfile();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <i className="fas fa-spinner fa-spin fa-3x" style={{ color: COLORS.primary }}></i>
        <p style={styles.loadingText}>Loading your profile...</p>
      </div>
    );
  }

  const netBalance = stats.netBalance;
  const financialScore = Math.min(100, Math.max(0,
    (stats.savingsRate || 0) > 20 ? 85 :
    (stats.savingsRate || 0) > 10 ? 65 :
    (stats.savingsRate || 0) > 0 ? 45 : 25
  ));
  const scoreColor = financialScore >= 75 ? COLORS.success : financialScore >= 50 ? COLORS.warning : COLORS.danger;
  const scoreLabel = financialScore >= 75 ? 'Excellent' : financialScore >= 50 ? 'Fair' : 'Needs Improvement';

  return (
    <div style={styles.container}>
      {/* Header with Profile Image */}
      <div style={styles.header}>
        <div style={styles.profileImageSection}>
          <div style={styles.profileImageWrapper}>
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Profile" 
                style={styles.profileImage}
              />
            ) : (
              <div style={styles.profileImagePlaceholder}>
                <i className="fas fa-user" style={{ fontSize: '36px', color: COLORS.white }}></i>
              </div>
            )}
            <div 
              style={styles.uploadOverlay}
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="fas fa-camera" style={{ fontSize: '20px' }}></i>
              <span style={styles.uploadText}>Change Photo</span>
            </div>
            {imagePreview && (
              <button 
                onClick={handleRemoveImage}
                style={styles.removeImageBtn}
                title="Remove image"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          {uploadingImage && (
            <div style={styles.uploadingIndicator}>
              <i className="fas fa-spinner fa-spin"></i>
              Uploading...
            </div>
          )}
        </div>

        <div style={styles.headerInfo}>
          <h1 style={styles.headerTitle}>
            {displayName || profile?.email?.split('@')[0] || 'User'}
          </h1>
          <p style={styles.headerEmail}>
            <i className="fas fa-envelope" style={{ marginRight: '8px', color: COLORS.gray[400] }}></i>
            {profile?.email}
          </p>
          <div style={styles.headerBadges}>
            <span style={{
              ...styles.badge,
              background: profile?.role === 'admin' ? COLORS.secondaryLight : COLORS.successLight,
              color: profile?.role === 'admin' ? COLORS.secondary : COLORS.success
            }}>
              <i className={`fas ${profile?.role === 'admin' ? 'fa-shield-alt' : 'fa-user-check'}`}></i>
              {profile?.role || 'User'}
            </span>
            <span style={styles.badge}>
              <i className="fas fa-calendar-alt"></i>
              Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div style={styles.errorAlert}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}
      {success && (
        <div style={styles.successAlert}>
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {[
          { label: 'Total Income', value: `CFA ${Math.round(stats.totalIncome).toLocaleString()}`, color: COLORS.success, icon: 'fa-arrow-up', bg: COLORS.successLight },
          { label: 'Total Expenses', value: `CFA ${Math.round(stats.totalExpenses).toLocaleString()}`, color: COLORS.danger, icon: 'fa-arrow-down', bg: COLORS.dangerLight },
          { label: 'Net Balance', value: `CFA ${Math.round(netBalance).toLocaleString()}`, color: netBalance >= 0 ? COLORS.success : COLORS.danger, icon: 'fa-wallet', bg: netBalance >= 0 ? COLORS.successLight : COLORS.dangerLight },
          { label: 'Savings Rate', value: `${stats.savingsRate || 0}%`, color: COLORS.secondary, icon: 'fa-chart-line', bg: COLORS.secondaryLight },
          { label: 'Transactions', value: stats.totalTransactions || 0, color: COLORS.primary, icon: 'fa-exchange-alt', bg: COLORS.primaryLight },
          { label: 'Active Goals', value: stats.totalGoals || 0, color: COLORS.warning, icon: 'fa-bullseye', bg: COLORS.warningLight }
        ].map((stat, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{...styles.statIconWrapper, background: stat.bg, color: stat.color}}>
              <i className={`fas ${stat.icon}`} style={{ fontSize: '18px' }}></i>
            </div>
            <div style={styles.statContent}>
              <span style={styles.statLabel}>{stat.label}</span>
              <span style={{...styles.statValue, color: stat.color}}>{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Section Tabs */}
      <div style={styles.tabsContainer}>
        {[
          { id: 'overview', label: 'Overview', icon: 'fa-user' },
          { id: 'settings', label: 'Settings', icon: 'fa-cog' },
          { id: 'security', label: 'Security', icon: 'fa-shield-alt' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveSection(tab.id)} 
            style={{
              ...styles.tab,
              ...(activeSection === tab.id ? styles.tabActive : {})
            }}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div style={styles.overviewGrid}>
          <div style={styles.infoCard}>
            <h3 style={styles.cardTitle}>
              <i className="fas fa-info-circle" style={{ color: COLORS.primary }}></i>
              Account Information
            </h3>
            <div style={styles.infoList}>
              {[
                { label: 'Display Name', value: displayName || 'Not set' },
                { label: 'Email Address', value: profile?.email },
                { label: 'Account Role', value: profile?.role?.toUpperCase() || 'User' },
                { label: 'Monthly Income', value: `CFA ${parseFloat(profile?.monthly_income || 0).toLocaleString()}` },
                { label: 'Guardian Mode', value: profile?.guardian_mode ? '🛡️ Active' : 'Disabled' },
                { label: 'Member Since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A' }
              ].map((item, i) => (
                <div key={i} style={styles.infoItem}>
                  <span style={styles.infoLabel}>{item.label}</span>
                  <span style={styles.infoValue}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.healthCard}>
            <h3 style={styles.cardTitle}>
              <i className="fas fa-heartbeat" style={{ color: COLORS.success }}></i>
              Financial Health Score
            </h3>
            <div style={styles.healthScore}>
              <div style={styles.scoreCircle}>
                <div style={styles.scoreValue}>{financialScore}</div>
                <div style={styles.scoreLabel}>/ 100</div>
              </div>
              <div>
                <p style={{...styles.scoreStatus, color: scoreColor}}>{scoreLabel}</p>
                <p style={styles.scoreDescription}>
                  Based on your savings rate of {stats.savingsRate || 0}%
                </p>
              </div>
            </div>
            <div style={styles.healthInsights}>
              {stats.unusualCount > 0 && (
                <div style={styles.insightWarning}>
                  <i className="fas fa-exclamation-triangle"></i>
                  {stats.unusualCount} unusual transaction(s) detected
                </div>
              )}
              {(stats.savingsRate || 0) > 15 && (
                <div style={styles.insightSuccess}>
                  <i className="fas fa-check-circle"></i>
                  You're saving more than 15% of your income!
                </div>
              )}
              {stats.totalGoals > 0 && (
                <div style={styles.insightInfo}>
                  <i className="fas fa-bullseye"></i>
                  {stats.totalGoals} active savings goal(s)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <div style={styles.settingsCard}>
          <h3 style={styles.cardTitle}>
            <i className="fas fa-cog" style={{ color: COLORS.primary }}></i>
            Account Settings
          </h3>
          <form onSubmit={handleSaveSettings} style={styles.settingsForm}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <i className="fas fa-user" style={{ color: COLORS.gray[400] }}></i>
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your display name"
                style={styles.formInput}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <i className="fas fa-money-bill-wave" style={{ color: COLORS.gray[400] }}></i>
                Monthly Income (CFA)
              </label>
              <p style={styles.formHelp}>
                Used to calculate savings rate and budget alerts
              </p>
              <input
                type="number"
                value={monthlyIncome}
                onChange={e => setMonthlyIncome(e.target.value)}
                placeholder="e.g. 350000"
                style={{...styles.formInput, fontSize: '16px'}}
                min="0"
                step="100"
              />
            </div>

            <div style={styles.guardianToggle}>
              <div style={styles.guardianInfo}>
                <div style={styles.guardianHeader}>
                  <i className="fas fa-shield-alt" style={{ color: COLORS.secondary }}></i>
                  <h4 style={styles.guardianTitle}>Guardian Mode</h4>
                </div>
                <p style={styles.guardianDesc}>
                  When enabled, the Guardian system monitors and blocks unusual transactions that exceed budget limits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGuardianMode(!guardianMode)}
                style={{
                  ...styles.toggleButton,
                  background: guardianMode ? `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.primary})` : COLORS.gray[300]
                }}
              >
                <div style={{
                  ...styles.toggleHandle,
                  transform: guardianMode ? 'translateX(24px)' : 'translateX(0)'
                }} />
              </button>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveButton,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <div style={styles.securityGrid}>
          <div style={styles.infoCard}>
            <h3 style={styles.cardTitle}>
              <i className="fas fa-shield-alt" style={{ color: COLORS.secondary }}></i>
              Guardian Status
            </h3>
            <div style={styles.guardianStatus}>
              <div style={{
                ...styles.guardianStatusIcon,
                background: profile?.guardian_mode ? COLORS.successLight : COLORS.dangerLight,
                color: profile?.guardian_mode ? COLORS.success : COLORS.danger
              }}>
                <i className={`fas ${profile?.guardian_mode ? 'fa-check-circle' : 'fa-exclamation-circle'}`} style={{ fontSize: '32px' }}></i>
              </div>
              <div>
                <p style={styles.guardianStatusTitle}>
                  {profile?.guardian_mode ? 'Guardian is Active' : 'Guardian is Disabled'}
                </p>
                <p style={styles.guardianStatusDesc}>
                  {profile?.guardian_mode
                    ? 'Your account is protected against unusual spending patterns'
                    : 'Enable Guardian Mode in Settings to protect your finances'}
                </p>
              </div>
            </div>
            <div style={styles.featureList}>
              {[
                { label: 'Budget Limit Enforcement', active: !!profile?.guardian_mode },
                { label: 'Anomaly Detection', active: !!profile?.guardian_mode },
                { label: 'Unusual Transaction Flagging', active: true },
                { label: 'Budget Alert Notifications', active: true }
              ].map((feature, i) => (
                <div key={i} style={styles.featureItem}>
                  <span style={styles.featureLabel}>{feature.label}</span>
                  <span style={{
                    ...styles.featureStatus,
                    background: feature.active ? COLORS.successLight : COLORS.dangerLight,
                    color: feature.active ? COLORS.success : COLORS.danger
                  }}>
                    {feature.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.infoCard}>
            <h3 style={styles.cardTitle}>
              <i className="fas fa-lock" style={{ color: COLORS.primary }}></i>
              Security Information
            </h3>
            <div style={styles.securityItems}>
              <div style={styles.securityItem}>
                <i className="fas fa-key" style={{ color: COLORS.primary }}></i>
                <div>
                  <p style={styles.securityItemTitle}>JWT Token Auth</p>
                  <p style={styles.securityItemDesc}>24-hour expiring session token</p>
                </div>
              </div>
              <div style={styles.securityItem}>
                <i className="fas fa-lock" style={{ color: COLORS.success }}></i>
                <div>
                  <p style={styles.securityItemTitle}>Password Hashing</p>
                  <p style={styles.securityItemDesc}>bcrypt with 10 salt rounds</p>
                </div>
              </div>
              <div style={styles.securityItem}>
                <i className="fas fa-history" style={{ color: COLORS.warning }}></i>
                <div>
                  <p style={styles.securityItemTitle}>Activity Logging</p>
                  <p style={styles.securityItemDesc}>All financial actions are audited</p>
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              style={styles.logoutButton}
            >
              <i className="fas fa-sign-out-alt"></i>
              Sign Out of Account
            </button>
          </div>
        </div>
      )}
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
  },
  loadingText: {
    color: COLORS.gray[500],
    fontSize: '14px',
    margin: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '28px',
    padding: '24px',
    background: 'white',
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  profileImageSection: {
    position: 'relative',
    flexShrink: 0,
  },
  profileImageWrapper: {
    position: 'relative',
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: `4px solid ${COLORS.primaryLight}`,
    cursor: 'pointer',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  uploadOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    opacity: 0,
    transition: 'opacity 0.3s',
    cursor: 'pointer',
  },
  uploadText: {
    fontSize: '10px',
    marginTop: '4px',
  },
  removeImageBtn: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,0.6)',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    transition: 'all 0.2s',
  },
  uploadingIndicator: {
    position: 'absolute',
    bottom: '-28px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '12px',
    color: COLORS.primary,
    whiteSpace: 'nowrap',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    margin: 0,
    fontSize: '26px',
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  headerEmail: {
    margin: '4px 0 12px 0',
    color: COLORS.gray[500],
    fontSize: '14px',
  },
  headerBadges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    background: COLORS.gray[100],
    color: COLORS.gray[600],
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  errorAlert: {
    padding: '12px 18px',
    background: COLORS.dangerLight,
    border: `1px solid ${COLORS.danger}`,
    borderRadius: '10px',
    color: COLORS.danger,
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '20px',
    fontWeight: '500',
  },
  successAlert: {
    padding: '12px 18px',
    background: COLORS.successLight,
    border: `1px solid ${COLORS.success}`,
    borderRadius: '10px',
    color: COLORS.success,
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '20px',
    fontWeight: '500',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'transform 0.2s',
  },
  statIconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '500',
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    display: 'block',
    fontSize: '18px',
    fontWeight: '700',
    marginTop: '2px',
  },
  tabsContainer: {
    display: 'flex',
    gap: '4px',
    background: 'white',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '24px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  tab: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    background: 'transparent',
    color: COLORS.gray[600],
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
    color: 'white',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  infoCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  cardTitle: {
    margin: '0 0 20px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: COLORS.gray[900],
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    borderBottom: `1px solid ${COLORS.gray[100]}`,
  },
  infoLabel: {
    color: COLORS.gray[500],
    fontSize: '13px',
  },
  infoValue: {
    fontWeight: '600',
    color: COLORS.gray[900],
    fontSize: '13px',
  },
  healthCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  healthScore: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '20px',
  },
  scoreCircle: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: `6px solid ${COLORS.primary}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: `${COLORS.primary}11`,
  },
  scoreValue: {
    fontSize: '28px',
    fontWeight: '800',
    color: COLORS.gray[900],
  },
  scoreLabel: {
    fontSize: '12px',
    color: COLORS.gray[500],
  },
  scoreStatus: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 4px 0',
  },
  scoreDescription: {
    margin: 0,
    color: COLORS.gray[500],
    fontSize: '13px',
  },
  healthInsights: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  insightWarning: {
    padding: '10px',
    background: COLORS.dangerLight,
    borderRadius: '8px',
    color: COLORS.danger,
    fontSize: '13px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  insightSuccess: {
    padding: '10px',
    background: COLORS.successLight,
    borderRadius: '8px',
    color: COLORS.success,
    fontSize: '13px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  insightInfo: {
    padding: '10px',
    background: COLORS.primaryLight,
    borderRadius: '8px',
    color: COLORS.primary,
    fontSize: '13px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  settingsCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  settingsForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.gray[700],
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  formHelp: {
    margin: 0,
    fontSize: '12px',
    color: COLORS.gray[400],
  },
  formInput: {
    padding: '10px 12px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    fontSize: '14px',
    background: COLORS.gray[50],
    color: COLORS.gray[900],
    outline: 'none',
    transition: 'all 0.2s',
  },
  guardianToggle: {
    padding: '16px 20px',
    background: COLORS.secondaryLight,
    borderRadius: '12px',
    border: `1px solid ${COLORS.secondary}44`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guardianInfo: {
    flex: 1,
  },
  guardianHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  guardianTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  guardianDesc: {
    margin: 0,
    fontSize: '13px',
    color: COLORS.gray[600],
  },
  toggleButton: {
    width: '52px',
    height: '28px',
    borderRadius: '14px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.3s',
    flexShrink: 0,
  },
  toggleHandle: {
    position: 'absolute',
    top: '3px',
    left: '3px',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: 'white',
    transition: 'transform 0.3s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  saveButton: {
    padding: '12px 24px',
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    alignSelf: 'flex-start',
  },
  securityGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  guardianStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: COLORS.gray[50],
    borderRadius: '10px',
    marginBottom: '16px',
  },
  guardianStatusIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  guardianStatusTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  guardianStatusDesc: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: COLORS.gray[500],
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  featureItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: COLORS.gray[50],
    borderRadius: '8px',
  },
  featureLabel: {
    fontSize: '13px',
    color: COLORS.gray[600],
  },
  featureStatus: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '2px 12px',
    borderRadius: '12px',
  },
  securityItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  securityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: COLORS.gray[50],
    borderRadius: '8px',
  },
  securityItemTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  securityItemDesc: {
    margin: '2px 0 0 0',
    fontSize: '12px',
    color: COLORS.gray[500],
  },
  logoutButton: {
    width: '100%',
    padding: '12px',
    background: COLORS.dangerLight,
    border: `1px solid ${COLORS.danger}44`,
    borderRadius: '10px',
    color: COLORS.danger,
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    fontSize: '14px',
  },
};

// Add hover styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }
  
  .tab:hover:not(.tab-active) {
    background: ${COLORS.gray[50]};
  }
  
  .form-input:focus {
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 3px ${COLORS.primaryLight};
  }
  
  .profile-image-wrapper:hover .upload-overlay {
    opacity: 1;
  }
  
  .remove-image-btn:hover {
    background: rgba(220, 38, 38, 0.8);
    transform: scale(1.1);
  }
  
  .save-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
  }
  
  .logout-button:hover {
    background: ${COLORS.danger};
    color: white;
  }
  
  .guardian-toggle:hover {
    opacity: 0.9;
  }
  
  @media (max-width: 768px) {
    .overview-grid,
    .security-grid {
      grid-template-columns: 1fr;
    }
    
    .header {
      flex-direction: column;
      text-align: center;
    }
    
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .guardian-toggle {
      flex-direction: column;
      text-align: center;
      gap: 12px;
    }
    
    .health-score {
      flex-direction: column;
      text-align: center;
    }
  }
`;
document.head.appendChild(styleSheet);