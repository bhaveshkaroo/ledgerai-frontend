import React from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';

function IncomeStatement({ period }) {
  const data = LedgerEngine.calcIncomeStatement(period);

  const Row = ({ label, value, isSubtotal, isTotal, indent, margin }) => (
    <tr className={`${isSubtotal ? 'subtotal' : ''} ${isTotal ? 'grand-total' : ''}`}>
      <td style={{ paddingLeft: indent ? 32 : 12 }}>
        {label}
        {margin !== undefined && <span className="margin-pct">({margin.toFixed(1)}%)</span>}
      </td>
      <td className="right">{value < 0 ? `(${formatINR(Math.abs(value))})` : formatINR(value)}</td>
    </tr>
  );

  return (
    <div className="card glass-card statement-card">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Profit and Loss Account for the Year Ended 31 March 2026</h2>
        <h3 style={{ fontSize: 16, color: 'var(--accent-blue)', margin: '8px 0' }}>Sharma Textiles Pvt Ltd</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Registration: MSME-MH-2024-001 | Period: {period}</p>
      </div>

      <table className="ca-table">
        <thead>
          <tr>
            <th>Particulars</th>
            <th className="right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <Row label="I. Revenue from Operations" value={data.revenueFromOperations} />
          <Row label="II. Other Income" value={data.otherIncome} />
          <Row label="III. Total Revenue (I + II)" value={data.totalRevenue} isSubtotal />
          
          <tr><td colSpan={2} style={{ height: 20 }}></td></tr>
          
          <Row label="IV. EXPENSES" value="" />
          <Row label="Cost of Materials Consumed" value={data.costOfMaterialsConsumed} indent />
          <Row label="Employee Benefit Expense" value={data.employeeBenefitExpense} indent />
          <Row label="Finance Costs" value={data.financeCosts} indent />
          <Row label="Depreciation and Amortisation Expense" value={data.depreciationAndAmortisation} indent />
          <Row label="Other Expenses" value={data.otherExpenses} indent />
          <Row label="Total Expenses" value={data.totalExpenses} isSubtotal />

          <tr><td colSpan={2} style={{ height: 20 }}></td></tr>

          <Row label="V. PROFIT BEFORE TAX (III - IV)" value={data.profitBeforeTax} isSubtotal />
          <Row label="VI. Tax Expense" value="" />
          <Row label="Current Tax" value={data.taxExpenseCurrent} indent />
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
        .ca-table th { text-align: left; padding: 12px; border-bottom: 2px solid var(--border); color: var(--text-secondary); font-size: 13px; text-transform: uppercase; }
        .ca-table td { padding: 12px; font-size: 14px; }
        .right { text-align: right; }
        .subtotal { font-weight: 700; border-top: 1px solid var(--border); }
        .grand-total { font-weight: 800; font-size: 16px !important; border-top: 2px solid var(--text-primary); border-bottom: 3px double var(--accent-cyan); color: var(--accent-cyan); }
        .margin-pct { color: var(--text-secondary); font-size: 11px; margin-left: 8px; font-weight: 400; }
        .margin-row td { padding: 30px 0 10px; }
        .margin-pills { display: flex; gap: 20px; font-size: 12px; color: var(--text-secondary); }
        .margin-pills strong { color: var(--text-primary); }
      `}</style>
    </div>
  );
}

export default IncomeStatement;
