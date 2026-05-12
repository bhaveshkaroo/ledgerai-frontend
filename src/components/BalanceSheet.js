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
    <div className="statement-wrap">
      <div className="statement-doc">
        <div className="statement-header">
          <div className="statement-company">Sharma Textiles Pvt Ltd</div>
          <div className="statement-name">Balance Sheet</div>
          <div className="statement-period">As at 31 March 2026 | Registration: MSME-MH-2024-001</div>
        </div>

        <div className="statement-body">
          <div className="balance-sheet-grid">
            {/* Liabilities Side */}
            <div>
              <div className="bs-side-title">Equity & Liabilities</div>
              
              <div className="stmt-section">
                <div className="stmt-section-title">Shareholders' Funds</div>
                <div className="stmt-row indent">
                  <span className="stmt-label">Share Capital</span>
                  <span className="stmt-amount">₹{formatINR(data.equity.shareCapital)}</span>
                </div>
                <div className="stmt-row indent">
                  <span className="stmt-label">Reserves and Surplus</span>
                  <span className="stmt-amount">₹{formatINR(data.equity.retainedEarnings)}</span>
                </div>
                <div className="stmt-subtotal">
                  <span className="stmt-label">Total Shareholders' Funds</span>
                  <span className="stmt-amount">₹{formatINR(data.equity.shareCapital + data.equity.retainedEarnings)}</span>
                </div>
              </div>

              <div className="stmt-section">
                <div className="stmt-section-title">Liabilities</div>
                <div className="stmt-row indent">
                  <span className="stmt-label">Long-Term Borrowings</span>
                  <span className="stmt-amount">₹{formatINR(data.liabilities.nonCurrent)}</span>
                </div>
                <div className="stmt-row indent">
                  <span className="stmt-label">Trade Payables</span>
                  <span className="stmt-amount">₹{formatINR(600000)}</span>
                </div>
                <div className="stmt-row indent">
                  <span className="stmt-label">Other Current Liabilities</span>
                  <span className="stmt-amount">₹{formatINR(600000)}</span>
                </div>
                <div className="stmt-subtotal">
                  <span className="stmt-label">Total Liabilities</span>
                  <span className="stmt-amount">₹{formatINR(data.liabilities.nonCurrent + 1200000)}</span>
                </div>
              </div>

              <div className="stmt-total">
                <span className="stmt-label">TOTAL EQUITY & LIABILITIES</span>
                <span className="stmt-amount">₹{formatINR(data.totalEquityLiabilities)}</span>
              </div>
            </div>

            {/* Assets Side */}
            <div>
              <div className="bs-side-title">Assets</div>

              <div className="stmt-section">
                <div className="stmt-section-title">Non-Current Assets</div>
                <div className="stmt-row indent">
                  <span className="stmt-label">Fixed Assets (Net Block)</span>
                  <span className="stmt-amount">₹{formatINR(6500000)}</span>
                </div>
                <div className="stmt-subtotal">
                  <span className="stmt-label">Total Non-Current Assets</span>
                  <span className="stmt-amount">₹{formatINR(6500000)}</span>
                </div>
              </div>

              <div className="stmt-section">
                <div className="stmt-section-title">Current Assets</div>
                <div className="stmt-row indent">
                  <span className="stmt-label">Inventories</span>
                  <span className="stmt-amount">₹{formatINR(1500000)}</span>
                </div>
                <div className="stmt-row indent">
                  <span className="stmt-label">Trade Receivables</span>
                  <span className="stmt-amount">₹{formatINR(1200000)}</span>
                </div>
                <div className="stmt-row indent">
                  <span className="stmt-label">Cash and Equivalents</span>
                  <span className="stmt-amount">₹{formatINR(data.assets.current - 3500000)}</span>
                </div>
                <div className="stmt-row indent">
                  <span className="stmt-label">Other Current Assets</span>
                  <span className="stmt-amount">₹{formatINR(800000)}</span>
                </div>
                <div className="stmt-subtotal">
                  <span className="stmt-label">Total Current Assets</span>
                  <span className="stmt-amount">₹{formatINR(data.assets.current)}</span>
                </div>
              </div>

              <div className="stmt-total">
                <span className="stmt-label">TOTAL ASSETS</span>
                <span className="stmt-amount">₹{formatINR(data.totalAssets)}</span>
              </div>
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

export default BalanceSheet;
