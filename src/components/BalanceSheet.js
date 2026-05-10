import React from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';

function BalanceSheet({ period }) {
  const data = LedgerEngine.calcBalanceSheet(period);

  const Row = ({ label, value, isTotal, isGrandTotal, indent, isSection, negative }) => (
    <tr style={{ backgroundColor: isSection ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
      <td className={indent === 2 ? 'indent-2' : (indent === 1 ? 'indent-1' : '')} style={{ fontSize: isGrandTotal ? 16 : 14, fontWeight: (isTotal || isGrandTotal || isSection) ? 700 : 400 }}>
        {label}
      </td>
      <td className={`align-right mono ${negative ? 'negative-amount' : ''} ${(isTotal || isGrandTotal) ? (isGrandTotal ? 'grand-total' : 'section-total') : ''}`} style={{ fontSize: isGrandTotal ? 16 : 14 }}>
        {value === undefined ? "" : (negative ? `(₹${formatINR(Math.abs(value))})` : `₹${formatINR(value)}`)}
      </td>
    </tr>
  );

  return (
    <div className="statement-document animate-fade-in">
      <div className="document-header">
        <h1 className="company-name heading-serif">Sharma Textiles Pvt Ltd</h1>
        <h2 className="statement-name">Balance Sheet</h2>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          As at 31 March 2026 | Registration: MSME-MH-2024-001
        </div>
      </div>
      
      <div className="double-line"></div>
      
      <table className="accounting-table">
        <tbody>
          <Row label="I. EQUITY AND LIABILITIES" value="" isSection />
          <Row label="1. Shareholders' Funds" value="" indent={1} />
          <Row label="(a) Share Capital" value={data.equity.shareCapital} indent={2} />
          <Row label="(b) Reserves and Surplus" value={data.equity.retainedEarnings} indent={2} />
          <Row label="Sub-total: Shareholders' Funds" value={data.equity.shareCapital + data.equity.retainedEarnings} isTotal indent={1} />
          
          <Row label="2. Non-Current Liabilities" value="" indent={1} />
          <Row label="(a) Long-Term Borrowings" value={data.liabilities.nonCurrent} indent={2} />
          <Row label="Sub-total: Non-Current Liabilities" value={data.liabilities.nonCurrent} isTotal indent={1} />

          <Row label="3. Current Liabilities" value="" indent={1} />
          <Row label="(a) Trade Payables" value={600000} indent={2} />
          <Row label="(b) Other Current Liabilities" value={600000} indent={2} />
          <Row label="Sub-total: Current Liabilities" value={1200000} isTotal indent={1} />

          <Row label="TOTAL EQUITY AND LIABILITIES" value={data.totalEquityLiabilities} isGrandTotal />

          <tr style={{ height: 40 }}><td></td><td></td></tr>

          <Row label="II. ASSETS" value="" isSection />
          <Row label="1. Non-Current Assets" value="" indent={1} />
          <Row label="(a) Fixed Assets (Net Block)" value={6500000} indent={2} />
          <Row label="Sub-total: Non-Current Assets" value={6500000} isTotal indent={1} />

          <Row label="2. Current Assets" value="" indent={1} />
          <Row label="(a) Inventories" value={1500000} indent={2} />
          <Row label="(b) Trade Receivables" value={1200000} indent={2} />
          <Row label="(c) Cash and Cash Equivalents" value={data.assets.current - 3500000} indent={2} />
          <Row label="(d) Other Current Assets" value={800000} indent={2} />
          <Row label="Sub-total: Current Assets" value={data.assets.current} isTotal indent={1} />

          <Row label="TOTAL ASSETS" value={data.totalAssets} isGrandTotal />
        </tbody>
      </table>
      
      <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
        <div style={{ borderTop: '1px solid #000', width: 150, textAlign: 'center', paddingTop: 8 }}>Director</div>
        <div style={{ borderTop: '1px solid #000', width: 150, textAlign: 'center', paddingTop: 8 }}>Chartered Accountant</div>
      </div>
    </div>
  );
}

export default BalanceSheet;
