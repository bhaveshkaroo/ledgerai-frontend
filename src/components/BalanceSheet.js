import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function BalanceSheet() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/reports/balance-sheet`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const columnStyle = {
    flex: 1,
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #eee'
  };

  if (loading) return <p>Loading Balance Sheet...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Balance Sheet</h2>
        {data.is_balanced ? (
          <span style={{ color: '#52c41a', fontWeight: 'bold' }}>Balanced ✓</span>
        ) : (
          <span style={{ color: '#f5222d', fontWeight: 'bold' }}>Unbalanced ⚠</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '30px' }}>
        {/* Assets Side */}
        <div style={columnStyle}>
          <h3 style={{ borderBottom: '2px solid #0A1628', paddingBottom: '10px' }}>Assets</h3>
          {Object.entries(data.assets).map(([name, val]) => (
            <div key={name} style={rowStyle}>
              <span>{name}</span>
              <span>₹{val.toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div style={{ ...rowStyle, borderBottom: 'none', fontWeight: 'bold', fontSize: '18px', marginTop: '20px' }}>
            <span>Total Assets</span>
            <span>₹{data.total_assets.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Liabilities & Equity Side */}
        <div style={columnStyle}>
          <h3 style={{ borderBottom: '2px solid #0A1628', paddingBottom: '10px' }}>Liabilities & Equity</h3>
          
          <p style={{ fontWeight: 'bold', color: '#666', margin: '15px 0 5px 0' }}>Liabilities</p>
          {Object.entries(data.liabilities).map(([name, val]) => (
            <div key={name} style={rowStyle}>
              <span>{name}</span>
              <span>₹{val.toLocaleString('en-IN')}</span>
            </div>
          ))}

          <p style={{ fontWeight: 'bold', color: '#666', margin: '15px 0 5px 0' }}>Equity</p>
          {Object.entries(data.equity).map(([name, val]) => (
            <div key={name} style={rowStyle}>
              <span>{name}</span>
              <span>₹{val.toLocaleString('en-IN')}</span>
            </div>
          ))}

          <div style={{ ...rowStyle, borderBottom: 'none', fontWeight: 'bold', fontSize: '18px', marginTop: '20px' }}>
            <span>Total Liabilities & Equity</span>
            <span>₹{data.total_liabilities_and_equity.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BalanceSheet;
