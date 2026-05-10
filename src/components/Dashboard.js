import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const initialPlData = [
  { day: 'Sun', income: 7000, expense: 5000 },
  { day: 'Mon', income: 11000, expense: 8000 },
  { day: 'Tue', income: 9000, expense: 12000 },
  { day: 'Wed', income: 16000, expense: 9000 },
  { day: 'Thu', income: 10000, expense: 11000 },
  { day: 'Fri', income: 18000, expense: 13000 },
  { day: 'Sat', income: 15000, expense: 10000 },
];

const initialCashFlowData = [
  { month: 'Feb', amount: 4000 },
  { month: 'Mar', amount: 8500 },
  { month: 'Apr', amount: 12000 },
  { month: 'May', amount: 10500 },
  { month: 'Jun', amount: 9000 },
  { month: 'Jul', amount: 18000 },
  { month: 'Aug', amount: 14000 },
];

function Dashboard() {
  const [plData, setPlData] = useState(initialPlData);
  const [cashData, setCashData] = useState(initialCashFlowData);
  const [timeFilter, setTimeFilter] = useState('Week');

  // Real-time data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPlData(prev => {
        const newData = [...prev];
        const lastIndex = newData.length - 1;
        newData[lastIndex] = {
          ...newData[lastIndex],
          income: newData[lastIndex].income + (Math.random() * 200 - 100),
          expense: newData[lastIndex].expense + (Math.random() * 200 - 100),
        };
        return newData;
      });
      setCashData(prev => {
        const newData = [...prev];
        const lastIndex = newData.length - 1;
        newData[lastIndex] = {
          ...newData[lastIndex],
          amount: newData[lastIndex].amount + (Math.random() * 200 - 100),
        };
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
      <div className="dash-header">
        <h1 className="dash-title">P&L Overview</h1>
        <div className="accounts-aggregator">
          <div className="aggregator-label">
            Connected Accounts<br/>Account Aggregator
          </div>
          <div className="account-pills">
            <div className="pill">Bank of America</div>
            <div className="pill">Chase</div>
            <div className="pill">HDFC Bank</div>
            <div className="pill">JPMorgan</div>
            <div className="pill primary">+ Add Bank</div>
          </div>
        </div>
      </div>

      <div className="filters-row">
        <div className="filter-group">
          {['Week', 'Month', 'Year', 'All Time'].map(f => (
            <button 
              key={f} 
              className={`filter-btn ${timeFilter === f ? 'active' : ''}`}
              onClick={() => setTimeFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="secondary-filters">
          <span>Today</span>
          <span>7d</span>
          <span>30d</span>
          <span>90d</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="charts-column">
          {/* Profit & Loss */}
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
                <AreaChart data={plData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
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
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 11}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 11}} tickFormatter={v => `$${v/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="expense" stroke="var(--accent-blue)" strokeWidth={3} fill="url(#gradExpense)" />
                  <Area type="monotone" dataKey="income" stroke="var(--accent-cyan)" strokeWidth={3} fill="url(#gradIncome)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cash Flow */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Cash Flow</h3>
            </div>
            <div style={{ height: 220, position: 'relative' }}>
              <div style={{
                position: 'absolute', right: '15%', top: '10%', background: '#fff', color: '#000', 
                padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', zIndex: 10,
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
              }}>
                ↑ $12,308
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashData} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 11}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 11}} tickFormatter={v => `$${v/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="amount" stroke="var(--accent-cyan)" strokeWidth={3} fill="url(#gradCash)" activeDot={{ r: 6, fill: 'var(--accent-cyan)', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Balance Sheet */}
        <div className="card">
          <h3 className="card-title" style={{marginBottom: 40}}>Balance Sheet</h3>
          <div className="bs-stat">
            <div className="bs-label">Total Assets</div>
            <div className="bs-value">$325,567.89</div>
          </div>
          <div className="bs-stat">
            <div className="bs-label">Total Liabilities</div>
            <div className="bs-value">$155,778.23</div>
          </div>
          <div className="bs-stat">
            <div className="bs-label">Net Worth</div>
            <div className="bs-value">$169,789.66</div>
          </div>
        </div>
      </div>

      <div className="card transactions-card">
        <h3 className="card-title" style={{marginBottom: 24}}>Recent Transactions</h3>
        <table className="modern-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>15/03/2025</td>
              <td>Office Rent</td>
              <td>Expense</td>
              <td style={{fontWeight: 600}}>- $2,500.00</td>
              <td>Rent</td>
              <td><div className="status-cell status-approved"><CheckCircle2 size={16}/> Approved</div></td>
              <td><a href="#" className="action-btn">View Details</a></td>
            </tr>
            <tr>
              <td>15/03/2025</td>
              <td>Payment from Client</td>
              <td>Income</td>
              <td style={{fontWeight: 600}}>+ $4,250.00</td>
              <td>Work</td>
              <td><div className="status-cell status-pending"><AlertCircle size={16}/> Pending</div></td>
              <td><a href="#" className="action-btn">View Details</a></td>
            </tr>
            <tr>
              <td>14/03/2025</td>
              <td>Software Subscriptions</td>
              <td>Expense</td>
              <td style={{fontWeight: 600}}>- $120.00</td>
              <td>Software</td>
              <td><div className="status-cell status-approved"><CheckCircle2 size={16}/> Approved</div></td>
              <td><a href="#" className="action-btn">View Details</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p style={{fontWeight: 700, marginBottom: 4}}>{payload[0].payload.day || payload[0].payload.month}</p>
        {payload.map((p, i) => (
          <p key={i} style={{color: p.color}}>{p.name}: ${p.value.toLocaleString()}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default Dashboard;
