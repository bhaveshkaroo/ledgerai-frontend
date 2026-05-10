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
    <div className="statement-document animate-fade-in">
      <div className="document-header">
        <h1 className="company-name heading-serif">Sharma Textiles Pvt Ltd</h1>
        <h2 className="statement-name">Cash Flow Statement</h2>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          (Indirect Method as per AS 3) | Period Ended: {period}
        </div>
      </div>
      
      <div className="double-line"></div>
      
      <table className="accounting-table">
        <tbody>
          <Row label="A. CASH FLOW FROM OPERATING ACTIVITIES" value="" isSection />
          <Row label="Net Profit Before Tax" value={data.operating.netProfitBeforeTax} indent />
          <Row label="Adjustments for:" value="" indent />
          <Row label="Depreciation" value={data.operating.adjustments.depreciation} indent />
          <Row label="Finance Costs" value={data.operating.adjustments.interestExpense} indent />
          <Row label="Operating Profit before Working Capital changes" value={data.operating.netProfitBeforeTax + data.operating.adjustments.depreciation + data.operating.adjustments.interestExpense} isTotal indent />
          
          <Row label="Adjustments for Working Capital changes:" value="" indent />
          <Row label="(Increase)/Decrease in Receivables" value={data.operating.wcChanges.receivables} indent />
          <Row label="Increase/(Decrease) in Payables" value={data.operating.wcChanges.payables} indent />
          <Row label="(Increase)/Decrease in Inventory" value={data.operating.wcChanges.inventory} indent />
          
          <Row label="Net Cash from Operating Activities (A)" value={data.operating.netCashFromOperating} isTotal />

          <tr style={{ height: 24 }}><td></td><td></td></tr>

          <Row label="B. CASH FLOW FROM INVESTING ACTIVITIES" value="" isSection />
          <Row label="Purchase of Fixed Assets" value={data.investing.capex} indent />
          <Row label="Sale of Investments" value={data.investing.assetSales} indent />
          <Row label="Net Cash from Investing Activities (B)" value={data.investing.netCashFromInvesting} isTotal />

          <tr style={{ height: 24 }}><td></td><td></td></tr>

          <Row label="C. CASH FLOW FROM FINANCING ACTIVITIES" value="" isSection />
          <Row label="Proceeds from Share Capital" value={data.financing.loanProceeds} indent />
          <Row label="Repayment of Long-term Borrowings" value={data.financing.loanRepayment} indent />
          <Row label="Interest Paid" value={-data.financing.interestPaid} indent />
          <Row label="Net Cash from Financing Activities (C)" value={data.financing.netCashFromFinancing} isTotal />

          <tr style={{ height: 32 }}><td></td><td></td></tr>

          <Row label="Net Increase / (Decrease) in Cash (A+B+C)" value={data.netChange} isTotal />
          <Row label="Opening Cash and Cash Equivalents" value={data.openingBalance} />
          <Row label="Closing Cash and Cash Equivalents" value={data.closingBalance} isGrandTotal />
        </tbody>
      </table>
      
      <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
        <div style={{ borderTop: '1px solid #000', width: 150, textAlign: 'center', paddingTop: 8 }}>Director</div>
        <div style={{ borderTop: '1px solid #000', width: 150, textAlign: 'center', paddingTop: 8 }}>Chartered Accountant</div>
      </div>
    </div>
  );
}

export default CashFlowStatement;
