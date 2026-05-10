import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const LABELS = {
  net_profit_before_tax: 'Net Profit Before Tax',
  depreciation: 'Add: Depreciation & Amortization',
  interest_expense: 'Add: Interest Expense',
  interest_income: 'Less: Interest Income',
  bad_debts_provisions: 'Add: Bad Debts & Provisions',
  loss_on_assets: 'Add: Loss on Sale of Assets',
  profit_on_assets: 'Less: Profit on Sale of Assets',
  forex_adjustments: 'Add/(Less): Forex Adjustments',
  operating_profit_before_wc: 'Operating Profit before WC Changes',
  change_in_receivables: 'Increase/(Decrease) in Receivables',
  change_in_inventory: 'Increase/(Decrease) in Inventory',
  change_in_payables: 'Increase/(Decrease) in Payables',
  tax_paid: 'Less: Income Tax Paid',
  purchase_of_fixed_assets: 'Purchase of Fixed Assets',
  sale_of_fixed_assets: 'Sale of Fixed Assets',
  purchase_of_investments: 'Purchase of Investments',
  sale_of_investments: 'Sale / Redemption of Investments',
  interest_received: 'Interest Received',
  dividend_received: 'Dividend Received',
  share_capital_issued: 'Proceeds from Share Capital',
  share_buyback: 'Share Buyback / Redemption',
  loans_received: 'Loans / Debentures Received',
  loans_repaid: 'Loans / Debentures Repaid',
  interest_paid: 'Interest Paid',
  dividends_paid: 'Dividends Paid'
};

function CashFlowStatement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/reports/cashflow-as3`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const fmt = v => {
    if (v === 0) return '—';
    if (v < 0) return `(₹${Math.abs(v).toLocaleString('en-IN', {maximumFractionDigits:0})})`;
    return `₹${v.toLocaleString('en-IN', {maximumFractionDigits:0})}`;
  };

  const renderItems = (section, keys) => {
    return keys.map(key => {
      if (key === 'subtotal') return null;
      const val = section[key];
      if (val === undefined) return null;
      const isSubtotal = key.includes('operating_profit');
      return (
        <tr key={key} className={isSubtotal ? 'subtotal-row' : 'indent'}>
          <td>{LABELS[key] || key}</td>
          <td className="right" style={{
            color: val < 0 ? 'var(--red)' : val > 0 ? 'var(--green)' : 'inherit',
            fontWeight: isSubtotal ? 700 : 400
          }}>{fmt(val)}</td>
        </tr>
      );
    });
  };

  const downloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Sharma Textiles Pvt Ltd', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Cash Flow Statement for FY 2026', 105, 23, { align: 'center' });
    doc.setFontSize(9);
    doc.text('(As per AS-3 — Indirect Method)', 105, 29, { align: 'center' });

    const rows = [];
    const addSection = (title, section) => {
      rows.push([{content: title, colSpan: 2, styles: {fontStyle:'bold', fillColor:[10,22,40], textColor:[255,255,255]}}]);
      Object.entries(section).forEach(([k, v]) => {
        if (k === 'subtotal') {
          rows.push([{content: `Net Cash from ${title.split(':')[0].trim()}`, styles:{fontStyle:'bold', fillColor:[237,242,247]}}, {content: fmt(v), styles:{fontStyle:'bold', fillColor:[237,242,247]}}]);
        } else {
          rows.push([`  ${LABELS[k] || k}`, fmt(v)]);
        }
      });
    };

    addSection('A: Operating Activities', data.operating);
    rows.push([{content:'', colSpan:2}]);
    addSection('B: Investing Activities', data.investing);
    rows.push([{content:'', colSpan:2}]);
    addSection('C: Financing Activities', data.financing);
    rows.push([{content:'', colSpan:2}]);
    rows.push([{content:'Net Increase/(Decrease) in Cash', styles:{fontStyle:'bold'}}, {content: fmt(data.net_change), styles:{fontStyle:'bold'}}]);
    rows.push(['Opening Cash Balance', fmt(data.opening_cash)]);
    rows.push([{content:'Closing Cash Balance', styles:{fontStyle:'bold', fillColor:[198,246,213]}}, {content: fmt(data.closing_cash), styles:{fontStyle:'bold', fillColor:[198,246,213]}}]);

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
    doc.save('Cash_Flow_Statement_AS3_2026.pdf');
  };

  const downloadCSV = () => {
    if (!data) return;
    let csv = 'Section,Particulars,Amount\n';
    const addCSV = (section, name) => {
      Object.entries(data[section]).forEach(([k,v]) => {
        csv += `${name},"${LABELS[k] || k}",${v}\n`;
      });
    };
    addCSV('operating', 'Operating');
    addCSV('investing', 'Investing');
    addCSV('financing', 'Financing');
    csv += `Summary,Net Change,${data.net_change}\n`;
    csv += `Summary,Opening Cash,${data.opening_cash}\n`;
    csv += `Summary,Closing Cash,${data.closing_cash}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CashFlow_AS3_2026.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="loading">Loading Cash Flow Statement</div>;
  if (!data) return null;

  return (
    <div className="report-container">
      <div className="report-header">
        <h2>Cash Flow Statement</h2>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={downloadPDF}>⬇ PDF</button>
          <button className="btn btn-outline" onClick={downloadCSV}>⬇ Excel/CSV</button>
        </div>
      </div>

      <div className="report-company">
        <h3>Sharma Textiles Pvt Ltd</h3>
        <p>Cash Flow Statement for FY 2026 (As per AS-3 — Indirect Method)</p>
      </div>

      <table className="acc-table">
        <thead>
          <tr>
            <th>Particulars</th>
            <th className="right" style={{width:160}}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {/* Operating Activities */}
          <tr className="section-header">
            <td colSpan={2}>A. Cash Flow from Operating Activities</td>
          </tr>
          {renderItems(data.operating, [
            'net_profit_before_tax', 'depreciation', 'interest_expense',
            'interest_income', 'bad_debts_provisions', 'loss_on_assets',
            'profit_on_assets', 'forex_adjustments', 'operating_profit_before_wc',
            'change_in_receivables', 'change_in_inventory', 'change_in_payables',
            'tax_paid'
          ])}
          <tr className="subtotal-row">
            <td style={{fontWeight:700}}>Net Cash from Operating Activities</td>
            <td className="right" style={{fontWeight:700, color: data.operating.subtotal >= 0 ? 'var(--green)' : 'var(--red)'}}>
              {fmt(data.operating.subtotal)}
            </td>
          </tr>

          {/* Investing Activities */}
          <tr className="section-header">
            <td colSpan={2}>B. Cash Flow from Investing Activities</td>
          </tr>
          {renderItems(data.investing, [
            'purchase_of_fixed_assets', 'sale_of_fixed_assets',
            'purchase_of_investments', 'sale_of_investments',
            'interest_received', 'dividend_received'
          ])}
          <tr className="subtotal-row">
            <td style={{fontWeight:700}}>Net Cash from Investing Activities</td>
            <td className="right" style={{fontWeight:700, color: data.investing.subtotal >= 0 ? 'var(--green)' : 'var(--red)'}}>
              {fmt(data.investing.subtotal)}
            </td>
          </tr>

          {/* Financing Activities */}
          <tr className="section-header">
            <td colSpan={2}>C. Cash Flow from Financing Activities</td>
          </tr>
          {renderItems(data.financing, [
            'share_capital_issued', 'share_buyback',
            'loans_received', 'loans_repaid',
            'interest_paid', 'dividends_paid'
          ])}
          <tr className="subtotal-row">
            <td style={{fontWeight:700}}>Net Cash from Financing Activities</td>
            <td className="right" style={{fontWeight:700, color: data.financing.subtotal >= 0 ? 'var(--green)' : 'var(--red)'}}>
              {fmt(data.financing.subtotal)}
            </td>
          </tr>

          {/* Summary */}
          <tr><td colSpan={2} style={{padding:4}}></td></tr>
          <tr className="total-row">
            <td>Net Increase / (Decrease) in Cash</td>
            <td className="right">{fmt(data.net_change)}</td>
          </tr>
          <tr className="indent">
            <td>Opening Cash & Cash Equivalents</td>
            <td className="right">{fmt(data.opening_cash)}</td>
          </tr>
          <tr className="total-row" style={{background:'var(--badge-success-bg)'}}>
            <td style={{fontSize:16}}>Closing Cash & Cash Equivalents</td>
            <td className="right" style={{fontSize:16}}>{fmt(data.closing_cash)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CashFlowStatement;
