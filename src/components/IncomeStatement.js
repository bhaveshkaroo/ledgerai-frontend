import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function IncomeStatement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/reports/income-statement`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const containerStyle = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    maxWidth: '800px',
    margin: '0 auto'
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0'
  };

  const subtotalStyle = {
    ...rowStyle,
    fontWeight: 'bold',
    borderBottom: '2px solid #333',
    backgroundColor: '#fdfdfd'
  };

  if (loading) return <p>Loading Income Statement...</p>;

  const format = (val) => val < 0 ? `(₹${Math.abs(val).toLocaleString('en-IN')})` : `₹${val.toLocaleString('en-IN')}`;

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Income Statement</h2>
      
      <div style={rowStyle}>
        <span>Total Revenue</span>
        <span>{format(data.revenue)}</span>
      </div>
      
      <div style={rowStyle}>
        <span>Cost of Goods Sold (COGS)</span>
        <span>{format(-data.cogs)}</span>
      </div>

      <div style={subtotalStyle}>
        <span>GROSS PROFIT <small style={{ color: '#888', fontWeight: 'normal' }}>({data.margins.gross.toFixed(1)}%)</small></span>
        <span>{format(data.gross_profit)}</span>
      </div>

      <div style={rowStyle}>
        <span>Operating Expenses</span>
        <span>{format(-data.operating_expenses)}</span>
      </div>

      <div style={subtotalStyle}>
        <span>OPERATING PROFIT (EBIT)</span>
        <span>{format(data.ebit)}</span>
      </div>

      <div style={rowStyle}>
        <span>Finance Costs (Interest & Bank Charges)</span>
        <span>{format(-data.finance_costs)}</span>
      </div>

      <div style={subtotalStyle}>
        <span>PROFIT BEFORE TAX (PBT)</span>
        <span>{format(data.pbt)}</span>
      </div>

      <div style={rowStyle}>
        <span>Income Tax Expense (25%)</span>
        <span>{format(-data.tax)}</span>
      </div>

      <div style={{ ...subtotalStyle, fontSize: '20px', backgroundColor: '#e6f7ff' }}>
        <span>NET PROFIT AFTER TAX <small style={{ color: '#888', fontWeight: 'normal' }}>({data.margins.net.toFixed(1)}%)</small></span>
        <span>{format(data.net_profit)}</span>
      </div>
    </div>
  );
}

export default IncomeStatement;
