import React from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';

function BalanceSheet({ period }) {
  const data = LedgerEngine.calcBalanceSheet(period);

  const Row = ({ label, value, isSubtotal, isTotal, indent, bold }) => (
    <tr className={`${isSubtotal ? 'subtotal' : ''} ${isTotal ? 'grand-total' : ''} ${bold ? 'bold-row' : ''}`}>
      <td style={{ paddingLeft: indent ? 32 : 12 }}>{label}</td>
      <td className="right">{value !== "" ? formatINR(value) : ""}</td>
    </tr>
  );

  return (
    <div className="card glass-card statement-card">
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Balance Sheet as at 31 March 2026</h2>
        <h3 style={{ fontSize: 16, color: 'var(--accent-blue)', margin: '8px 0' }}>Sharma Textiles Pvt Ltd</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>(As per Schedule III of Companies Act 2013) | Period: {period}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        {data.isBalanced ? (
          <span className="badge-balanced success">✓ Balanced</span>
        ) : (
          <span className="badge-balanced danger">⚠ Unbalanced</span>
        )}
      </div>

      <div className="bs-grid">
        <div className="bs-column">
          <table className="ca-table">
            <thead>
              <tr><th>EQUITY AND LIABILITIES</th><th className="right">Amount (₹)</th></tr>
            </thead>
            <tbody>
              <Row label="(1) Shareholder's Funds" value="" bold />
              <Row label="Share Capital" value={data.equity.shareCapital} indent />
              <Row label="Reserves and Surplus" value={data.equity.retainedEarnings} indent />
              
              <Row label="(2) Non-Current Liabilities" value="" bold />
              <Row label="Long-term Borrowings" value={data.liabilities.nonCurrent} indent />
              
              <Row label="(3) Current Liabilities" value="" bold />
              <Row label="Trade Payables" value={1200000} indent />
              <Row label="Other Current Liabilities" value={800000} indent />
              
              <Row label="TOTAL EQUITY AND LIABILITIES" value={data.totalEquityLiabilities} isTotal />
            </tbody>
          </table>
        </div>

        <div className="bs-column">
          <table className="ca-table">
            <thead>
              <tr><th>ASSETS</th><th className="right">Amount (₹)</th></tr>
            </thead>
            <tbody>
              <Row label="(1) Non-Current Assets" value="" bold />
              <Row label="Property, Plant and Equipment" value={data.assets.nonCurrent} indent />
              <Row label="Intangible Assets" value={0} indent />
              
              <Row label="(2) Current Assets" value="" bold />
              <Row label="Inventories" value={1500000} indent />
              <Row label="Trade Receivables" value={1000000} indent />
              <Row label="Cash and Cash Equivalents" value={data.assets.current - 2500000} indent />
              <Row label="Other Current Assets" value={0} indent />
              
              <Row label="TOTAL ASSETS" value={data.totalAssets} isTotal />
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .bs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .ca-table { width: 100%; border-collapse: collapse; }
        .ca-table th { text-align: left; padding: 12px; border-bottom: 2px solid var(--border); color: var(--text-secondary); font-size: 13px; text-transform: uppercase; }
        .ca-table td { padding: 10px 12px; font-size: 13px; }
        .right { text-align: right; }
        .subtotal { font-weight: 700; border-top: 1px solid var(--border); }
        .grand-total { font-weight: 800; font-size: 14px !important; border-top: 2px solid var(--text-primary); border-bottom: 3px double var(--accent-cyan); color: var(--accent-cyan); }
        .bold-row { font-weight: 700; color: #fff; }
        .badge-balanced { padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .badge-balanced.success { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
        .badge-balanced.danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
      `}</style>
    </div>
  );
}

export default BalanceSheet;
