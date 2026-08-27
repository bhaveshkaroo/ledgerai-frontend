import React, { useState } from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { TrendingUp, BarChart2 } from 'lucide-react';

const Dashboard = () => {
  const [period] = useState('Full Year');
  const kpis = LedgerEngine.calcKPIs(period);

  return (
    <div className="animate-fade" style={{ maxWidth: '1200px' }}>
      {/* Header section matching Rafion layout */}
      <div className="dashboard-header">
        <h1>Acme Corp Global</h1>
        
        <div className="header-stat">
          <span className="digital-number value">106</span>
          <span className="label" style={{ background: 'var(--accent-lime)' }}>Total</span>
        </div>
        
        <div className="header-stat">
          <span className="digital-number value">80</span>
          <span className="label" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>Optimal</span>
        </div>
        
        <div className="header-stat">
          <span className="digital-number value">21</span>
          <span className="label" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>In range</span>
        </div>
      </div>

      {/* Hero Grid with Gradient Cards */}
      <div className="dashboard-hero-grid">
        <div className="card gradient-green" style={{ minHeight: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, opacity: 0.9, marginBottom: '16px' }}>Strategic Alignment</div>
          <div className="digital-number" style={{ fontSize: '56px', fontWeight: 700, lineHeight: 1 }}>70</div>
          <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '8px' }}>On Track</div>
          
          {/* Faux Sparkline */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '24px', marginTop: '24px', opacity: 0.5 }}>
            {[4, 6, 3, 8, 5, 7, 10, 6, 8, 5].map((h, i) => (
              <div key={i} style={{ width: '4px', height: (h * 2) + 'px', background: 'white', borderRadius: '2px' }}></div>
            ))}
          </div>
        </div>

        <div className="card gradient-orange" style={{ minHeight: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, opacity: 0.9, marginBottom: '16px' }}>Market Position Score</div>
          <div className="digital-number" style={{ fontSize: '56px', fontWeight: 700, lineHeight: 1 }}>25<span style={{ fontSize: '32px', opacity: 0.7 }}>/100</span></div>
          <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '8px' }}>Outperforming Competitors</div>
          
          <div style={{ width: '80%', height: '24px', marginTop: '24px', position: 'relative' }}>
             <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.3)' }}></div>
             <div style={{ position: 'absolute', bottom: 0, left: '25%', height: '12px', width: '2px', background: 'white' }}></div>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>Key Performance Indicators</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>A snapshot of what's happening inside your organization.</p>
      </div>

      <div className="dashboard-kpi-grid">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            <TrendingUp size={16} /> <span style={{ fontSize: '13px' }}>Net Profit Margin</span>
          </div>
          <div className="digital-number" style={{ fontSize: '36px', fontWeight: 600, color: 'var(--text-primary)' }}>
            82<span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Efficiency Score</div>
          
          <div style={{ marginTop: '24px', height: '32px', display: 'flex', alignItems: 'flex-end' }}>
             <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
               <path d="M0,20 Q25,30 50,15 T100,5" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
               <circle cx="100" cy="5" r="3" fill="var(--text-primary)" />
             </svg>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            <BarChart2 size={16} /> <span style={{ fontSize: '13px' }}>Revenue Growth</span>
          </div>
          <div className="digital-number" style={{ fontSize: '36px', fontWeight: 600, color: 'var(--text-primary)' }}>
            43
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>% vs last quarter</div>
          
          <div style={{ marginTop: '24px', display: 'flex', gap: '4px', height: '32px', alignItems: 'flex-end' }}>
            {[3, 4, 2, 5, 4, 7, 6, 8, 9].map((h, i) => (
              <div key={i} style={{ flex: 1, height: (h * 10) + '%', background: i === 8 ? 'var(--text-primary)' : 'var(--border)' }}></div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid currentColor' }}></div>
            <span style={{ fontSize: '13px' }}>Total Cash Balance</span>
          </div>
          <div className="digital-number" style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {formatINR(kpis.cashBalance)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Current liquidity</div>
          
          <div style={{ marginTop: '24px', display: 'flex', gap: '4px', height: '32px', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', height: '2px', background: 'var(--border)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-4px', left: '80%', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-lime)' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
