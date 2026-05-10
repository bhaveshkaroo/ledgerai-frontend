import React from 'react';

const mockData = {
  operating: 2200000,
  investing: -1200000,
  financing: 500000,
  net_change: 1500000,
  opening_cash: 2500000,
  closing_cash: 4000000
};

function CashFlowStatement() {
  const fmt = v => {
    if (v === 0) return '—';
    const isNeg = v < 0;
    const absV = Math.abs(v);
    const str = `₹${absV.toLocaleString('en-IN')}`;
    return isNeg ? `(${str})` : str;
  };

  return (
    <div className="card glass-card statement-card">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Cash Flow Statement for the year ended 31 March 2026</h2>
        <h3 style={{ fontSize: 18, color: 'var(--accent-blue)', margin: 0 }}>Sharma Textiles Pvt Ltd</h3>
      </div>

      <table className="ca-table">
        <thead>
          <tr>
            <th>Particulars</th>
            <th className="right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="section-head">A — Cash Flow from Operating Activities</td>
            <td className="right section-head">{fmt(mockData.operating)}</td>
          </tr>
          <tr>
            <td className="indent">Net Profit before Tax</td>
            <td className="right">{fmt(2500000)}</td>
          </tr>
          <tr>
            <td className="indent">Adjustments for Depreciation</td>
            <td className="right">{fmt(300000)}</td>
          </tr>
          <tr>
            <td className="indent">Working Capital Changes</td>
            <td className="right">{fmt(-600000)}</td>
          </tr>

          <tr><td colSpan={2} style={{height: 10}}></td></tr>

          <tr>
            <td className="section-head">B — Cash Flow from Investing Activities</td>
            <td className="right section-head">{fmt(mockData.investing)}</td>
          </tr>
          <tr>
            <td className="indent">Purchase of Fixed Assets</td>
            <td className="right">{fmt(-1500000)}</td>
          </tr>
          <tr>
            <td className="indent">Sale of Investments</td>
            <td className="right">{fmt(300000)}</td>
          </tr>

          <tr><td colSpan={2} style={{height: 10}}></td></tr>

          <tr>
            <td className="section-head">C — Cash Flow from Financing Activities</td>
            <td className="right section-head">{fmt(mockData.financing)}</td>
          </tr>
          <tr>
            <td className="indent">Proceeds from Share Capital</td>
            <td className="right">{fmt(1000000)}</td>
          </tr>
          <tr>
            <td className="indent">Repayment of Loans</td>
            <td className="right">{fmt(-500000)}</td>
          </tr>

          <tr><td colSpan={2} style={{height: 20}}></td></tr>

          <tr className="subtotal">
            <td>Net Increase/(Decrease) in Cash (A+B+C)</td>
            <td className="right">{fmt(mockData.net_change)}</td>
          </tr>
          <tr>
            <td>Add: Opening Cash and Cash Equivalents</td>
            <td className="right">{fmt(mockData.opening_cash)}</td>
          </tr>
          <tr className="grand-total">
            <td>Closing Cash and Cash Equivalents</td>
            <td className="right">{fmt(mockData.closing_cash)}</td>
          </tr>
        </tbody>
      </table>

      <style jsx>{`
        .ca-table {
          width: 100%;
          border-collapse: collapse;
        }
        .ca-table th {
          text-align: left;
          padding: 12px;
          border-bottom: 2px solid var(--border);
          color: var(--text-secondary);
          font-size: 13px;
        }
        .ca-table td {
          padding: 10px 12px;
          font-size: 14px;
        }
        .section-head {
          font-weight: 700;
          color: white;
          background: rgba(59, 130, 246, 0.05);
        }
        .indent {
          padding-left: 32px !important;
          color: var(--text-secondary);
        }
        .right {
          text-align: right;
        }
        .subtotal {
          font-weight: 700;
          border-top: 1px solid var(--border);
        }
        .grand-total {
          font-weight: 800;
          font-size: 16px !important;
          border-top: 1px solid var(--text-primary);
          border-bottom: 4px double var(--accent-cyan);
          color: var(--accent-cyan);
          background: rgba(0, 229, 255, 0.05);
        }
      `}</style>
    </div>
  );
}

export default CashFlowStatement;
