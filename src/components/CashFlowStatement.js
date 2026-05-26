import React from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';

function CashFlowStatement({ period }) {
  const data = LedgerEngine.calcCashFlow(period);

  const Row = ({ label, value, isTotal, isGrandTotal, indent, isSection }) => (
    <tr style={{ backgroundColor: isSection ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
      <td className={indent ? 'indent-1' : ''} style={{ fontSize: isGrandTotal ? 16 : 14, fontWeight: (isTotal || isGrandTotal || isSection) ? 700 : 400 }}>
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
          <div className="statement-name">Cash Flow Statement</div>
          <div className="statement-period">(Indirect Method as per AS 3) | Period Ended: {period}</div>
        </div>

        <div className="statement-body">
          <div className="stmt-section">
            <div className="stmt-section-title">Operating Activities</div>
            <div className="stmt-row">
              <span className="stmt-label">Net Profit Before Tax</span>
              <span className="stmt-amount positive">₹{formatINR(data.operating.netProfitBeforeTax)}</span>
            </div>
            <div className="stmt-row indent">
              <span className="stmt-label">Depreciation</span>
              <span className="stmt-amount positive">₹{formatINR(data.operating.adjustments.depreciation)}</span>
            </div>
            <div className="stmt-row indent">
              <span className="stmt-label">Finance Costs</span>
              <span className="stmt-amount positive">₹{formatINR(data.operating.adjustments.interestExpense)}</span>
            </div>
            <div className="stmt-row indent">
              <span className="stmt-label">Changes in Receivables</span>
              <span className="stmt-amount {data.operating.wcChanges.receivables < 0 ? 'negative' : 'positive'}">
                ₹{formatINR(Math.abs(data.operating.wcChanges.receivables))}
              </span>
            </div>
            <div className="stmt-row indent">
              <span className="stmt-label">Changes in Payables</span>
              <span className="stmt-amount {data.operating.wcChanges.payables < 0 ? 'negative' : 'positive'}">
                ₹{formatINR(Math.abs(data.operating.wcChanges.payables))}
              </span>
            </div>
            <div className="stmt-subtotal">
              <span className="stmt-label">Net Cash from Operating Activities</span>
              <span className="stmt-amount">₹{formatINR(data.operating.netCashFromOperating)}</span>
            </div>
          </div>

          <div className="stmt-section">
            <div className="stmt-section-title">Investing Activities</div>
            <div className="stmt-row indent">
              <span className="stmt-label">Purchase of Fixed Assets</span>
              <span className="stmt-amount negative">₹{formatINR(Math.abs(data.investing.capex))}</span>
            </div>
            <div className="stmt-row indent">
              <span className="stmt-label">Sale of Investments</span>
              <span className="stmt-amount positive">₹{formatINR(data.investing.assetSales)}</span>
            </div>
            <div className="stmt-subtotal">
              <span className="stmt-label">Net Cash from Investing Activities</span>
              <span className="stmt-amount">₹{formatINR(data.investing.netCashFromInvesting)}</span>
            </div>
          </div>

          <div className="stmt-section">
            <div className="stmt-section-title">Financing Activities</div>
            <div className="stmt-row indent">
              <span className="stmt-label">Proceeds from Share Capital</span>
              <span className="stmt-amount positive">₹{formatINR(data.financing.loanProceeds)}</span>
            </div>
            <div className="stmt-row indent">
              <span className="stmt-label">Repayment of Borrowings</span>
              <span className="stmt-amount negative">₹{formatINR(Math.abs(data.financing.loanRepayment))}</span>
            </div>
            <div className="stmt-subtotal">
              <span className="stmt-label">Net Cash from Financing Activities</span>
              <span className="stmt-amount">₹{formatINR(data.financing.netCashFromFinancing)}</span>
            </div>
          </div>

          <div className="stmt-section">
            <div className="stmt-row" style={{ borderTop: '2px solid #000000', marginTop: 24 }}>
              <span className="stmt-label bold">Net Increase / (Decrease) in Cash</span>
              <span className="stmt-amount {data.netChange < 0 ? 'negative' : 'positive'}">₹{formatINR(data.netChange)}</span>
            </div>
            <div className="stmt-row">
              <span className="stmt-label">Opening Cash Balance</span>
              <span className="stmt-amount">₹{formatINR(data.openingBalance)}</span>
            </div>
            <div className="stmt-total">
              <span className="stmt-label">CLOSING CASH BALANCE</span>
              <span className="stmt-amount">₹{formatINR(data.closingBalance)}</span>
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

export default CashFlowStatement;
