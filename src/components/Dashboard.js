import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, AreaChart, Area, Cell
} from 'recharts';
import { 
  TrendingUp, IndianRupee, AlertCircle, CheckCircle2, 
  ArrowUpRight, ArrowDownRight, MoreHorizontal
} from 'lucide-react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';

const Sparkline = ({ data, color = 'var(--accent-emerald)' }) => (
  <svg width="100%" height="40" viewBox="0 0 100 40" preserveAspectRatio="none">
    <path
      d={`M 0 ${40 - (data[0] / Math.max(...data, 1)) * 30} ${data.map((v, i) => `L ${(i / (data.length - 1)) * 100} ${40 - (v / Math.max(...data, 1)) * 30}`).join(' ')}`}
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const KPICard = ({ label, value, trend, trendData, children }) => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--mouse-x', `${x}%`);
    cardRef.current.style.setProperty('--mouse-y', `${y}%`);
  };

  return (
    <div 
      ref={cardRef} 
      className="card" 
      onMouseMove={handleMouseMove}
      style={{ position: 'relative' }}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', fontWeight: 500 }}>
          {trend > 0 ? (
            <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center' }}>
              <ArrowUpRight size={14} /> +{trend}%
            </span>
          ) : (
            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center' }}>
              <ArrowDownRight size={14} /> {trend}%
            </span>
          )}
          <span style={{ color: 'var(--text-muted)' }}>from last period</span>
        </div>
      )}
      {trendData && <div className="sparkline-container"><Sparkline data={trendData} /></div>}
      {children}
    </div>
  );
};

function Dashboard({ period, setPeriod }) {
  const kpis = useMemo(() => LedgerEngine.calcKPIs(period), [period]);
  
  const mainChartData = useMemo(() => {
    const is = LedgerEngine.calcIncomeStatement(period);
    const bs = LedgerEngine.calcBalanceSheet(period);
    return [
      { name: 'Assets', value: bs.totalAssets, fill: 'var(--accent-emerald)' },
      { name: 'Liabilities', value: bs.totalLiabilities, fill: '#e8e8ed' }
    ];
  }, [period]);

  const cashTrendData = useMemo(() => [45, 52, 48, 61, 55, 67, 72], []); // Placeholder trend

  return (
    <div className="dashboard-container tab-content">
      {/* Top Section - Period Selection */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: 'var(--space-8)' }}>
        {['Monthly', 'Quarterly', 'Full Year'].map(p => (
          <button 
            key={p} 
            className={`sidebar-btn ${period === p ? 'active' : ''}`}
            onClick={() => setPeriod(p)}
            style={{ width: 'auto', background: period === p ? 'var(--bg-surface)' : 'transparent' }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <KPICard 
          label="Cash Balance" 
          value={formatINR(kpis.cashBalance)} 
          trend={4.2} 
          trendData={cashTrendData}
        />
        
        <KPICard label="Accounting Ratios" value="">
          <div style={{ marginTop: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Current Ratio</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-emerald)' }}>2.1</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Debt-to-Equity</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>0.45</span>
            </div>
          </div>
        </KPICard>

        <KPICard label="Assets vs Liabilities" value="">
          <div style={{ height: '80px', marginTop: 'var(--space-2)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mainChartData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" hide />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <span>{formatINR(mainChartData[0].value)} Assets</span>
              <span>{formatINR(mainChartData[1].value)} Liab.</span>
            </div>
          </div>
        </KPICard>
      </div>

      {/* Secondary Section - Insights & Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="status-dot emerald"></div>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Compliance Status</span>
            </div>
            <MoreHorizontal size={16} color="var(--text-muted)" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>GST Compliance Score</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '4px', background: '#e8e8ed', borderRadius: '2px' }}>
                  <div style={{ width: '92%', height: '100%', background: 'var(--accent-emerald)', borderRadius: '2px' }}></div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>92%</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Your financials are currently aligned with **AS-3** and **Ind AS** standards. No critical errors detected in the current period.
            </p>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Recent Activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Bank Sync', time: '2m ago', desc: 'Updated HDFC Bank statement' },
              { label: 'Compliance', time: '1h ago', desc: 'Audit log generated for Q3' },
              { label: 'Journal', time: '4h ago', desc: 'New transaction entry: #TX-4092' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === 0 ? 'var(--accent-emerald)' : '#e5e5e7', marginTop: '4px' }}></div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.desc} • {item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
