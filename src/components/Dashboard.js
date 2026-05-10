import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const mockPlData = [
  { day: 'Sun', income: 10000, expense: 8000 },
  { day: 'Mon', income: 12000, expense: 9000 },
  { day: 'Tue', income: 9000, expense: 11000 },
  { day: 'Wed', income: 15000, expense: 8500 },
  { day: 'Thu', income: 11000, expense: 10000 },
  { day: 'Fri', income: 16000, expense: 12000 },
  { day: 'Sat', income: 14000, expense: 9000 },
];

const mockCashFlowData = [
  { month: 'Feb', amount: 5000 },
  { month: 'Mar', amount: 9000 },
  { month: 'Apr', amount: 11000 },
  { month: 'May', amount: 10000 },
  { month: 'Jun', amount: 8000 },
  { month: 'Jul', amount: 17000 },
  { month: 'Aug', amount: 12000 },
];

function Dashboard() {
  const [timeFilter, setTimeFilter] = useState('Week');
  
  return (
    <div>
      <div className="dash-header">
        <div>
          <h2 className="dash-title">P&L Overview</h2>
        </div>
        <div className="dash-accounts">
          <span>Connected Accounts<br/><small style={{opacity:0.6}}>Account Aggregator</small></span>
          <div className="account-pill">Bank of America</div>
          <div className="account-pill">Chase</div>
          <div className="account-pill">HDFC Bank</div>
          <div className="account-pill">JPMorgan</div>
          <div className="account-pill" style={{background: '#3b82f6', border: 'none'}}>+ Add Bank</div>
        </div>
      </div>

      <div style={{display:'flex', justifyContent:'space-between'}}>
        <div className="time-filters">
          {['Week', 'Month', 'Year', 'All Time'].map(f => (
            <button 
              key={f} 
              className={`time-pill ${timeFilter === f ? 'active' : ''}`}
              onClick={() => setTimeFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="time-filters">
          <span style={{fontSize: 13, color: 'var(--text-muted)', display:'flex', alignItems:'center', gap: 16}}>
            <span>Today</span>
            <span>7d</span>
            <span>30d</span>
            <span>90d</span>
          </span>
        </div>
      </div>

      <div className="dash-grid">
        <div className="charts-row">
          {/* Profit & Loss Chart */}
          <div className="glass-card">
            <h3 className="card-title">Profit & Loss</h3>
            <div className="chart-legend-top">
              <div><span className="legend-dot" style={{background:'#00e5ff'}}></span>Income</div>
              <div><span className="legend-dot" style={{background:'#3b82f6'}}></span>Expenses</div>
            </div>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <AreaChart data={mockPlData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#8899aa', fontSize: 11}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#8899aa', fontSize: 11}} tickFormatter={v => `$${v/1000}k`} />
                  <Tooltip contentStyle={{background: '#161b27', border: '1px solid #2d3748', borderRadius: 8}} />
                  <Area type="monotone" dataKey="expense" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  <Area type="monotone" dataKey="income" stroke="#00e5ff" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cash Flow Chart */}
          <div className="glass-card">
            <h3 className="card-title">Cash Flow</h3>
            <div style={{ width: '100%', height: 236, position: 'relative' }}>
               {/* Label simulation */}
               <div style={{position:'absolute', right: '20%', top: '10%', background:'white', color:'black', padding:'4px 8px', borderRadius:4, fontSize:12, fontWeight:600, zIndex:10}}>
                 ↑ $12,308
               </div>
              <ResponsiveContainer>
                <AreaChart data={mockCashFlowData} margin={{ top: 30, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#8899aa', fontSize: 11}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#8899aa', fontSize: 11}} tickFormatter={v => `$${v/1000}k`} />
                  <Tooltip contentStyle={{background: '#161b27', border: '1px solid #2d3748', borderRadius: 8}} />
                  <Area type="monotone" dataKey="amount" stroke="#00e5ff" strokeWidth={3} fillOpacity={1} fill="url(#colorCash)" activeDot={{r: 6, fill: '#00e5ff', stroke: 'white', strokeWidth: 2}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Balance Sheet Summary */}
        <div className="glass-card">
          <h3 className="card-title">Balance Sheet</h3>
          <div style={{marginTop: 32}}>
            <div className="bs-item">
              <div className="bs-label">Total Assets</div>
              <div className="bs-value">$325,567.89</div>
            </div>
            <div className="bs-item">
              <div className="bs-label">Total Liabilities</div>
              <div className="bs-value">$155,778.23</div>
            </div>
            <div className="bs-item">
              <div className="bs-label">Net Worth</div>
              <div className="bs-value">$169,789.66</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="glass-card">
        <h3 className="card-title">Recent Transactions</h3>
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
              <td style={{color: 'white'}}>- $2,500.00</td>
              <td>Rent</td>
              <td><span className="status-badge approved"><CheckCircle2 size={14}/> Approved</span></td>
              <td><a className="action-link">View Details</a></td>
            </tr>
            <tr>
              <td>15/03/2025</td>
              <td>Payment from Client</td>
              <td>Income</td>
              <td style={{color: 'white'}}>+ $4,250.00</td>
              <td>Work</td>
              <td><span className="status-badge pending"><AlertCircle size={14}/> Pending</span></td>
              <td><a className="action-link">View Details</a></td>
            </tr>
            <tr>
              <td>14/03/2025</td>
              <td>Software Subscriptions</td>
              <td>Expense</td>
              <td style={{color: 'white'}}>- $120.00</td>
              <td>Software</td>
              <td><span className="status-badge approved"><CheckCircle2 size={14}/> Approved</span></td>
              <td><a className="action-link">View Details</a></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Dashboard;
