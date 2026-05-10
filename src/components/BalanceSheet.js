import React, { useState, useEffect } from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { Layout, Columns, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

function BalanceSheet({ period }) {
  const [layout, setLayout] = useState(() => localStorage.getItem('ledgerai_bs_layout') || 'vertical');
  const [findings, setFindings] = useState([]);
  const data = LedgerEngine.calcBalanceSheet(period);

  useEffect(() => {
    localStorage.setItem('ledgerai_bs_layout', layout);
    const saved = localStorage.getItem('ledgerai-compliance-log');
    if (saved) setFindings(JSON.parse(saved));
  }, [layout]);

  const getIndicator = (ruleId) => {
    const finding = findings.find(f => f.id === ruleId && f.status === 'Unresolved');
    if (!finding) return null;
    return (
      <div className={`compliance-indicator ${finding.severity.toLowerCase()}`} title={`${finding.id}: ${finding.message}`} style={{ display: 'inline-flex', marginLeft: 8, color: finding.severity === 'ERROR' ? '#ef4444' : '#f59e0b' }}>
        <AlertCircle size={12} />
      </div>
    );
  };

  const Row = ({ label, value, isSubtotal, isTotal, indent, bold, negative, ruleId }) => (
    <tr className={`${isSubtotal ? 'subtotal' : ''} ${isTotal ? 'grand-total' : ''} ${bold ? 'bold-row' : ''}`}>
      <td style={{ paddingLeft: indent ? (indent === 2 ? 48 : 24) : 12 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {label}
          {getIndicator(ruleId)}
        </div>
      </td>
      <td className="right" style={{ color: negative ? '#ef4444' : 'inherit' }}>
        {value !== undefined ? (negative ? `(${formatINR(Math.abs(value))})` : formatINR(value)) : ""}
      </td>
    </tr>
  );

  const EquityLiabilities = () => (
    <table className="ca-table">
      <thead><tr><th>I. EQUITY AND LIABILITIES</th><th className="right">Amount (₹)</th></tr></thead>
      <tbody>
        <Row label="1. Shareholders' Funds" bold />
        <Row label="(a) Share Capital" value={data.equity.shareCapital} indent />
        <Row label="(b) Reserves and Surplus" value={data.equity.retainedEarnings} indent />
        <Row label="Sub-total: Shareholders' Funds" value={data.equity.shareCapital + data.equity.retainedEarnings} isSubtotal indent />
        
        <Row label="2. Non-Current Liabilities" bold />
        <Row label="(a) Long-Term Borrowings" value={data.liabilities.nonCurrent} indent ruleId="AS16-R001" />
        <Row label="Sub-total: Non-Current Liabilities" value={data.liabilities.nonCurrent} isSubtotal indent />

        <Row label="3. Current Liabilities" bold />
        <Row label="(a) Trade Payables" value={600000} indent />
        <Row label="(b) GST Payable" value={400000} indent />
        <Row label="(c) TDS Payable" value={50000} indent />
        <Row label="(d) Provision for Tax" value={150000} indent ruleId="AS22-R001" />
        <Row label="Sub-total: Current Liabilities" value={1200000} isSubtotal indent />

        <Row label="TOTAL EQUITY AND LIABILITIES" value={data.totalEquityLiabilities} isTotal ruleId="GEN-R001" />
      </tbody>
    </table>
  );

  const Assets = () => (
    <table className="ca-table">
      <thead><tr><th>II. ASSETS</th><th className="right">Amount (₹)</th></tr></thead>
      <tbody>
        <Row label="1. Non-Current Assets" bold />
        <Row label="(a) Fixed Assets" indent />
        <Row label="(i) Tangible Assets" value={7500000} indent={2} ruleId="AS10-R002" />
        <Row label="(ii) Accumulated Depreciation" value={1000000} indent={2} negative />
        <Row label="(iii) Net Block" value={6500000} indent={2} bold />
        <Row label="Sub-total: Non-Current Assets" value={6500000} isSubtotal indent />

        <Row label="2. Current Assets" bold />
        <Row label="(a) Inventories" value={1500000} indent ruleId="AS2-R002" />
        <Row label="(b) Trade Receivables" value={1200000} indent />
        <Row label="(c) Cash and Cash Equivalents" value={data.assets.current - 3500000} indent />
        <Row label="(d) Short-Term Loans and Advances" value={500000} indent />
        <Row label="(e) Other Current Assets" value={300000} indent />
        <Row label="Sub-total: Current Assets" value={data.assets.current} isSubtotal indent />

        <Row label="TOTAL ASSETS" value={data.totalAssets} isTotal ruleId="GEN-R001" />
      </tbody>
    </table>
  );

  return (
    <div className="card glass-card statement-card" style={{ maxWidth: layout === 'horizontal' ? 1200 : 800, margin: '0 auto', transition: 'all 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>Balance Sheet as at 31 March 2026</h2>
            {findings.some(f => f.id === 'GEN-R001' && f.status === 'Unresolved') && <AlertCircle size={20} color="#ef4444" />}
          </div>
          <h3 style={{ fontSize: 16, color: '#3b82f6', margin: '4px 0' }}>Sharma Textiles Pvt Ltd | MSME-MH-2024-001</h3>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>Schedule III Vertical Format | Values in ₹</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <button className="layout-toggle" onClick={() => setLayout(layout === 'vertical' ? 'horizontal' : 'vertical')}>
            {layout === 'vertical' ? <Columns size={16}/> : <Layout size={16}/>}
            {layout === 'vertical' ? 'Switch to Horizontal' : 'Switch to Vertical'}
          </button>
          {data.isBalanced ? (
            <span className="badge-balanced success"><CheckCircle2 size={14}/> Balanced</span>
          ) : (
            <span className="badge-balanced danger"><AlertTriangle size={14}/> Unbalanced</span>
          )}
        </div>
      </div>

      <div className={`bs-layout ${layout}`}>
        <div className="bs-section"><EquityLiabilities /></div>
        <div className="bs-section"><Assets /></div>
      </div>

      <style jsx>{`
        .layout-toggle { display: flex; align-items: center; gap: 8px; background: #1e293b; border: 1px solid #334155; color: #fff; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .bs-layout.vertical { display: flex; flex-direction: column; gap: 40px; }
        .bs-layout.horizontal { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .ca-table { width: 100%; border-collapse: collapse; }
        .ca-table th { text-align: left; padding: 12px; border-bottom: 2px solid #334155; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .ca-table td { padding: 10px 12px; font-size: 13px; color: #cbd5e1; }
        .right { text-align: right; }
        .subtotal { font-weight: 700; border-top: 1px solid #334155; }
        .grand-total td { font-weight: 800; color: #3b82f6 !important; border-top: 1px solid #3b82f6; border-bottom: 4px double #3b82f6; padding-top: 15px; padding-bottom: 15px; }
        .bold-row td { font-weight: 700; color: #fff; }
        .badge-balanced { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .badge-balanced.success { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2); }
        .badge-balanced.danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
      `}</style>
    </div>
  );
}

export default BalanceSheet;
