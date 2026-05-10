import React from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';

function IncomeStatement({ period }) {
  const data = LedgerEngine.calcIncomeStatement(period);

  const Row = ({ label, value, isTotal, isGrandTotal, indent }) => (
    <tr>
      <td className={indent ? 'indent-1' : ''} style={{ fontSize: isGrandTotal ? 16 : 14, fontWeight: (isTotal || isGrandTotal) ? 700 : 400 }}>
        {label}
      </td>
      <td className={`align-right mono ${value < 0 ? 'negative-amount' : ''} ${(isTotal || isGrandTotal) ? (isGrandTotal ? 'grand-total' : 'section-total') : ''}`} style={{ fontSize: isGrandTotal ? 16 : 14 }}>
        {value === "" ? "" : (value < 0 ? `(₹${formatINR(Math.abs(value))})` : `₹${formatINR(value)}`)}
      </td>
    </tr>
  );

  return (
    <div className="statement-document animate-fade-in">
      <div className="document-header">
        <h1 className="company-name heading-serif">Sharma Textiles Pvt Ltd</h1>
        <h2 className="statement-name">Income Statement (Profit & Loss)</h2>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          Registration: MSME-MH-2024-001 | Period Ended: {period}
        </div>
      </div>
      
      <div className="double-line"></div>
      
      <table className="accounting-table">
        <tbody>
          <Row label="Revenue from Operations" value={data.revenueFromOperations} />
          <Row label="Other Income" value={data.otherIncome} />
          <Row label="Total Revenue" value={data.totalRevenue} isTotal />
          
          <tr style={{ height: 24 }}><td></td><td></td></tr>
          
          <Row label="EXPENSES" value="" />
          <Row label="Cost of Materials Consumed" value={data.costOfMaterialsConsumed} indent />
          <Row label="Employee Benefit Expense" value={data.employeeBenefitExpense} indent />
          <Row label="Finance Costs" value={data.financeCosts} indent />
          <Row label="Depreciation and Amortisation Expense" value={data.depreciationAndAmortisation} indent />
          <Row label="Other Expenses" value={data.otherExpenses} indent />
          <Row label="Total Expenses" value={data.totalExpenses} isTotal />
          
          <tr style={{ height: 24 }}><td></td><td></td></tr>
          
          <Row label="PROFIT BEFORE TAX" value={data.profitBeforeTax} isTotal />
          <Row label="Current Tax" value={data.taxExpenseCurrent} />
          <Row label="Deferred Tax" value={data.taxExpenseDeferred} />
          
          <tr style={{ height: 12 }}><td></td><td></td></tr>
          <Row label="PROFIT AFTER TAX" value={data.profitAfterTax} isGrandTotal />
        </tbody>
      </table>
      
      <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
        <div style={{ borderTop: '1px solid #000', width: 150, textAlign: 'center', paddingTop: 8 }}>Director</div>
        <div style={{ borderTop: '1px solid #000', width: 150, textAlign: 'center', paddingTop: 8 }}>Chartered Accountant</div>
      </div>
    </div>
  );
}

export default IncomeStatement;
