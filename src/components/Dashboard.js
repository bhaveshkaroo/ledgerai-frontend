import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CheckCircle2, AlertCircle, CreditCard, ChevronDown } from 'lucide-react';
import BankModal from './BankModal';

const FULL_YEAR_DATA = [
  { month: 'Apr 2025', income: 1200000, expense: 800000, amount: 400000 },
  { month: 'May 2025', income: 1100000, expense: 900000, amount: 200000 },
  { month: 'Jun 2025', income: 1300000, expense: 850000, amount: 450000 },
  { month: 'Jul 2025', income: 1400000, expense: 1100000, amount: 300000 },
  { month: 'Aug 2025', income: 1500000, expense: 1200000, amount: 300000 },
  { month: 'Sep 2025', income: 1250000, expense: 950000, amount: 300000 },
  { month: 'Oct 2025', income: 1600000, expense: 1100000, amount: 500000 },
  { month: 'Nov 2025', income: 1700000, expense: 1300000, amount: 400000 },
  { month: 'Dec 2025', income: 1800000, expense: 1400000, amount: 400000 },
  { month: 'Jan 2026', income: 1500000, expense: 1200000, amount: 300000 },
  { month: 'Feb 2026', income: 1400000, expense: 1100000, amount: 300000 },
  { month: 'Mar 2026', income: 1900000, expense: 1500000, amount: 400000 },
];

function Dashboard() {
  const [periodType, setPeriodType] = useState('Full Year'); 
  const [selectedSubPeriod, setSelectedSubPeriod] = useState('Full Year');
  const [displayData, setDisplayData] = useState(FULL_YEAR_DATA);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [connectedBanks, setConnectedBanks] = useState([
    { bankName: 'HDFC Bank', accountType: 'Current Account', accountNumber: '8812' }
  ]);

  useEffect(() => {
    let filtered = [];
    if (periodType === 'Full Year') {
      filtered = FULL_YEAR_DATA;
    } else if (periodType === 'Quarterly') {
      if (selectedSubPeriod === 'Q1') filtered = FULL_YEAR_DATA.slice(0, 3);
      else if (selectedSubPeriod === 'Q2') filtered = FULL_YEAR_DATA.slice(3, 6);
      else if (selectedSubPeriod === 'Q3') filtered = FULL_YEAR_DATA.slice(6, 9);
      else if (selectedSubPeriod === 'Q4') filtered = FULL_YEAR_DATA.slice(9, 12);
      else filtered = FULL_YEAR_DATA;
    } else if (periodType === 'Monthly') {
      const idx = FULL_YEAR_DATA.findIndex(d => d.month === selectedSubPeriod);
      if (idx !== -1) {
        filtered = [FULL_YEAR_DATA[idx]];
      } else {
        filtered = FULL_YEAR_DATA;
      }
    }
    setDisplayData(filtered);
  }, [periodType, selectedSubPeriod]);

  const kpis = useMemo(() => {
    const totalRev = displayData.reduce((s, d) => s + d.income, 0);
    const totalExp = displayData.reduce((s, d) => s + d.expense, 0);
    const netProfit = totalRev - totalExp;
    return { totalRev, totalExp, netProfit };
  }, [displayData]);

  const fmt = (v) => `₹${v.toLocaleString('en-IN')}`;

  return (
    <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">P&L Overview</h1>
          <p style={{color: 'var(--text-secondary)', fontSize: 13, marginTop: 4}}>
            Showing data for {selectedSubPeriod}
          </p>
        </div>
        <div className="accounts-aggregator">
          <div className="aggregator-label">
            Connected Accounts<br/>Account Aggregator
          </div>
          <div className="account-pills">
            {connectedBanks.map((b, i) => (
              <div key={i} className="pill">{b.bankName} (..{b.accountNumber})</div>
            ))}
            <div className="pill primary" onClick={() => setIsBankModalOpen(true)}>+ Add Bank</div>
          </div>
        </div>
      </div>

      <div className="filters-row">
        <div className="filter-group">
          {['Monthly', 'Quarterly', 'Full Year'].map(f => (
            <button 
              key={f} 
              className={`filter-btn ${periodType === f ? 'active' : ''}`}
              onClick={() => {
                setPeriodType(f);
                if (f === 'Full Year') setSelectedSubPeriod('Full Year');
                if (f === 'Quarterly') setSelectedSubPeriod('Q1');
                if (f === 'Monthly') setSelectedSubPeriod('Apr 2025');
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {periodType === 'Quarterly' && (
          <div className="filter-group sub-filters">
            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
              <button 
                key={q} 
                className={`filter-btn ${selectedSubPeriod === q ? 'active' : ''}`}
                onClick={() => setSelectedSubPeriod(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {periodType === 'Monthly' && (
          <div className="custom-select" style={{minWidth: 150}}>
            <select value={selectedSubPeriod} onChange={(e) => setSelectedSubPeriod(e.target.value)}>
              {FULL_YEAR_DATA.map(d => <option key={d.month} value={d.month}>{d.month}</option>)}
            </select>
            <ChevronDown size={14} className="select-icon" />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 30}}>
        <div className="card glass-card kpi-card">
          <span className="kpi-label">Total Revenue</span>
          <span className="kpi-value text-green">{fmt(kpis.totalRev)}</span>
        </div>
        <div className="card glass-card kpi-card">
          <span className="kpi-label">Total Expenses</span>
          <span className="kpi-value text-red">{fmt(kpis.totalExp)}</span>
        </div>
        <div className="card glass-card kpi-card">
          <span className="kpi-label">Net Profit</span>
          <span className="kpi-value">{fmt(kpis.netProfit)}</span>
        </div>
        <div className="card glass-card kpi-card">
          <span className="kpi-label">Cash Balance</span>
          <span className="kpi-value text-blue">{fmt(4000000)}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="charts-column">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Profit & Loss</h3>
              <div className="chart-legend">
                <span><span className="dot" style={{background: 'var(--accent-cyan)'}}></span>Income</span>
                <span><span className="dot" style={{background: 'var(--accent-blue)'}}></span>Expenses</span>
              </div>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 11}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 11}} tickFormatter={v => `₹${v/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="expense" stroke="var(--accent-blue)" strokeWidth={3} fill="url(#gradExpense)" />
                  <Area type="monotone" dataKey="income" stroke="var(--accent-cyan)" strokeWidth={3} fill="url(#gradIncome)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Cash Flow</h3>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 11}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 11}} tickFormatter={v => `₹${v/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="amount" stroke="var(--accent-cyan)" strokeWidth={3} fill="url(#gradCash)" activeDot={{ r: 6, fill: 'var(--accent-cyan)', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{marginBottom: 32}}>Balance Sheet Summary</h3>
          <div className="bs-stat">
            <div className="bs-label">Total Assets</div>
            <div className="bs-value">{fmt(20000000)}</div>
          </div>
          <div className="bs-stat">
            <div className="bs-label">Total Liabilities</div>
            <div className="bs-value">{fmt(8000000)}</div>
          </div>
          <div className="bs-stat">
            <div className="bs-label">Net Worth</div>
            <div className="bs-value">{fmt(12000000)}</div>
          </div>
          <div style={{marginTop: 20, background: 'var(--badge-success-bg)', color: 'var(--green)', padding: '8px 16px', borderRadius: 12, fontSize: 12, fontWeight: 700, display: 'inline-block'}}>
            ✓ Balanced
          </div>
        </div>
      </div>

      {/* Connected Banks List Section */}
      <div className="card" style={{marginTop: 30}}>
        <h3 className="card-title" style={{marginBottom: 20}}>Connected Bank Accounts</h3>
        <div className="bank-list">
          {connectedBanks.map((b, i) => (
            <div key={i} className="bank-item">
              <CreditCard className="bank-icon" />
              <div className="bank-info">
                <strong>{b.bankName}</strong>
                <span>{b.accountType} • XXXX{b.accountNumber}</span>
              </div>
              <div className="bank-status">
                <span className="status-dot"></span> Connected
              </div>
            </div>
          ))}
        </div>
      </div>

      <BankModal 
        isOpen={isBankModalOpen} 
        onClose={() => setIsBankModalOpen(false)} 
        onAdd={(bank) => setConnectedBanks([...connectedBanks, bank])} 
      />

      <style jsx>{`
        .kpi-card { display: flex; flex-direction: column; gap: 8px; padding: 24px; }
        .kpi-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; }
        .kpi-value { font-size: 24px; font-weight: 700; }
        .text-green { color: var(--green); }
        .text-red { color: var(--red); }
        .text-blue { color: var(--accent-blue); }
        .sub-filters { margin-left: 20px; border: 1px solid var(--accent-blue) !important; }
        .bank-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
        .bank-item { background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px; }
        .bank-icon { color: var(--accent-blue); }
        .bank-info { flex: 1; display: flex; flex-direction: column; }
        .bank-info strong { font-size: 14px; }
        .bank-info span { font-size: 11px; color: var(--text-secondary); }
        .bank-status { font-size: 11px; color: var(--green); display: flex; align-items: center; gap: 6px; font-weight: 600; }
        .status-dot { width: 6px; height: 6px; background: var(--green); border-radius: 50%; }
        .custom-select { position: relative; }
        .custom-select select { width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 20px; color: white; appearance: none; font-size: 13px; }
        .select-icon { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-secondary); }
      `}</style>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p style={{fontWeight: 700, marginBottom: 4}}>{payload[0].payload.month}</p>
        {payload.map((p, i) => (
          <p key={i} style={{color: p.color}}>{p.name}: ₹{p.value.toLocaleString('en-IN')}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default Dashboard;
