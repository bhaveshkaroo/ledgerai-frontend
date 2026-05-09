import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function BalanceSheet() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({
    shareholders: true, borrowings: true, current_liab: true,
    provisions: true, fixed: true, non_current: true, current_assets: true
  });

  useEffect(() => {
    fetch(`${API}/reports/balance-sheet-detailed`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const fmt = v => {
    if (v === 0) return '—';
    if (v < 0) return `(₹${Math.abs(v).toLocaleString('en-IN', {maximumFractionDigits:0})})`;
    return `₹${v.toLocaleString('en-IN', {maximumFractionDigits:0})}`;
  };

  const toggle = key => setExpanded(prev => ({...prev, [key]: !prev[key]}));

  const sectionSum = obj => Object.values(obj).reduce((s, v) => s + v, 0);

  const downloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Sharma Textiles Pvt Ltd', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Balance Sheet as at 31st December 2026', 105, 23, { align: 'center' });
    doc.setFontSize(9);
    doc.text('(As per Indian Accounting Standards)', 105, 29, { align: 'center' });

    const rows = [];
    const eq = data.equity_and_liabilities;
    rows.push([{content:'I. EQUITY & LIABILITIES', colSpan:2, styles:{fontStyle:'bold', fillColor:[10,22,40], textColor:[255,255,255]}}]);
    rows.push([{content:'(1) Shareholders\' Funds', styles:{fontStyle:'bold'}}, '']);
    Object.entries(eq.shareholders_funds).forEach(([k,v]) => rows.push([`    ${k}`, fmt(v)]));
    rows.push([{content:'(2) Long-Term Borrowings', styles:{fontStyle:'bold'}}, '']);
    Object.entries(eq.long_term_borrowings).forEach(([k,v]) => rows.push([`    ${k}`, fmt(v)]));
    rows.push([{content:'(3) Current Liabilities', styles:{fontStyle:'bold'}}, '']);
    Object.entries(eq.current_liabilities).forEach(([k,v]) => rows.push([`    ${k}`, fmt(v)]));
    rows.push([{content:'(4) Provisions', styles:{fontStyle:'bold'}}, '']);
    Object.entries(eq.provisions).forEach(([k,v]) => rows.push([`    ${k}`, fmt(v)]));
    rows.push([{content:'TOTAL EQUITY & LIABILITIES', styles:{fontStyle:'bold', fillColor:[237,242,247]}}, {content:fmt(data.total_equity_liabilities), styles:{fontStyle:'bold', fillColor:[237,242,247]}}]);

    rows.push([{content:'', colSpan:2}]);
    const as = data.assets;
    rows.push([{content:'II. ASSETS', colSpan:2, styles:{fontStyle:'bold', fillColor:[10,22,40], textColor:[255,255,255]}}]);
    rows.push([{content:'(1) Fixed Assets', styles:{fontStyle:'bold'}}, '']);
    Object.entries(as.fixed_assets).forEach(([k,v]) => rows.push([`    ${k}`, fmt(v)]));
    rows.push([{content:'(2) Non-Current Assets', styles:{fontStyle:'bold'}}, '']);
    Object.entries(as.non_current_assets).forEach(([k,v]) => rows.push([`    ${k}`, fmt(v)]));
    rows.push([{content:'(3) Current Assets', styles:{fontStyle:'bold'}}, '']);
    Object.entries(as.current_assets).forEach(([k,v]) => rows.push([`    ${k}`, fmt(v)]));
    rows.push([{content:'TOTAL ASSETS', styles:{fontStyle:'bold', fillColor:[237,242,247]}}, {content:fmt(data.total_assets), styles:{fontStyle:'bold', fillColor:[237,242,247]}}]);

    doc.autoTable({
      startY: 35,
      head: [['Particulars', 'Amount (₹)']],
      body: rows,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [10, 22, 40] },
      columnStyles: { 1: { halign: 'right' } },
      didDrawPage: d => {
        doc.setFontSize(8);
        doc.text(`Page ${d.pageNumber}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
      }
    });
    doc.save('Balance_Sheet_2026.pdf');
  };

  if (loading) return <div className="loading">Loading Balance Sheet</div>;
  if (!data) return null;

  const eq = data.equity_and_liabilities;
  const as = data.assets;

  const renderSection = (title, key, items, total) => (
    <>
      <tr className="sub-header">
        <td
          className={`expandable ${expanded[key] ? 'open' : ''}`}
          onClick={() => toggle(key)}
        >{title}</td>
        <td className="right" style={{fontWeight:600}}>{fmt(total)}</td>
      </tr>
      {expanded[key] && Object.entries(items).map(([name, val]) => (
        val !== 0 && <tr key={name} className="indent">
          <td>{name}</td>
          <td className="right">{fmt(val)}</td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="report-container">
      <div className="report-header">
        <h2>Balance Sheet</h2>
        <div className="btn-group">
          {data.is_balanced
            ? <span className="badge badge-success">✓ Balanced</span>
            : <span className="badge badge-danger">⚠ Unbalanced</span>
          }
          <button className="btn btn-primary" onClick={downloadPDF}>⬇ Download PDF</button>
        </div>
      </div>

      <div className="report-company">
        <h3>Sharma Textiles Pvt Ltd</h3>
        <p>Balance Sheet as at 31st December 2026 (As per Indian Accounting Standards)</p>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24}}>
        {/* Equity & Liabilities */}
        <div>
          <table className="acc-table">
            <thead>
              <tr>
                <th>Equity & Liabilities</th>
                <th className="right" style={{width:140}}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {renderSection("(1) Shareholders' Funds", 'shareholders', eq.shareholders_funds, sectionSum(eq.shareholders_funds))}
              {renderSection("(2) Long-Term Borrowings", 'borrowings', eq.long_term_borrowings, sectionSum(eq.long_term_borrowings))}
              {renderSection("(3) Current Liabilities", 'current_liab', eq.current_liabilities, sectionSum(eq.current_liabilities))}
              {renderSection("(4) Provisions", 'provisions', eq.provisions, sectionSum(eq.provisions))}
              <tr className="total-row">
                <td>TOTAL EQUITY & LIABILITIES</td>
                <td className="right">{fmt(data.total_equity_liabilities)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Assets */}
        <div>
          <table className="acc-table">
            <thead>
              <tr>
                <th>Assets</th>
                <th className="right" style={{width:140}}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {renderSection("(1) Fixed Assets", 'fixed', as.fixed_assets, as.fixed_assets['Net Fixed Assets'])}
              {renderSection("(2) Non-Current Assets", 'non_current', as.non_current_assets, sectionSum(as.non_current_assets))}
              {renderSection("(3) Current Assets", 'current_assets', as.current_assets, sectionSum(as.current_assets))}
              <tr className="total-row">
                <td>TOTAL ASSETS</td>
                <td className="right">{fmt(data.total_assets)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BalanceSheet;
