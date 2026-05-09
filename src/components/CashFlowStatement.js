import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function CashFlowStatement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/reports/cashflow-statement`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const sectionStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0'
  };

  if (loading) return <p>Loading Cash Flow Statement...</p>;

  return (
    <div>
      <h2>Cash Flow Statement</h2>

      {/* Operating Section */}
      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0, color: '#0A1628' }}>1. Operating Activities</h3>
        {Object.entries(data.operating).map(([name, val]) => name !== 'subtotal' && (
          <div key={name} style={rowStyle}>
            <span>{name}</span>
            <span style={{ color: val < 0 ? 'red' : 'green' }}>
              {val < 0 ? `(₹${Math.abs(val).toLocaleString('en-IN')})` : `₹${val.toLocaleString('en-IN')}`}
            </span>
          </div>
        ))}
        <div style={{ ...rowStyle, borderBottom: 'none', fontWeight: 'bold', paddingTop: '15px' }}>
          <span>Net Cash from Operating Activities</span>
          <span>₹{data.operating.subtotal.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Financing Section */}
      <div style={sectionStyle}>
        <h3 style={{ marginTop: 0, color: '#0A1628' }}>2. Financing Activities</h3>
        {Object.entries(data.financing).map(([name, val]) => name !== 'subtotal' && (
          <div key={name} style={rowStyle}>
            <span>{name}</span>
            <span style={{ color: val < 0 ? 'red' : 'green' }}>
              {val < 0 ? `(₹${Math.abs(val).toLocaleString('en-IN')})` : `₹${val.toLocaleString('en-IN')}`}
            </span>
          </div>
        ))}
        <div style={{ ...rowStyle, borderBottom: 'none', fontWeight: 'bold', paddingTop: '15px' }}>
          <span>Net Cash from Financing Activities</span>
          <span>(₹{Math.abs(data.financing.subtotal).toLocaleString('en-IN')})</span>
        </div>
      </div>

      {/* Totals */}
      <div style={{ ...sectionStyle, backgroundColor: '#0A1628', color: 'white' }}>
        <div style={rowStyle}>
          <span>Net Change in Cash</span>
          <span style={{ fontWeight: 'bold' }}>₹{data.net_change.toLocaleString('en-IN')}</span>
        </div>
        <div style={{ ...rowStyle, borderBottom: 'none', fontSize: '20px', fontWeight: 'bold', marginTop: '10px' }}>
          <span>Closing Cash Balance</span>
          <span>₹{data.closing_cash.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}

export default CashFlowStatement;
