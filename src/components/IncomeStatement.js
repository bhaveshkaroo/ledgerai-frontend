import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Sharma Textiles Pvt Ltd", 14, 15);
    doc.setFontSize(12);
    doc.text("Income Statement", 14, 22);

    const rows = [
      ['Total Revenue', data.revenue.toLocaleString('en-IN')],
      ['Cost of Goods Sold', `(${data.cogs.toLocaleString('en-IN')})`],
      [{ content: 'GROSS PROFIT', styles: { fontStyle: 'bold' } }, { content: data.gross_profit.toLocaleString('en-IN'), styles: { fontStyle: 'bold' } }],
      ['Operating Expenses', `(${data.operating_expenses.toLocaleString('en-IN')})`],
      [{ content: 'OPERATING PROFIT (EBIT)', styles: { fontStyle: 'bold' } }, { content: data.ebit.toLocaleString('en-IN'), styles: { fontStyle: 'bold' } }],
      ['Finance Costs', `(${data.finance_costs.toLocaleString('en-IN')})`],
      [{ content: 'PROFIT BEFORE TAX', styles: { fontStyle: 'bold' } }, { content: data.pbt.toLocaleString('en-IN'), styles: { fontStyle: 'bold' } }],
      ['Income Tax Expense', `(${data.tax.toLocaleString('en-IN')})`],
      [{ content: 'NET PROFIT AFTER TAX', styles: { fontStyle: 'bold', fillColor: [230, 247, 255] } }, { content: data.net_profit.toLocaleString('en-IN'), styles: { fontStyle: 'bold', fillColor: [230, 247, 255] } }]
    ];

    doc.autoTable({
      startY: 30,
      head: [['Particulars', 'Amount (Rs.)']],
      body: rows,
    });

    doc.save("Income_Statement.pdf");
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>Income Statement</h2>
        <button 
          onClick={downloadPDF}
          style={{ backgroundColor: '#0A1628', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Download PDF
        </button>
      </div>
      
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
