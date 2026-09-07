import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Eye, EyeOff, ArrowRight, ShieldCheck, Key } from 'lucide-react';
import logoImg from '../assets/logo.png';

function Auth({ onDemoLogin, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Check specific credentials requested by user
    if (cleanEmail === 'user@mesoai.in' && cleanPassword === '12345678') {
      try {
        const { data, error: supaErr } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
        if (!supaErr && data?.session) {
          localStorage.removeItem('MESO_DEMO_MODE');
          if (onLoginSuccess) onLoginSuccess(data.session.user);
          setLoading(false);
          return;
        }
      } catch (_) {}

      // Fallback local authenticated session for user@mesoai.in
      const businessUser = {
        id: 'usr-mesoai-admin-01',
        email: 'user@mesoai.in',
        user_metadata: { full_name: 'Apex Innovations Administrator' }
      };
      localStorage.setItem('MESO_AUTH_USER', JSON.stringify(businessUser));
      localStorage.removeItem('MESO_DEMO_MODE');
      if (onLoginSuccess) onLoginSuccess(businessUser);
      setLoading(false);
      return;
    }

    try {
      const { data, error: supaError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
      if (supaError) {
        setError(supaError.message);
      } else if (data?.session) {
        localStorage.removeItem('MESO_DEMO_MODE');
        if (onLoginSuccess) onLoginSuccess(data.session.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setError('Check your email for confirmation link.');
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-page)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img 
            src={logoImg} 
            alt="Meso Logo" 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              objectFit: 'cover',
              boxShadow: '0 8px 24px rgba(6, 64, 43, 0.22)',
              border: '1px solid rgba(6, 64, 43, 0.12)',
              marginBottom: '14px'
            }}
          />
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '4px' }}>Meso AI</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Enterprise Books of Accounts &amp; General Ledger</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
            {isSignUp ? 'Create Business Account' : 'Sign In to Your Books'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            {isSignUp ? 'Start managing your books with AI' : 'Enter your registered credentials to access your workspace'}
          </p>

          {/* Quick Credential Helper for user@mesoai.in */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            background: 'rgba(16,185,129,0.08)',
            borderRadius: '10px',
            marginBottom: '18px',
            border: '1px solid rgba(16,185,129,0.22)'
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={13} />
                <span>user@mesoai.in</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Password: 12345678</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('user@mesoai.in');
                setPassword('12345678');
              }}
              style={{
                background: '#06402b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Fill &amp; Ready
            </button>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '10px', marginBottom: '16px',
              background: error.includes('Check your email') ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              color: error.includes('Check your email') ? '#10b981' : '#ef4444',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@mesoai.in"
                required
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', fontSize: '14px',
                  background: 'var(--bg-surface)', outline: 'none',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%', padding: '12px 14px', paddingRight: '44px', borderRadius: '10px',
                    border: '1px solid var(--border)', fontSize: '14px',
                    background: 'var(--bg-surface)', outline: 'none',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px'
                  }}
                >
                  {showPassword ? <EyeOff size={16} color="var(--text-muted)" /> : <Eye size={16} color="var(--text-muted)" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%', padding: '14px', fontSize: '14px', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: loading ? 0.7 : 1, borderRadius: '12px',
                background: '#06402b', color: 'white', cursor: 'pointer'
              }}
            >
              {loading ? 'Authenticating...' : (isSignUp ? 'Create Account' : 'Sign In to Platform')}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '18px' }}>
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: '13px', cursor: 'pointer'
              }}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>

        {/* Demo Mode Button */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={onDemoLogin}
            style={{
              background: 'none', border: '1px solid var(--border)',
              padding: '11px 22px', borderRadius: 'var(--radius-pill)',
              fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Explore Sandbox Demo Mode (Fake Seed Data)
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '24px' }}>
          Powered by Meso AI &middot; Schedule III &amp; Indian Accounting Standards (AS)
        </p>
      </div>
    </div>
  );
}

export default Auth;
