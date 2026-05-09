import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function TrialBalance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/reports/trial-balance`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const fmt = v => v > 0 ? `₹${v.toLocaleString('en-IN', {maximumFractionDigits:0})}` : '—';

  const downloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Sharma Textiles Pvt Ltd', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Trial Balance for FY 2026', 105, 23, { align: 'center' });

    const rows = Object.entries(data.accounts).map(([name, vals]) => [
      name, fmt(vals.debit), fmt(vals.credit)
    ]);
    rows.push([
      {content: 'GRAND TOTAL', styles: {fontStyle:'bold', fillColor:[237,242,247]}},
      {content: fmt(data.total_debits), styles: {fontStyle:'bold', fillColor:[237,242,247]}},
      {content: fmt(data.total_credits), styles: {fontStyle:'bold', fillColor:[237,242,247]}}
    ]);

    doc.autoTable({
      startY: 30,
      head: [['Account Name', 'Debit (Dr)', 'Credit (Cr)']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [10, 22, 40] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      didDrawPage: d => {
        doc.setFontSize(8);
        doc.text(`Page ${d.pageNumber}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
      }
    });
    doc.save('Trial_Balance_2026.pdf');
  };

  if (loading) return <div className="loading">Loading Trial Balance</div>;
  if (!data) return null;

  return (
    <div className="report-container">
      <div className="report-header">
        <h2>Trial Balance</h2>
        <div className="btn-group">
          {data.is_balanced
            ? <span className="badge badge-success">✓ Balanced</span>
            : <span className="badge badge-danger">⚠ Check Entries</span>
          }
          <button className="btn btn-primary" onClick={downloadPDF}>⬇ Download PDF</button>
        </div>
      </div>

      <div className="report-company">
        <h3>Sharma Textiles Pvt Ltd</h3>
        <p>Trial Balance as at 31st December 2026</p>
      </div>

      <table className="acc-table">
        <thead>
          <tr>
            <th>Account Name</th>
            <th className="right" style={{width:150}}>Debit (Dr)</th>
            <th className="right" style={{width:150}}>Credit (Cr)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.accounts).map(([name, vals]) => (
            <tr key={name}>
              <td>{name}</td>
              <td className="right" style={{color: vals.debit > 0 ? 'var(--red)' : 'inherit'}}>
                {fmt(vals.debit)}
              </td>
              <td className="right" style={{color: vals.credit > 0 ? 'var(--green)' : 'inherit'}}>
                {fmt(vals.credit)}
              </td>
            </tr>
          ))}
          <tr className="total-row">
            <td>GRAND TOTAL</td>
            <td className="right">₹{data.total_debits.toLocaleString('en-IN')}</td>
            <td className="right">₹{data.total_credits.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default TrialBalance;
