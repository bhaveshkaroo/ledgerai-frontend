import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowRight, Sparkles } from 'lucide-react';

const Auth = ({ onDemoLogin }) => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Hardcoded credentials for quick access
    if (
      (email === 'bhavesh' && password === 'asdfghjkl123') ||
      (email === 'demo' && password === 'lkjhgfdsa321')
    ) {
      setLoading(false);
      onDemoLogin();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    });
    if (error) setError(error.message);
    else {
      setError("Check your email for the confirmation link!");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
      background: 'var(--bg-page)'
    }}>
      <div className="auth-card" style={{
        width: '100%', maxWidth: '400px', padding: 'var(--space-12)', background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-bright)', boxShadow: 'var(--shadow-linear)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-8)' }}>
          <div className="sidebar-logo">L</div>
        </div>
        
        <h1 style={{ fontSize: '24px', fontWeight: 600, textAlign: 'center', marginBottom: '8px', color: 'var(--text-primary)' }}>LedgerAI</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 'var(--space-12)' }}>
          Intelligent accounting for modern business
        </p>

        {error && <div style={{ padding: '12px', background: 'rgba(255, 59, 48, 0.08)', border: '1px solid #ff3b30', borderRadius: '8px', color: '#ff3b30', fontSize: '13px', marginBottom: 'var(--space-6)' }}>{error}</div>}

        <button 
          onClick={onDemoLogin}
          style={{
            width: '100%', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: 'var(--space-6)',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--bg-surface)'}
        >
          <Sparkles size={18} />
          Continue with Demo
          <ArrowRight size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0', opacity: 0.8 }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OR SIGN IN</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Username or Email</label>
            <input
              type="text"
              placeholder="bhavesh or name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <button type="submit" style={{ padding: '12px', background: '#000000', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, marginTop: '8px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-8)', fontSize: '13px', color: 'var(--text-muted)' }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <span style={{ color: 'var(--text-primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }} onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Sign In" : "Sign Up"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
