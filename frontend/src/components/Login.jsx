import React, { useState } from 'react';
import { Lock, Mail, UserPlus, LogIn, DollarSign } from 'lucide-react';
import '../styles/login.css';
import logoImage from '../assets/logo.png';

export default function Login({ onLoginSuccess, initialIsLogin = true, onBackToLanding }) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [role, setRole] = useState('user'); // For demo, can register as admin or user
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password } 
      : { email, password, monthlyIncome: parseFloat(monthlyIncome) || 0, role };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Parse JSON safely; handle empty or non-JSON responses
      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        // response might be empty or not JSON
      }
      if (!response.ok) {
        const errMsg = (data && data.message) ? data.message : 'Authentication failed';
        throw new Error(errMsg);
      }
      if (!data) {
        throw new Error('Empty response from server');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(data.user, data.token);
      } else {
        // If no callback is provided, refresh to re-evaluate auth state
        window.location.reload();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="glass-card">
        {onBackToLanding && (
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <button 
              onClick={onBackToLanding}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--text-secondary)', 
                cursor: 'pointer', 
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600',
                padding: '4px 0'
              }}
            >
              ← Back to Home
            </button>
          </div>
        )}
        <div className="brand-section">
          <div className="brand-logo">
            <img src={logoImage} alt="FinVision Logo" className="logo-img" />
          </div>
          <h1>FinVision</h1>
          <p className="subtitle">AI-Powered Personal Finance Assistant</p>
        </div>

        {error && (
          <div className="alert-banner" style={{ marginBottom: '20px', padding: '12px' }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Monthly Income ($)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 3500"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Account Role</label>
                <select 
                  className="form-input" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  style={{ background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)' }}
                >
                  <option value="user" style={{ background: '#ffffff', color: '#000000' }}>Standard User</option>
                  <option value="admin" style={{ background: '#ffffff', color: '#000000' }}>Admin Controller</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Processing...' : isLogin ? (
              <>
                <LogIn size={18} /> Sign In
              </>
            ) : (
              <>
                <UserPlus size={18} /> Create Account
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>

        {/* Demo Credentials Help */}
        <div style={{
          marginTop: '24px', 
          padding: '12px', 
          background: 'rgba(0,0,0,0.02)', 
          borderRadius: '8px', 
          border: '1px solid rgba(0,0,0,0.05)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>Demo Accounts Available:</div>
          <div>• User: <span style={{ color: 'var(--primary)' }}>user@finvision.com</span> / password: <span style={{ color: 'var(--primary)' }}>userpassword</span></div>
          <div>• Admin: <span style={{ color: 'var(--primary)' }}>admin@finvision.com</span> / password: <span style={{ color: 'var(--primary)' }}>adminpassword</span></div>
        </div>
      </div>
    </div>
  );
}
