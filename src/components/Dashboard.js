import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, LineChart, Line, ComposedChart } from 'recharts';
import { CheckCircle2, AlertCircle, CreditCard, ChevronDown, X, Download, Star, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import BankModal from './BankModal';
import { LedgerEngine, formatINR, CHART_OF_ACCOUNTS } from '../utils/LedgerEngine';

const MONTHS = ['Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'];

const PanoramicOverlay = ({ isOpen, onClose, type, period, data }) => {
  const [drillPeriod, setDrillPeriod] = useState('Full Year');

  if (!isOpen) return null;

  const drillData = data; // In a real app, we might re-filter here

  return (
    <div className="panoramic-overlay">
      <div className="panoramic-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{type} Analysis — Sharma Textiles Pvt Ltd</h2>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>{drillPeriod} Data | FY 2025-26</p>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={32} />
        </button>
      </div>

      <div className="panoramic-content">
        <div className="pill-nav">
          {['Monthly', 'Quarterly', 'Full Year'].map(p => (
            <button 
              key={p} 
              className={`pill-btn ${drillPeriod === p ? 'active' : ''}`}
              onClick={() => setDrillPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="card" style={{ height: 450, background: '#1e293b', border: '1px solid #334155' }}>
          <ResponsiveContainer width="100%" height="100%">
            {type === 'Cash Flow' ? (
              <BarChart data={drillData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={v => formatINR(v)} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
                <Bar dataKey="amount">
                  {drillData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.amount >= 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={0} /> {/* Invisible line for axis baseline if needed */}
              </BarChart>
            ) : (
              <ComposedChart data={drillData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={v => formatINR(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={type === 'Revenue' ? 'income' : 'expense'} fill={type === 'Revenue' ? '#00e5ff' : '#ef4444'} radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey={type === 'Revenue' ? 'income' : 'expense'} stroke="#3b82f6" strokeWidth={2} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {type === 'Cash Flow' && (
          <div className="summary-cards">
            <div className="summary-card positive">
              <label>Operating Cash Flow</label>
              <div className="amount"><ArrowUp size={20}/> {formatINR(850000)}</div>
            </div>
            <div className="summary-card negative">
              <label>Investing Cash Flow</label>
              <div className="amount"><ArrowDown size={20}/> {formatINR(300000)}</div>
            </div>
            <div className="summary-card negative">
              <label>Financing Cash Flow</label>
              <div className="amount"><ArrowDown size={20}/> {formatINR(150000)}</div>
            </div>
          </div>
        )}

        <div className="card" style={{ marginTop: 40, padding: 0, overflow: 'hidden', border: '1px solid #334155' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Period</th>
                <th className="right">Operating CF (₹)</th>
                <th className="right">Investing CF (₹)</th>
                <th className="right">Financing CF (₹)</th>
                <th className="right">Net CF (₹)</th>
                <th className="right">Cumulative Cash (₹)</th>
              </tr>
            </thead>
            <tbody>
              {drillData.map((d, i) => (
                <tr key={i}>
                  <td>{d.month}</td>
                  <td className="right">{formatINR(d.income * 0.6)}</td>
                  <td className="right text-red">{formatINR(-d.expense * 0.2)}</td>
                  <td className="right text-red">{formatINR(-50000)}</td>
                  <td className={`right ${d.amount >= 0 ? 'text-green' : 'text-red'}`} style={{ fontWeight: 700 }}>
                    {formatINR(d.amount)}
                  </td>
                  <td className="right">{formatINR(2500000 + drillData.slice(0, i+1).reduce((s,x)=>s+x.amount, 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="pill primary" style={{ marginTop: 32, padding: '12px 24px' }}>
          <Download size={18} /> Download CSV
        </button>
      </div>
    </div>
  );
};

function Dashboard({ period, setPeriod }) {
  const [periodType, setPeriodType] = useState('Full Year'); 
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [panoramic, setPanoramic] = useState({ open: false, type: '' });
  const [connectedBanks, setConnectedBanks] = useState([
    { bankName: 'HDFC Bank', accountType: 'Current Account', accountNumber: '8812' }
  ]);

  const displayData = useMemo(() => {
    return MONTHS.map(m => {
      const is = LedgerEngine.calcIncomeStatement(m);
      const cf = LedgerEngine.calcCashFlow(m);
      return {
        month: m,
        income: is.totalRevenue,
        expense: is.totalExpenses,
        amount: cf.netChange 
      };
    }).filter(d => {
      if (period === 'Full Year') return true;
      if (period.startsWith('Q')) {
         const quarters = { 'Q1': ['Apr', 'May', 'Jun'], 'Q2': ['Jul', 'Aug', 'Sep'], 'Q3': ['Oct', 'Nov', 'Dec'], 'Q4': ['Jan', 'Feb', 'Mar'] };
         return quarters[period].some(q => d.month.startsWith(q));
      }
      return d.month === period;
    });
  }, [period]);

  const kpis = useMemo(() => LedgerEngine.calcKPIs(period), [period]);

  return (
    <div style={{ animation: 'fadeIn 0.8s ease-out', marginLeft: 0 }}>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Financial Dashboard</h1>
          <p style={{color: '#94a3b8', fontSize: 13, marginTop: 4}}>
            Sharma Textiles Pvt Ltd | <span style={{ color: '#3b82f6', fontWeight: 600 }}>{period}</span>
          </p>
        </div>
        <div className="account-pills">
          {connectedBanks.map((b, i) => (
            <div key={i} className="pill" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              {b.bankName} (..{b.accountNumber})
            </div>
          ))}
          <div className="pill primary" onClick={() => setIsBankModalOpen(true)}>+ Add Bank</div>
        </div>
      </div>

      <div className="filters-row">
        <div className="filter-group" style={{ background: '#1e293b' }}>
          {['Monthly', 'Quarterly', 'Full Year'].map(f => (
            <button 
              key={f} 
              className={`filter-btn ${periodType === f ? 'active' : ''}`}
              onClick={() => {
                setPeriodType(f);
                if (f === 'Full Year') setPeriod('Full Year');
                if (f === 'Quarterly') setPeriod('Q1');
                if (f === 'Monthly') setPeriod('Apr 2025');
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-grid kpi-row" style={{gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 30}}>
        <div className="card kpi-card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <span className="kpi-label">Total Revenue</span>
          <span className="kpi-value text-green">{formatINR(kpis.totalRevenue)}</span>
        </div>
        <div className="card kpi-card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <span className="kpi-label">Total Expenses</span>
          <span className="kpi-value text-red">{formatINR(kpis.totalExpenses)}</span>
        </div>
        <div className="card kpi-card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <span className="kpi-label">Net Profit</span>
          <span className="kpi-value">{formatINR(kpis.netProfit)}</span>
        </div>
        <div className="card kpi-card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <span className="kpi-label">Cash Balance</span>
          <span className="kpi-value" style={{ color: '#3b82f6' }}>{formatINR(kpis.cashBalance)}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="charts-column">
          <div className="card clickable-chart" onClick={() => setPanoramic({ open: true, type: 'Revenue' })} style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <div className="card-header">
              <h3 className="card-title">Revenue Trends <ExternalLink size={14} style={{ opacity: 0.5 }} /></h3>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData}>
                  <XAxis dataKey="month" hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" stroke="#00e5ff" fill="rgba(0,229,255,0.1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card clickable-chart" onClick={() => setPanoramic({ open: true, type: 'Expenses' })} style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <div className="card-header">
              <h3 className="card-title">Expense Outflow <ExternalLink size={14} style={{ opacity: 0.5 }} /></h3>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData}>
                  <XAxis dataKey="month" hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="rgba(239,68,68,0.1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card clickable-chart" onClick={() => setPanoramic({ open: true, type: 'Cash Flow' })} style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h3 className="card-title" style={{marginBottom: 20}}>Cash Flow Analysis <ExternalLink size={14} style={{ opacity: 0.5 }} /></h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" hide />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} domain={['auto', 'auto']} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
                <Bar dataKey="amount">
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.amount >= 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
                {/* Horizontal Baseline at Y=0 */}
                <Line type="monotone" dataKey="amount" stroke="rgba(100,116,139,0.5)" strokeWidth={1} dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 10 }}>Click for panoramic drill-down</p>
        </div>
      </div>

      <BankModal 
        isOpen={isBankModalOpen} 
        onClose={() => setIsBankModalOpen(false)} 
        onAdd={(bank) => setConnectedBanks([...connectedBanks, bank])} 
      />

      <PanoramicOverlay 
        isOpen={panoramic.open} 
        onClose={() => setPanoramic({ open: false, type: '' })}
        type={panoramic.type}
        period={period}
        data={displayData}
      />

      <style jsx>{`
        .clickable-chart { cursor: pointer; transition: 0.2s; }
        .clickable-chart:hover { border-color: #3b82f6 !important; transform: translateY(-2px); }
        .kpi-card { padding: 24px; display: flex; flex-direction: column; gap: 8px; }
        .kpi-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
        .kpi-value { font-size: 24px; font-weight: 700; }
        .text-green { color: #22c55e; }
        .text-red { color: #ef4444; }
      `}</style>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ background: '#0f172a', border: '1px solid #334155' }}>
        <p style={{fontWeight: 700, marginBottom: 4, color: '#fff'}}>{payload[0].payload.month}</p>
        {payload.map((p, i) => (
          <p key={i} style={{color: p.color, fontSize: 12}}>{p.name}: {formatINR(p.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default Dashboard;
