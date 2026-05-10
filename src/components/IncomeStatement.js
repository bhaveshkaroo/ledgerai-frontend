import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function IncomeStatement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/reports/income-statement`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const fmt = v => {
    if (v === 0) return '—';
    if (v < 0) return `(₹${Math.abs(v).toLocaleString('en-IN', {maximumFractionDigits:0})})`;
    return `₹${v.toLocaleString('en-IN', {maximumFractionDigits:0})}`;
  };

  const downloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Sharma Textiles Pvt Ltd', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Statement of Profit & Loss for FY 2026', 105, 23, { align: 'center' });

    const rows = [
      ['Total Revenue', fmt(data.revenue)],
      ['Less: Cost of Goods Sold', fmt(-data.cogs)],
      [{content:'GROSS PROFIT', styles:{fontStyle:'bold', fillColor:[237,242,247]}}, {content:`${fmt(data.gross_profit)}  (${data.margins.gross}%)`, styles:{fontStyle:'bold', fillColor:[237,242,247]}}],
      ['Less: Operating Expenses', fmt(-data.operating_expenses)],
      [{content:'OPERATING PROFIT (EBIT)', styles:{fontStyle:'bold', fillColor:[237,242,247]}}, {content:fmt(data.ebit), styles:{fontStyle:'bold', fillColor:[237,242,247]}}],
      ['Less: Finance Costs', fmt(-data.finance_costs)],
      [{content:'PROFIT BEFORE TAX (PBT)', styles:{fontStyle:'bold', fillColor:[237,242,247]}}, {content:fmt(data.pbt), styles:{fontStyle:'bold', fillColor:[237,242,247]}}],
      ['Less: Income Tax Expense', fmt(-data.tax)],
      [{content:'NET PROFIT AFTER TAX', styles:{fontStyle:'bold', fillColor:[198,246,213]}}, {content:`${fmt(data.net_profit)}  (${data.margins.net}%)`, styles:{fontStyle:'bold', fillColor:[198,246,213]}}]
    ];

    doc.autoTable({
      startY: 30,
      head: [['Particulars', 'Amount (₹)']],
      body: rows,
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [10, 22, 40] },
      columnStyles: { 1: { halign: 'right' } },
      didDrawPage: d => {
        doc.setFontSize(8);
        doc.text(`Page ${d.pageNumber}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
      }
    });
    doc.save('Income_Statement_2026.pdf');
  };

  const downloadCSV = () => {
    if (!data) return;
    const csv = `Particulars,Amount
Revenue,${data.revenue}
COGS,${data.cogs}
Gross Profit,${data.gross_profit}
Operating Expenses,${data.operating_expenses}
EBIT,${data.ebit}
Finance Costs,${data.finance_costs}
PBT,${data.pbt}
Tax,${data.tax}
Net Profit,${data.net_profit}
Gross Margin %,${data.margins.gross}
Net Margin %,${data.margins.net}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Income_Statement_2026.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="loading">Loading Income Statement</div>;
  if (!data) return null;

  return (
    <div className="report-container" style={{maxWidth:800}}>
      <div className="report-header">
        <h2>Income Statement</h2>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={downloadPDF}>⬇ PDF</button>
          <button className="btn btn-outline" onClick={downloadCSV}>⬇ Excel/CSV</button>
        </div>
      </div>

      <div className="report-company">
        <h3>Sharma Textiles Pvt Ltd</h3>
        <p>Statement of Profit & Loss for FY 2026</p>
      </div>

      <table className="acc-table">
        <thead>
          <tr>
            <th>Particulars</th>
            <th className="right" style={{width:180}}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="indent">
            <td>Total Revenue (Sales + Exports)</td>
            <td className="right" style={{color:'var(--green)'}}>{fmt(data.revenue)}</td>
          </tr>
          <tr className="indent">
            <td>Less: Cost of Goods Sold (COGS)</td>
            <td className="right" style={{color:'var(--red)'}}>{fmt(-data.cogs)}</td>
          </tr>
          <tr className="subtotal-row">
            <td>GROSS PROFIT <span style={{color:'var(--text-muted)', fontWeight:400, fontSize:12}}>({data.margins.gross}%)</span></td>
            <td className="right">{fmt(data.gross_profit)}</td>
          </tr>
          <tr className="indent">
            <td>Less: Operating Expenses</td>
            <td className="right" style={{color:'var(--red)'}}>{fmt(-data.operating_expenses)}</td>
          </tr>
          <tr className="subtotal-row">
            <td>OPERATING PROFIT (EBIT)</td>
            <td className="right">{fmt(data.ebit)}</td>
          </tr>
          <tr className="indent">
            <td>Less: Finance Costs (Interest & Bank Charges)</td>
            <td className="right" style={{color:'var(--red)'}}>{fmt(-data.finance_costs)}</td>
          </tr>
          <tr className="subtotal-row">
            <td>PROFIT BEFORE TAX (PBT)</td>
            <td className="right">{fmt(data.pbt)}</td>
          </tr>
          <tr className="indent">
            <td>Less: Income Tax Expense</td>
            <td className="right" style={{color:'var(--red)'}}>{fmt(-data.tax)}</td>
          </tr>
          <tr className="total-row" style={{background: data.net_profit >= 0 ? 'var(--badge-success-bg)' : 'var(--badge-danger-bg)'}}>
            <td style={{fontSize:16}}>
              NET PROFIT AFTER TAX
              <span style={{color:'var(--text-muted)', fontWeight:400, fontSize:13, marginLeft:8}}>
                ({data.margins.net}% net margin)
              </span>
            </td>
            <td className="right" style={{fontSize:18}}>{fmt(data.net_profit)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default IncomeStatement;
