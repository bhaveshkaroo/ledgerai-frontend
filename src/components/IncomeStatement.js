import React, { useState, useEffect } from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { AlertCircle } from 'lucide-react';

function IncomeStatement({ period }) {
  const data = LedgerEngine.calcIncomeStatement(period);
  const [findings, setFindings] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('ledgerai-compliance-log');
    if (saved) setFindings(JSON.parse(saved));
  }, []);

  const getIndicator = (ruleId) => {
    const finding = findings.find(f => f.id === ruleId && f.status === 'Unresolved');
    if (!finding) return null;
    return (
      <div className={`compliance-indicator ${finding.severity.toLowerCase()}`} title={`${finding.id}: ${finding.message}`}>
        <AlertCircle size={12} />
      </div>
    );
  };

  const Row = ({ label, value, isSubtotal, isTotal, indent, margin, ruleId }) => (
    <tr className={`${isSubtotal ? 'subtotal' : ''} ${isTotal ? 'grand-total' : ''}`}>
      <td style={{ paddingLeft: indent ? 32 : 12, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {label}
          {getIndicator(ruleId)}
          {margin !== undefined && <span className="margin-pct">({margin.toFixed(1)}%)</span>}
        </div>
      </td>
      <td className="right">{value < 0 ? `(${formatINR(Math.abs(value))})` : formatINR(value)}</td>
    </tr>
  );

  return (
    <div className="card glass-card statement-card">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Profit and Loss Account for the Year Ended 31 March 2026</h2>
        <h3 style={{ fontSize: 16, color: '#3b82f6', margin: '8px 0' }}>Sharma Textiles Pvt Ltd</h3>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>Registration: MSME-MH-2024-001 | Period: {period}</p>
      </div>

      <table className="ca-table">
        <thead>
          <tr>
            <th>Particulars</th>
            <th className="right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <Row label="I. Revenue from Operations" value={data.revenueFromOperations} ruleId="AS9-R002" />
          <Row label="II. Other Income" value={data.otherIncome} />
          <Row label="III. Total Revenue (I + II)" value={data.totalRevenue} isSubtotal />
          
          <tr><td colSpan={2} style={{ height: 20 }}></td></tr>
          
          <Row label="IV. EXPENSES" value="" />
          <Row label="Cost of Materials Consumed" value={data.costOfMaterialsConsumed} indent ruleId="AS2-R002" />
          <Row label="Employee Benefit Expense" value={data.employeeBenefitExpense} indent ruleId="AS15-R001" />
          <Row label="Finance Costs" value={data.financeCosts} indent />
          <Row label="Depreciation and Amortisation Expense" value={data.depreciationAndAmortisation} indent />
          <Row label="Other Expenses" value={data.otherExpenses} indent />
          <Row label="Total Expenses" value={data.totalExpenses} isSubtotal />
 
          <tr><td colSpan={2} style={{ height: 20 }}></td></tr>

          <Row label="V. PROFIT BEFORE TAX (III - IV)" value={data.profitBeforeTax} isSubtotal />
          <Row label="VI. Tax Expense" value="" />
          <Row label="Current Tax" value={data.taxExpenseCurrent} indent ruleId="AS22-R001" />
          <Row label="Deferred Tax" value={data.taxExpenseDeferred} indent />
          
          <Row label="VII. PROFIT AFTER TAX (V - VI)" value={data.profitAfterTax} isTotal margin={data.netMargin} />
          
          <tr className="margin-row">
            <td colSpan={2}>
              <div className="margin-pills">
                <span>Gross Profit Margin: <strong>{data.grossMargin.toFixed(1)}%</strong></span>
                <span>EBIT Margin: <strong>{data.ebitMargin.toFixed(1)}%</strong></span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <style jsx>{`
        .ca-table { width: 100%; border-collapse: collapse; }
        .ca-table th { text-align: left; padding: 12px; border-bottom: 2px solid #334155; color: #94a3b8; font-size: 13px; text-transform: uppercase; }
        .ca-table td { padding: 12px; font-size: 14px; }
        .right { text-align: right; }
        .subtotal { font-weight: 700; border-top: 1px solid #334155; }
        .grand-total { font-weight: 800; font-size: 16px !important; border-top: 2px solid #3b82f6; border-bottom: 3px double #3b82f6; color: #3b82f6; }
        .compliance-indicator { display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; cursor: help; }
        .compliance-indicator.error { color: #ef4444; }
        .compliance-indicator.warning { color: #f59e0b; }
      `}</style>
    </div>
  );
}

export default IncomeStatement;
