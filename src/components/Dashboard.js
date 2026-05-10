import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, LineChart, Line, ComposedChart } from 'recharts';
import { CheckCircle2, AlertCircle, CreditCard, ChevronDown, X, Download, Star, ArrowUp, ArrowDown } from 'lucide-react';
import BankModal from './BankModal';
import { LedgerEngine, formatINR, CHART_OF_ACCOUNTS } from '../utils/LedgerEngine';

const MONTHS = ['Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'];

const KPIAnimation = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{formatINR(displayValue)}</span>;
};

const DrilldownModal = ({ isOpen, onClose, type, period, data }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content chart-drilldown-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={24} /></button>
        
        <div className="drilldown-header">
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>{type} Drill-down</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Sharma Textiles Pvt Ltd | {period}</p>
          </div>
          <button className="pill primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} /> Download CSV
          </button>
        </div>

        <div className="drilldown-body" style={{ flex: 1, minHeight: 400 }}>
          {type === 'Revenue' && (
            <>
              <div style={{ height: 300, marginBottom: 40 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} tickFormatter={v => formatINR(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="income" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="income" stroke="var(--accent-blue)" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Revenue</th>
                    <th>Growth</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => (
                    <tr key={i}>
                      <td>{d.month}</td>
                      <td style={{ fontWeight: 600 }}>{formatINR(d.income)}</td>
                      <td>{i > 0 ? (((d.income - data[i-1].income) / data[i-1].income) * 100).toFixed(1) + '%' : '—'}</td>
                      <td>{d.income > 1500000 ? <span className="badge-star"><Star size={12} fill="gold" /> Top Month</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {type === 'Expenses' && (
            <>
              <div style={{ height: 300, marginBottom: 40 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} tickFormatter={v => formatINR(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="expense" fill="var(--red)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Add more expense categories drilldown if needed */}
            </>
          )}

          {type === 'Cash Flow' && (
            <>
              <div style={{ height: 300, marginBottom: 40 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 12}} tickFormatter={v => formatINR(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount">
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.amount >= 0 ? 'var(--green)' : 'var(--red)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Net Cash Flow</th>
                    <th>Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => (
                    <tr key={i}>
                      <td>{d.month}</td>
                      <td style={{ color: d.amount >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{formatINR(d.amount)}</td>
                      <td>{formatINR(data.slice(0, i+1).reduce((s, x) => s + x.amount, 2500000))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .badge-star {
          background: rgba(255, 215, 0, 0.1);
          color: gold;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>
    </div>
  );
};

function Dashboard({ period, setPeriod }) {
  const [periodType, setPeriodType] = useState('Full Year'); 
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [drilldown, setDrilldown] = useState({ open: false, type: '' });
  const [connectedBanks, setConnectedBanks] = useState([
    { bankName: 'HDFC Bank', accountType: 'Current Account', accountNumber: '8812' }
  ]);

  const displayData = useMemo(() => {
    // Generate data for charts from LedgerEngine
    return MONTHS.map(m => {
      const is = LedgerEngine.calcIncomeStatement(m);
      const cf = LedgerEngine.calcCashFlow(m);
      return {
        month: m,
        income: is.totalRevenue,
        expense: is.totalExpenses,
        amount: cf.netChange // Net Cash Flow
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

  const openDrilldown = (type) => {
    setDrilldown({ open: true, type });
  };

  return (
    <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Financial Dashboard</h1>
          <p style={{color: 'var(--text-secondary)', fontSize: 13, marginTop: 4}}>
            Sharma Textiles Pvt Ltd | <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{period}</span>
          </p>
        </div>
        <div className="accounts-aggregator">
          <div className="aggregator-label">
            Connected Accounts<br/>Account Aggregator
          </div>
          <div className="account-pills">
            {connectedBanks.map((b, i) => (
              <div key={i} className="pill">{b.bankName} (..{b.accountNumber}) <span className="status-dot"></span></div>
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
                if (f === 'Full Year') setPeriod('Full Year');
                if (f === 'Quarterly') setPeriod('Q1');
                if (f === 'Monthly') setPeriod('Apr 2025');
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
                className={`filter-btn ${period === q ? 'active' : ''}`}
                onClick={() => setPeriod(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {periodType === 'Monthly' && (
          <div className="custom-select" style={{minWidth: 150}}>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown size={14} className="select-icon" />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid kpi-row" style={{gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 30}}>
        <div className="card glass-card kpi-card">
          <span className="kpi-label">Total Revenue</span>
          <span className="kpi-value text-green"><KPIAnimation value={kpis.totalRevenue} /></span>
        </div>
        <div className="card glass-card kpi-card">
          <span className="kpi-label">Total Expenses</span>
          <span className="kpi-value text-red"><KPIAnimation value={kpis.totalExpenses} /></span>
        </div>
        <div className="card glass-card kpi-card">
          <span className="kpi-label">Net Profit (PAT)</span>
          <span className="kpi-value"><KPIAnimation value={kpis.netProfit} /></span>
        </div>
        <div className="card glass-card kpi-card">
          <span className="kpi-label">Cash Balance</span>
          <span className="kpi-value text-blue"><KPIAnimation value={kpis.cashBalance} /></span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="charts-column">
          <div className="card clickable-chart" onClick={() => openDrilldown('Revenue')}>
            <div className="card-header">
              <h3 className="card-title">Revenue Trends</h3>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData}>
                  <defs>
                    <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" stroke="var(--accent-cyan)" fill="url(#gradRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card clickable-chart" onClick={() => openDrilldown('Expenses')}>
            <div className="card-header">
              <h3 className="card-title">Expense Outflow</h3>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData}>
                  <defs>
                    <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--red)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--red)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="expense" stroke="var(--red)" fill="url(#gradExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card clickable-chart" onClick={() => openDrilldown('Cash Flow')}>
          <h3 className="card-title" style={{marginBottom: 20}}>Cash Flow Analysis</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount">
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.amount >= 0 ? 'var(--green)' : 'var(--red)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 10 }}>
            Click to view waterfall drill-down
          </p>
        </div>
      </div>

      <div className="card transactions-card">
        <h3 className="card-title" style={{marginBottom: 24}}>Recent Transactions - {period}</h3>
        <table className="modern-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Account</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {LedgerEngine.getFilteredTransactions(period).slice(0, 5).map((t, i) => (
              <tr key={i}>
                <td>{t.date}</td>
                <td>{t.narration}</td>
                <td>{t.account}</td>
                <td style={{fontWeight: 600, color: t.type === 'Debit' ? 'var(--red)' : 'var(--green)'}}>
                  {t.type === 'Debit' ? '-' : '+'} {formatINR(t.amount)}
                </td>
                <td><div className="status-cell status-approved"><CheckCircle2 size={16}/> Reconciled</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BankModal 
        isOpen={isBankModalOpen} 
        onClose={() => setIsBankModalOpen(false)} 
        onAdd={(bank) => setConnectedBanks([...connectedBanks, bank])} 
      />

      <DrilldownModal 
        isOpen={drilldown.open} 
        onClose={() => setDrilldown({ open: false, type: '' })}
        type={drilldown.type}
        period={period}
        data={displayData}
      />

      <style jsx>{`
        .clickable-chart { cursor: pointer; transition: transform 0.2s; }
        .clickable-chart:hover { transform: scale(1.02); border-color: var(--accent-blue); }
        .status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block; margin-left: 6px; box-shadow: 0 0 10px #10b981; }
        .kpi-card { padding: 24px; }
        .kpi-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; display: block; }
        .kpi-value { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .text-green { color: #10b981; }
        .text-red { color: #ff4d4f; }
        .text-blue { color: #3b82f6; }
        .sub-filters { margin-left: 20px; }
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
          <p key={i} style={{color: p.color}}>{p.name}: {formatINR(p.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default Dashboard;
