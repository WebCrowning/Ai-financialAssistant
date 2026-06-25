import React, { useState } from 'react';
import { Lock, Mail, UserPlus, LogIn, DollarSign } from 'lucide-react';
import { supabase } from '../supabaseClient';
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

    try {
      // Supabase Auth (frontend)
      // Requires VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in your Vercel environment.
      if (!import.meta.env?.VITE_SUPABASE_URL) {
        throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized. Check env vars.');
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Use access token for your existing backend JWT flow.
        // If your backend is fully Supabase-only, you may remove this and switch other endpoints too.
        // Use access token if available; otherwise store a placeholder token
        const accessToken = data.session?.access_token || 'fallback-token';
        const user = data.user;
        if (!user) {
          throw new Error('Login succeeded but user data is missing.');
        }
        // Store token and user info
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify({
          id: user.id,
          email: user.email,
        }));

        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess({ email: user.email }, accessToken);
        } else {
          // Redirect to the root to load the main app with stored token
          window.location.href = '/';
        }
      } else {
        // Create account via Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              monthly_income: parseFloat(monthlyIncome) || 0,
              role,
            }
          }
        });
        if (error) throw error;

        // If email confirmations are enabled, session might be null.
        setError(data.user ? 'Account created. Please confirm your email (if confirmation is enabled).' : 'Account created.');
      }
    } catch (err) {
      // Simplify error handling: display the error message directly
      setError(err.message || 'Authentication failed');
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
