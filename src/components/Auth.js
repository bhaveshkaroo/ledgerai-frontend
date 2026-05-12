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
      background: 'var(--bg-page)', backgroundImage: 'radial-gradient(at 0% 0%, oklch(18% 0.02 260) 0px, transparent 50%), radial-gradient(at 100% 0%, oklch(15% 0.01 160 / 0.1) 0px, transparent 50%)'
    }}>
      <div className="auth-card" style={{
        width: '100%', maxWidth: '400px', padding: 'var(--space-12)', background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-bright)', boxShadow: 'var(--shadow-linear)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-8)' }}>
          <div className="sidebar-logo">L</div>
        </div>
        
        <h1 style={{ fontSize: '24px', fontWeight: 600, textAlign: 'center', marginBottom: '8px' }}>LedgerAI</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 'var(--space-12)' }}>
          The Precise Emerald Sanctuary
        </p>

        {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '13px', marginBottom: 'var(--space-6)' }}>{error}</div>}

        <button 
          onClick={onDemoLogin}
          style={{
            width: '100%', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--accent-emerald)',
            borderRadius: '8px', color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: 'var(--space-6)',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--accent-emerald-glow)'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--bg-surface)'}
        >
          <Sparkles size={18} />
          Enter Sanctuary (Demo Mode)
          <ArrowRight size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0', opacity: 0.3 }}>
          <div style={{ flex: 1, height: '1px', background: 'white' }}></div>
          <span style={{ fontSize: '12px' }}>OR SIGN IN</span>
          <div style={{ flex: 1, height: '1px', background: 'white' }}></div>
        </div>

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Email Address</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '6px', color: 'white', outline: 'none' }}
            />
          </div>

          <button type="submit" style={{ padding: '12px', background: 'white', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 600, marginTop: '8px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-8)', fontSize: '13px', color: 'var(--text-muted)' }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <span style={{ color: 'white', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Sign In" : "Sign Up"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
