import React, { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function Dashboard() {
  const [pl, setPl] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/reports/pl`).then(r => r.json()),
      fetch(`${API}/reports/monthly-cashflow`).then(r => r.json())
    ])
    .then(([plData, monthlyData]) => {
      setPl(plData);
      setMonthly(monthlyData);
    })
    .catch(err => setError('Failed to connect to backend.'))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard</div>;
  if (error) return (
    <div className="card" style={{margin: 20, background:'#fff5f5', borderColor:'#fc8181'}}>
      <h3 style={{color:'#c53030', margin:'0 0 8px'}}>Connection Error</h3>
      <p>{error}</p>
    </div>
  );

  const fmt = v => v < 0
    ? `(₹${Math.abs(v).toLocaleString('en-IN')})`
    : `₹${v.toLocaleString('en-IN')}`;

  const maxVal = monthly
    ? Math.max(...monthly.map(m => Math.max(m.inflow, m.outflow, 1)))
    : 1;

  return (
    <div className="report-container">
      <div className="report-header"><h2>Dashboard</h2></div>

      {/* KPI Cards */}
      <div className="card-grid card-grid-3">
        <div className="card stat-card">
          <div className="label">Total Revenue</div>
          <div className="value positive">{fmt(pl.total_revenue)}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Total Expenses</div>
          <div className="value negative">{fmt(pl.total_expenses)}</div>
        </div>
        <div className="card stat-card">
          <div className="label">Net Profit</div>
          <div className={`value ${pl.net_profit >= 0 ? 'positive' : 'negative'}`}>
            {fmt(pl.net_profit)}
          </div>
        </div>
      </div>

      {/* Monthly Cash Flow Chart */}
      <div className="chart-container">
        <h3 className="chart-title">Monthly Cash Flow — FY 2026</h3>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <div className="chart-legend-dot" style={{background:'var(--green)'}}></div>
            <span>Inflow</span>
          </div>
          <div className="chart-legend-item">
            <div className="chart-legend-dot" style={{background:'var(--red)'}}></div>
            <span>Outflow</span>
          </div>
          <div className="chart-legend-item">
            <div className="chart-legend-dot" style={{background:'var(--blue)'}}></div>
            <span>Net</span>
          </div>
        </div>
        <div className="bar-chart">
          {monthly && monthly.map((m, i) => {
            const inflowH = Math.max((m.inflow / maxVal) * 200, 2);
            const outflowH = Math.max((m.outflow / maxVal) * 200, 2);
            const netAbs = Math.abs(m.net);
            const netH = Math.max((netAbs / maxVal) * 200, 2);
            const monthLabel = MONTH_NAMES[parseInt(m.month.split('-')[1]) - 1] || m.month;
            return (
              <div className="bar-group" key={m.month}>
                <div className="bar-pair">
                  <div className="bar bar-inflow" style={{height: inflowH}}>
                    <div className="bar-tooltip">In: {fmt(m.inflow)}</div>
                  </div>
                  <div className="bar bar-outflow" style={{height: outflowH}}>
                    <div className="bar-tooltip">Out: {fmt(m.outflow)}</div>
                  </div>
                  <div className="bar bar-net" style={{height: netH, opacity: m.net < 0 ? 0.6 : 1}}>
                    <div className="bar-tooltip">Net: {fmt(m.net)}</div>
                  </div>
                </div>
                <div className="bar-label">{monthLabel}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Summary Table */}
      {monthly && (
        <div style={{marginTop: 24}}>
          <table className="acc-table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="right">Inflow (Cr)</th>
                <th className="right">Outflow (Dr)</th>
                <th className="right">Net Movement</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map(m => (
                <tr key={m.month}>
                  <td>{MONTH_NAMES[parseInt(m.month.split('-')[1]) - 1]} 2026</td>
                  <td className="right" style={{color:'var(--green)'}}>{fmt(m.inflow)}</td>
                  <td className="right" style={{color:'var(--red)'}}>{fmt(m.outflow)}</td>
                  <td className="right" style={{fontWeight:600, color: m.net >= 0 ? 'var(--green)' : 'var(--red)'}}>
                    {fmt(m.net)}
                  </td>
                </tr>
              ))}
              <tr className="total-row">
                <td>TOTAL</td>
                <td className="right">{fmt(monthly.reduce((s,m) => s+m.inflow, 0))}</td>
                <td className="right">{fmt(monthly.reduce((s,m) => s+m.outflow, 0))}</td>
                <td className="right">{fmt(monthly.reduce((s,m) => s+m.net, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
