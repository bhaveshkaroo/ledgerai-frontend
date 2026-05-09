import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Sharma Textiles Pvt Ltd", 14, 15);
    doc.setFontSize(12);
    doc.text("Balance Sheet", 14, 22);

    const assetsRows = Object.entries(data.assets).map(([n, v]) => [n, `Rs. ${v.toLocaleString('en-IN')}`]);
    assetsRows.push([{ content: 'Total Assets', styles: { fontStyle: 'bold' } }, { content: `Rs. ${data.total_assets.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } }]);

    const liabilitiesRows = Object.entries(data.liabilities).map(([n, v]) => [n, `Rs. ${v.toLocaleString('en-IN')}`]);
    liabilitiesRows.push(['Equity', '']);
    Object.entries(data.equity).forEach(([n, v]) => liabilitiesRows.push([n, `Rs. ${v.toLocaleString('en-IN')}`]));
    liabilitiesRows.push([{ content: 'Total Liabilities & Equity', styles: { fontStyle: 'bold' } }, { content: `Rs. ${data.total_liabilities_and_equity.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } }]);

    doc.autoTable({
      startY: 30,
      head: [['Assets', 'Amount']],
      body: assetsRows,
    });

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Liabilities & Equity', 'Amount']],
      body: liabilitiesRows,
    });

    doc.save("Balance_Sheet.pdf");
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={downloadPDF}
            style={{ backgroundColor: '#0A1628', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Download PDF
          </button>
          {data.is_balanced ? (
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>Balanced ✓</span>
          ) : (
            <span style={{ color: '#f5222d', fontWeight: 'bold' }}>Unbalanced ⚠</span>
          )}
        </div>
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
