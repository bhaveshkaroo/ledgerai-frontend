import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function TrialBalance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/reports/trial-balance`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const thStyle = {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #333',
    backgroundColor: '#eee'
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #ddd'
  };

  if (loading) return <p>Loading Trial Balance...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Trial Balance</h2>
        {data.is_balanced ? (
          <span style={{ backgroundColor: '#52c41a', color: 'white', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
            Balanced ✓
          </span>
        ) : (
          <span style={{ backgroundColor: '#f5222d', color: 'white', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
            Check Entries ⚠
          </span>
        )}
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Account Name</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Debit (Dr)</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Credit (Cr)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.accounts).map(([name, vals]) => (
            <tr key={name}>
              <td style={tdStyle}>{name}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>
                {vals.debit > 0 ? `₹${vals.debit.toLocaleString('en-IN')}` : '-'}
              </td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>
                {vals.credit > 0 ? `₹${vals.credit.toLocaleString('en-IN')}` : '-'}
              </td>
            </tr>
          ))}
          <tr style={{ fontWeight: 'bold', backgroundColor: '#fafafa' }}>
            <td style={tdStyle}>GRAND TOTAL</td>
            <td style={{ ...tdStyle, textAlign: 'right', borderTop: '2px solid #333' }}>
              ₹{data.total_debits.toLocaleString('en-IN')}
            </td>
            <td style={{ ...tdStyle, textAlign: 'right', borderTop: '2px solid #333' }}>
              ₹{data.total_credits.toLocaleString('en-IN')}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default TrialBalance;
