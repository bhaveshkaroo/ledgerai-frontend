import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, AreaChart, Area, Cell, Line
} from 'recharts';
import { 
  ArrowUp, ArrowDown, Calendar, AlertCircle, Sparkles, 
  Clock, FileText, TrendingUp, IndianRupee, CheckCircle2
} from 'lucide-react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';

const MONTHS = ['Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'];
const MONTHS_SHORT = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const Sparkline = ({ data, color }) => (
  <svg width="100%" height="40" viewBox="0 0 100 40" preserveAspectRatio="none">
    <defs>
      <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
        <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
      </linearGradient>
    </defs>
    <path
      d={`M 0 40 ${data.map((v, i) => `L ${(i / (data.length - 1)) * 100} ${40 - (v / Math.max(...data, 1)) * 30}`).join(' ')} L 100 40 Z`}
      fill={`url(#grad-${color})`}
    />
    <path
      d={`M 0 ${40 - (data[0] / Math.max(...data, 1)) * 30} ${data.map((v, i) => `L ${(i / (data.length - 1)) * 100} ${40 - (v / Math.max(...data, 1)) * 30}`).join(' ')}`}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CountUpNumber = ({ value, prefix = '₹' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 800;
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

  return <span>{prefix}{formatINR(displayValue)}</span>;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="card" style={{ padding: '12px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
        <p style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>{label}</p>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, fontSize: 12 }}>
            <span style={{ color: p.color }}>{p.name}:</span>
            <span style={{ fontWeight: 600 }}>{formatINR(p.value)}</span>
          </div>
        ))}
        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
          {( (payload[0].value / 12000000) * 100 ).toFixed(1)}% of Annual Total
        </p>
      </div>
    );
  }
  return null;
};

const QuickStatsRibbon = ({ kpis }) => (
  <div className="stats-ribbon card" style={{ padding: '12px 24px', flexDirection: 'row', justifyContent: 'space-between', display: 'flex', marginBottom: 20 }}>
    <div className="stat-item">
      <FileText size={16} color="var(--accent-gold)" />
      <div>
        <div className="stat-label">Invoices Raised</div>
        <div className="stat-value mono">142</div>
      </div>
    </div>
    <div className="stat-item">
      <TrendingUp size={16} color="var(--accent-teal)" />
      <div>
        <div className="stat-label">Avg Invoice</div>
        <div className="stat-value mono">₹84,500</div>
      </div>
    </div>
    <div className="stat-item">
      <IndianRupee size={16} color="var(--accent-navy)" />
      <div>
        <div className="stat-label">Largest Tx</div>
        <div className="stat-value mono">₹12.4L</div>
      </div>
    </div>
    <div className="stat-item">
      <Clock size={16} color="var(--accent-amber)" />
      <div>
        <div className="stat-label">Last GST</div>
        <div className="stat-value mono">12 Days Ago</div>
      </div>
    </div>
    <div className="stat-item">
      <CheckCircle2 size={16} color="var(--accent-teal)" />
      <div>
        <div className="stat-label">MoM Growth</div>
        <div className="stat-value mono">+14.2%</div>
      </div>
    </div>
  </div>
);

const ComplianceCalendar = () => (
  <div className="card" style={{ flex: 1 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700 }}>Compliance Calendar</h3>
      <Calendar size={18} color="var(--text-muted)" />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[
        { name: 'GSTR-3B Filing', date: 'May 20', status: 'red', period: 'Apr 2025', penalty: '₹5,000' },
        { name: 'TDS Payment', date: 'Jun 07', status: 'amber', period: 'May 2025', penalty: '1.5% Interest' },
        { name: 'PF Contribution', date: 'Jun 15', status: 'green', period: 'May 2025', penalty: '₹2,500' },
        { name: 'GSTR-1 Filing', date: 'Jun 11', status: 'green', period: 'May 2025', penalty: '₹50/day' },
        { name: 'Advance Tax', date: 'Jun 15', status: 'green', period: 'Q1 FY26', penalty: '1% per month' }
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ 
            padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, 
            backgroundColor: item.status === 'red' ? 'var(--accent-red)' : (item.status === 'amber' ? 'var(--accent-amber)' : 'var(--accent-teal)'),
            color: '#fff', minWidth: 50, textAlign: 'center'
          }}>
            {item.date}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.period} | Penalty: {item.penalty}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

function Dashboard({ period, setPeriod }) {
  const [periodType, setPeriodType] = useState('Full Year');

  const kpis = useMemo(() => LedgerEngine.calcKPIs(period), [period]);
  
  const mainChartData = useMemo(() => {
    return MONTHS_SHORT.map((m, i) => {
      const is = LedgerEngine.calcIncomeStatement(MONTHS[i]);
      return {
        name: m,
        revenue: is.totalRevenue,
        expense: is.totalExpenses
      };
    });
  }, []);

  const cashBalanceData = useMemo(() => {
    let balance = 2500000;
    return MONTHS_SHORT.map((m, i) => {
      const cf = LedgerEngine.calcCashFlow(MONTHS[i]);
      balance += cf.netChange;
      return { name: m, balance };
    });
  }, []);

  const expenseCategories = useMemo(() => {
    return [
      { name: 'Raw Materials', value: 4500000 },
      { name: 'Salaries', value: 2800000 },
      { name: 'Logistics', value: 1200000 },
      { name: 'Marketing', value: 850000 },
      { name: 'Utilities', value: 420000 }
    ].sort((a, b) => b.value - a.value);
  }, []);

  const formatLakhs = (tickItem) => {
    return `${(tickItem / 100000).toFixed(0)}L`;
  };

  return (
    <div className="animate-fade-in">
      <div className="dashboard-layout">
        {/* Left Column (60%) */}
        <div className="dashboard-left">
          {/* Date Navigation Bar */}
          <div className="date-nav-wrapper">
            <div className="date-tabs">
              {['Monthly', 'Quarterly', 'Full Year'].map(t => (
                <button 
                  key={t} 
                  className={`date-tab-btn ${periodType === t ? 'active' : ''}`}
                  onClick={() => setPeriodType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {periodType !== 'Full Year' && (
              <div className="month-pills-row">
                {(periodType === 'Monthly' ? MONTHS : ['Q1', 'Q2', 'Q3', 'Q4']).map(m => (
                  <div 
                    key={m} 
                    className={`month-pill ${period === m ? 'active' : ''}`}
                    onClick={() => setPeriod(m)}
                  >
                    {m}
                  </div>
                ))}
              </div>
            )}
          </div>

          <QuickStatsRibbon kpis={kpis} />

          {/* KPI 2x2 Grid */}
          <div className="kpi-grid">
            <div className="card kpi-card revenue">
              <div>
                <div className="kpi-label">Total Revenue</div>
                <div className="kpi-value mono"><CountUpNumber value={kpis.totalRevenue} /></div>
              </div>
              <div className="kpi-trend">
                <Sparkline data={[40, 55, 45, 60, 75, 70]} color="var(--accent-teal)" />
              </div>
              <div className="delta-badge delta-positive">+12.5%</div>
            </div>
            <div className="card kpi-card expense">
              <div>
                <div className="kpi-label">Total Expenses</div>
                <div className="kpi-value mono"><CountUpNumber value={kpis.totalExpenses} /></div>
              </div>
              <div className="kpi-trend">
                <Sparkline data={[30, 40, 35, 50, 45, 55]} color="var(--accent-red)" />
              </div>
              <div className="delta-badge delta-negative">+8.2%</div>
            </div>
            <div className="card kpi-card profit">
              <div>
                <div className="kpi-label">Net Profit</div>
                <div className="kpi-value mono"><CountUpNumber value={kpis.netProfit} /></div>
              </div>
              <div className="kpi-trend">
                <Sparkline data={[20, 25, 22, 30, 35, 32]} color="var(--accent-gold)" />
              </div>
              <div className="delta-badge delta-positive">+15.1%</div>
            </div>
            <div className="card kpi-card cash">
              <div>
                <div className="kpi-label">Cash Balance</div>
                <div className="kpi-value mono"><CountUpNumber value={kpis.cashBalance} /></div>
              </div>
              <div className="kpi-trend">
                <Sparkline data={[50, 45, 48, 55, 52, 60]} color="var(--accent-navy)" />
              </div>
              <div className="delta-badge delta-positive">+4.3%</div>
            </div>
          </div>

          {/* Main Bar Chart */}
          <div className="card" style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Revenue vs Expenses</h3>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bg-sidebar)' }} /> Revenue</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-amber)' }} /> Expenses</span>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mainChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={formatLakhs} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Bar 
                    dataKey="revenue" 
                    fill="var(--bg-sidebar)" 
                    radius={[4, 4, 0, 0]} 
                    name="Revenue" 
                    animationDuration={1000}
                    animationBegin={200}
                  />
                  <Bar 
                    dataKey="expense" 
                    fill="var(--accent-amber)" 
                    radius={[4, 4, 0, 0]} 
                    name="Expenses" 
                    animationDuration={1000}
                    animationBegin={400}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sub Charts Row */}
          <div className="sub-charts-row">
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Cash Balance Trend</h3>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashBalanceData}>
                    <defs>
                      <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="100%">
                        <stop offset="5%" stopColor="var(--accent-teal)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent-teal)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="balance" stroke="var(--accent-teal)" fillOpacity={1} fill="url(#colorCash)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Top Expense Categories</h3>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseCategories} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="var(--accent-gold)" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1000}>
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fillOpacity={1 - index * 0.15} animationBegin={index * 100} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (40%) */}
        <div className="dashboard-right">
          {/* Quick AI Insight */}
          <div className="card" style={{ background: 'var(--bg-sidebar)', color: '#fff' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <Sparkles size={20} color="var(--accent-gold)" />
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>AI Financial Insight</h3>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.9 }}>
              Revenue has increased by 12.5% MoM, but raw material costs are rising faster. Consider renegotiating supplier contracts or optimizing inventory levels to maintain current net margins.
            </p>
            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--accent-gold)', fontWeight: 700, textTransform: 'uppercase' }}>
              Action recommended
            </div>
          </div>

          <ComplianceCalendar />

          {/* Activity Feed */}
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Live Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Today</div>
                {[
                  { desc: 'Payment received from Reliance Ind.', amount: '+₹1,45,000', time: '10:45 AM', type: 'credit' },
                  { desc: 'Electricity Bill Paid', amount: '-₹12,400', time: '09:20 AM', type: 'debit' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.desc}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.time}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.type === 'credit' ? 'var(--accent-teal)' : 'var(--accent-red)' }}>
                      {item.amount}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Yesterday</div>
                {[
                  { desc: 'Raw Material Purchase', amount: '-₹4,20,000', time: '04:30 PM', type: 'debit' },
                  { desc: 'GST Filing Confirmation', amount: 'N/A', time: '02:15 PM', type: 'neutral' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.desc}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.time}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.type === 'credit' ? 'var(--accent-teal)' : (item.type === 'debit' ? 'var(--accent-red)' : 'var(--text-primary)') }}>
                      {item.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
