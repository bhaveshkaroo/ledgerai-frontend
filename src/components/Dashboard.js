import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, LineChart, Line, ComposedChart, PieChart, Pie, Legend } from 'recharts';
import { CheckCircle2, AlertCircle, CreditCard, ChevronDown, X, Download, Star, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import BankModal from './BankModal';
import { LedgerEngine, formatINR, CHART_OF_ACCOUNTS } from '../utils/LedgerEngine';

const MONTHS = ['Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'];

const CATEGORY_COLORS = {
  'Raw Materials': '#f59e0b',
  'Salary': '#3b82f6',
  'Rent': '#8b5cf6',
  'Expense': '#06b6d4',
  'GST Payment': '#ec4899',
  'Freight': '#10b981',
  'Other': '#94a3b8'
};

const PanoramicOverlay = ({ isOpen, onClose, type, period, data }) => {
  const [drillPeriod, setDrillPeriod] = useState(period);

  if (!isOpen) return null;

  return (
    <div className="panoramic-overlay">
      <div className="panoramic-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{type} Analysis — Sharma Textiles Pvt Ltd</h2>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>{drillPeriod} Data | FY 2025-26</p>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={32} />
        </button>
      </div>

      <div className="panoramic-content">
        <div className="card" style={{ height: 450, background: '#1e293b', border: '1px solid #334155', padding: 24 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={v => formatINR(v)} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={type === 'Cash Flow' ? (entry.value >= 0 ? '#22c55e' : '#ef4444') : '#3b82f6'} />
                ))}
              </Bar>
              {type === 'Cash Flow' && <Line type="monotone" dataKey="zero" stroke="#64748b" strokeWidth={2} dot={false} />}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ marginTop: 40, padding: 0, overflow: 'hidden', border: '1px solid #334155' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Period</th>
                <th className="right">Amount (₹)</th>
                <th className="right">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i}>
                  <td>{d.name}</td>
                  <td className={`right ${d.value < 0 ? 'text-red' : ''}`}>{formatINR(d.value)}</td>
                  <td className="right">{((Math.abs(d.value) / data.reduce((s,x)=>s+Math.abs(x.value),0)) * 100).toFixed(1)}%</td>
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
  const [connectedBanks, setConnectedBanks] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('ledgerai_connected_banks');
    if (saved) setConnectedBanks(JSON.parse(saved));
  }, []);

  const chartData = useMemo(() => {
    const txs = LedgerEngine.getFilteredTransactions(period);
    
    // If Monthly period, group by week
    if (MONTHS.includes(period)) {
      const weeks = [{ name: 'Week 1', value: 0 }, { name: 'Week 2', value: 0 }, { name: 'Week 3', value: 0 }, { name: 'Week 4', value: 0 }];
      const revenue = [...weeks].map(w => ({ ...w }));
      const expense = [...weeks].map(w => ({ ...w }));
      const cashflow = [...weeks].map(w => ({ ...w, zero: 0 }));

      txs.forEach(t => {
        const d = new Date(t.date).getDate();
        const weekIdx = Math.min(3, Math.floor((d - 1) / 7));
        const val = t.amount;
        
        if (t.account === 'Sales Revenue') {
          revenue[weekIdx].value += val;
          cashflow[weekIdx].value += val;
        } else {
          expense[weekIdx].value += val;
          cashflow[weekIdx].value -= val;
        }
      });
      return { revenue, expense, cashflow };
    }

    // Otherwise group by month
    const monthsData = MONTHS.map(m => {
      const is = LedgerEngine.calcIncomeStatement(m);
      const cf = LedgerEngine.calcCashFlow(m);
      return {
        name: m,
        revenue: is.totalRevenue,
        expense: is.totalExpenses,
        cashflow: cf.netChange,
        zero: 0
      };
    }).filter(d => {
      if (period === 'Full Year') return true;
      if (period.startsWith('Q')) {
        const qMap = { 'Q1': ['Apr', 'May', 'Jun'], 'Q2': ['Jul', 'Aug', 'Sep'], 'Q3': ['Oct', 'Nov', 'Dec'], 'Q4': ['Jan', 'Feb', 'Mar'] };
        return qMap[period].some(m => d.name.startsWith(m));
      }
      return false;
    });

    return {
      revenue: monthsData.map(d => ({ name: d.name, value: d.revenue })),
      expense: monthsData.map(d => ({ name: d.name, value: d.expense })),
      cashflow: monthsData.map(d => ({ name: d.name, value: d.cashflow, zero: 0 }))
    };
  }, [period]);

  const expenseBreakdown = useMemo(() => {
    const txs = LedgerEngine.getFilteredTransactions(period).filter(t => t.type === 'Debit');
    const categories = {};
    txs.forEach(t => {
      const cat = t.category || 'Other';
      categories[cat] = (categories[cat] || 0) + t.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value, fill: CATEGORY_COLORS[name] || '#94a3b8' }));
  }, [period]);

  const kpis = useMemo(() => LedgerEngine.calcKPIs(period), [period]);

  const maxRevenue = Math.max(...chartData.revenue.map(d => d.value), 1);

  return (
    <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
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
              {b.bankName} (..{b.accountNumberMasked.slice(-4)})
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
        {periodType === 'Monthly' && (
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            style={{ marginLeft: 12, padding: '8px 16px', borderRadius: 30, background: '#1e293b', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600 }}
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
      </div>

      <div className="dashboard-grid kpi-row" style={{gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 30}}>
        {[
          { label: 'Total Revenue', value: kpis.totalRevenue, color: 'text-green' },
          { label: 'Total Expenses', value: kpis.totalExpenses, color: 'text-red' },
          { label: 'Net Profit', value: kpis.netProfit, color: 'text-white' },
          { label: 'Cash Balance', value: kpis.cashBalance, color: 'text-blue' }
        ].map((k, i) => (
          <div key={i} className="card kpi-card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <span className="kpi-label">{k.label}</span>
            <span className={`kpi-value ${k.color}`}>{formatINR(k.value)}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card clickable-chart" onClick={() => setPanoramic({ open: true, type: 'Revenue' })} style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h3 className="card-title">Revenue Trends <ExternalLink size={14} /></h3>
          <div style={{ height: 250, marginTop: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.revenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis hide domain={[0, maxRevenue * 1.15]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card clickable-chart" onClick={() => setPanoramic({ open: true, type: 'Cash Flow' })} style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h3 className="card-title">Cash Flow Analysis <ExternalLink size={14} /></h3>
          <div style={{ height: 250, marginTop: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.cashflow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={v => formatINR(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value">
                  {chartData.cashflow.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="zero" stroke="#64748b" strokeWidth={1} dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1.5fr 1fr', marginTop: 30 }}>
        <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h3 className="card-title">Expense Breakdown</h3>
          <div style={{ height: 300, display: 'flex' }}>
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={5} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: '40%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
              {expenseBreakdown.map(e => (
                <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: e.fill }} />
                  <span style={{ color: '#94a3b8' }}>{e.name}:</span>
                  <span style={{ fontWeight: 600 }}>{formatINR(e.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <h3 className="card-title">Profitability</h3>
          <div className="summary-cards" style={{ gridTemplateColumns: '1fr', marginTop: 20 }}>
            <div className="summary-card" style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <label>Gross Margin</label>
              <div className="amount" style={{ color: '#22c55e' }}>{LedgerEngine.calcIncomeStatement(period).grossMargin.toFixed(1)}%</div>
            </div>
            <div className="summary-card" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <label>Net Margin</label>
              <div className="amount" style={{ color: '#3b82f6' }}>{LedgerEngine.calcIncomeStatement(period).netMargin.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      <BankModal isOpen={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} onAdd={() => {
        const saved = localStorage.getItem('ledgerai_connected_banks');
        if (saved) setConnectedBanks(JSON.parse(saved));
      }} />

      <PanoramicOverlay 
        isOpen={panoramic.open} 
        onClose={() => setPanoramic({ open: false, type: '' })}
        type={panoramic.type}
        period={period}
        data={panoramic.type === 'Revenue' ? chartData.revenue : chartData.cashflow}
      />

      <style jsx>{`
        .text-blue { color: #3b82f6; }
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
      <div className="custom-tooltip" style={{ background: '#0f172a', border: '1px solid #334155', padding: 12, borderRadius: 8 }}>
        <p style={{fontWeight: 700, marginBottom: 4, color: '#fff'}}>{payload[0].payload.name}</p>
        {payload.map((p, i) => (
          <p key={i} style={{color: p.color || p.fill, fontSize: 12}}>{p.name}: {formatINR(p.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default Dashboard;
