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
    <div className="statement-wrap">
      <div className="statement-doc">
        <div className="statement-header">
          <div className="statement-company">Sharma Textiles Pvt Ltd</div>
          <div className="statement-name">Income Statement (Profit & Loss)</div>
          <div className="statement-period">Registration: MSME-MH-2024-001 | Period Ended: {period}</div>
        </div>

        <div className="statement-body">
          <div className="stmt-section">
            <div className="stmt-section-title">Revenue</div>
            <div className="stmt-row">
              <span className="stmt-label">Revenue from Operations</span>
              <span className="stmt-amount positive">₹{formatINR(data.revenueFromOperations)}</span>
            </div>
            <div className="stmt-row">
              <span className="stmt-label">Other Income</span>
              <span className="stmt-amount positive">₹{formatINR(data.otherIncome)}</span>
            </div>
            <div className="stmt-subtotal">
              <span className="stmt-label">Total Revenue</span>
              <span className="stmt-amount">₹{formatINR(data.totalRevenue)}</span>
            </div>
          </div>

          <div className="stmt-section">
            <div className="stmt-section-title">Expenses</div>
            <div className="stmt-row indent">
              <span className="stmt-label">Cost of Materials Consumed</span>
              <span className="stmt-amount negative">₹{formatINR(data.costOfMaterialsConsumed)}</span>
            </div>
            <div className="stmt-row indent">
              <span className="stmt-label">Employee Benefit Expense</span>
              <span className="stmt-amount negative">₹{formatINR(data.employeeBenefitExpense)}</span>
            </div>
            <div className="stmt-row indent">
              <span className="stmt-label">Finance Costs</span>
              <span className="stmt-amount negative">₹{formatINR(data.financeCosts)}</span>
            </div>
            <div className="stmt-row indent">
              <span className="stmt-label">Depreciation and Amortisation</span>
              <span className="stmt-amount negative">₹{formatINR(data.depreciationAndAmortisation)}</span>
            </div>
            <div className="stmt-row indent">
              <span className="stmt-label">Other Expenses</span>
              <span className="stmt-amount negative">₹{formatINR(data.otherExpenses)}</span>
            </div>
            <div className="stmt-subtotal">
              <span className="stmt-label">Total Expenses</span>
              <span className="stmt-amount">₹{formatINR(data.totalExpenses)}</span>
            </div>
          </div>

          <div className="stmt-section">
            <div className="stmt-subtotal" style={{ borderTop: '2px solid var(--accent-navy)', marginTop: 24 }}>
              <span className="stmt-label bold">PROFIT BEFORE TAX</span>
              <span className="stmt-amount">₹{formatINR(data.profitBeforeTax)}</span>
            </div>
            <div className="stmt-row">
              <span className="stmt-label">Current Tax</span>
              <span className="stmt-amount negative">₹{formatINR(data.taxExpenseCurrent)}</span>
            </div>
            <div className="stmt-row">
              <span className="stmt-label">Deferred Tax</span>
              <span className="stmt-amount negative">₹{formatINR(data.taxExpenseDeferred)}</span>
            </div>
            <div className="stmt-total">
              <span className="stmt-label">PROFIT AFTER TAX</span>
              <span className="stmt-amount">₹{formatINR(data.profitAfterTax)}</span>
            </div>
          </div>

          <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <div style={{ borderTop: '1px solid var(--border)', width: 160, textAlign: 'center', paddingTop: 12 }}>Director</div>
            <div style={{ borderTop: '1px solid var(--border)', width: 160, textAlign: 'center', paddingTop: 12 }}>Chartered Accountant</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncomeStatement;
