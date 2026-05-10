import React from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';

function CashFlowStatement({ period }) {
  const data = LedgerEngine.calcCashFlow(period);

  const Row = ({ label, value, isSubtotal, isTotal, indent }) => (
    <tr className={`${isSubtotal ? 'subtotal' : ''} ${isTotal ? 'grand-total' : ''}`}>
      <td style={{ paddingLeft: indent ? 32 : 12 }}>{label}</td>
      <td className="right">{value < 0 ? `(${formatINR(Math.abs(value))})` : (value === "" ? "" : formatINR(value))}</td>
    </tr>
  );

  return (
    <div className="card glass-card statement-card">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Cash Flow Statement for the Year Ended 31 March 2026</h2>
        <h3 style={{ fontSize: 16, color: 'var(--accent-blue)', margin: '8px 0' }}>Sharma Textiles Pvt Ltd</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>(As per AS 3 - Indirect Method) | Period: {period}</p>
      </div>

      <table className="ca-table">
        <thead>
          <tr>
            <th>Particulars</th>
            <th className="right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="section-head"><td colSpan={2}>A. CASH FLOW FROM OPERATING ACTIVITIES</td></tr>
          <Row label="Net Profit Before Tax" value={data.operating.netProfitBeforeTax} indent />
          <Row label="Adjustments for:" value="" indent />
          <Row label="Depreciation" value={data.operating.adjustments.depreciation} indent style={{ paddingLeft: 48 }} />
          <Row label="Finance Costs" value={data.operating.adjustments.interestExpense} indent style={{ paddingLeft: 48 }} />
          
          <Row label="Operating Profit before Working Capital changes" value={data.operating.netProfitBeforeTax + data.operating.adjustments.depreciation + data.operating.adjustments.interestExpense} isSubtotal indent />
          
          <Row label="Adjustments for Working Capital changes:" value="" indent />
          <Row label="(Increase)/Decrease in Receivables" value={data.operating.wcChanges.receivables} indent style={{ paddingLeft: 48 }} />
          <Row label="Increase/(Decrease) in Payables" value={data.operating.wcChanges.payables} indent style={{ paddingLeft: 48 }} />
          <Row label="(Increase)/Decrease in Inventory" value={data.operating.wcChanges.inventory} indent style={{ paddingLeft: 48 }} />
          
          <Row label="Cash generated from operations" value={data.operating.netCashFromOperating + data.operating.taxPaid} isSubtotal indent />
          <Row label="Less: Income Tax Paid" value={-data.operating.taxPaid} indent />
          <Row label="Net Cash from Operating Activities (A)" value={data.operating.netCashFromOperating} isTotal />

          <tr><td colSpan={2} style={{ height: 20 }}></td></tr>

          <tr className="section-head"><td colSpan={2}>B. CASH FLOW FROM INVESTING ACTIVITIES</td></tr>
          <Row label="Purchase of Fixed Assets" value={data.investing.capex} indent />
          <Row label="Sale of Investments" value={data.investing.assetSales} indent />
          <Row label="Net Cash from Investing Activities (B)" value={data.investing.netCashFromInvesting} isTotal />

          <tr><td colSpan={2} style={{ height: 20 }}></td></tr>

          <tr className="section-head"><td colSpan={2}>C. CASH FLOW FROM FINANCING ACTIVITIES</td></tr>
          <Row label="Proceeds from Share Capital" value={data.financing.loanProceeds} indent />
          <Row label="Repayment of Long-term Borrowings" value={data.financing.loanRepayment} indent />
          <Row label="Interest Paid" value={-data.financing.interestPaid} indent />
          <Row label="Net Cash from Financing Activities (C)" value={data.financing.netCashFromFinancing} isTotal />

          <tr><td colSpan={2} style={{ height: 30 }}></td></tr>

          <Row label="Net Increase / (Decrease) in Cash (A+B+C)" value={data.netChange} isSubtotal />
          <Row label="Opening Cash and Cash Equivalents" value={data.openingBalance} />
          <Row label="Closing Cash and Cash Equivalents" value={data.closingBalance} isTotal style={{ color: 'var(--accent-cyan)' }} />
        </tbody>
      </table>

      <style jsx>{`
        .ca-table { width: 100%; border-collapse: collapse; }
        .ca-table th { text-align: left; padding: 12px; border-bottom: 2px solid var(--border); color: var(--text-secondary); font-size: 13px; text-transform: uppercase; }
        .ca-table td { padding: 10px 12px; font-size: 14px; }
        .right { text-align: right; }
        .section-head { font-weight: 700; color: #fff; background: rgba(255,255,255,0.03); }
        .subtotal { font-weight: 700; border-top: 1px solid var(--border); }
        .grand-total { font-weight: 800; font-size: 15px !important; border-top: 2px solid var(--text-primary); border-bottom: 3px double var(--accent-cyan); color: var(--accent-cyan); }
      `}</style>
    </div>
  );
}

export default CashFlowStatement;
