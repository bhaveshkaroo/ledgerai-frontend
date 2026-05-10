import React from 'react';

const mockData = {
  equity: 12000000,
  liabilities: 8000000,
  assets: 20000000,
  balanced: true
};

function BalanceSheet() {
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
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Balance Sheet as at 31 March 2026</h2>
        <h3 style={{ fontSize: 18, color: 'var(--accent-blue)', margin: 0 }}>Sharma Textiles Pvt Ltd</h3>
      </div>

      <div className="bs-grid">
        {/* Equity and Liabilities */}
        <div className="bs-side">
          <table className="ca-table">
            <thead>
              <tr>
                <th>Equity and Liabilities</th>
                <th className="right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="section-head">1. Shareholder Funds</td>
                <td className="right section-head">{fmt(8000000)}</td>
              </tr>
              <tr>
                <td className="indent">Share Capital</td>
                <td className="right">{fmt(5000000)}</td>
              </tr>
              <tr>
                <td className="indent">Retained Earnings</td>
                <td className="right">{fmt(3000000)}</td>
              </tr>

              <tr>
                <td className="section-head">2. Non-Current Liabilities</td>
                <td className="right section-head">{fmt(2000000)}</td>
              </tr>
              <tr>
                <td className="indent">Long Term Borrowings</td>
                <td className="right">{fmt(2000000)}</td>
              </tr>

              <tr>
                <td className="section-head">3. Current Liabilities</td>
                <td className="right section-head">{fmt(2000000)}</td>
              </tr>
              <tr>
                <td className="indent">Accounts Payable</td>
                <td className="right">{fmt(1200000)}</td>
              </tr>
              <tr>
                <td className="indent">GST Payable</td>
                <td className="right">{fmt(400000)}</td>
              </tr>
              <tr>
                <td className="indent">TDS Payable</td>
                <td className="right">{fmt(100000)}</td>
              </tr>
              <tr>
                <td className="indent">Provision for Tax</td>
                <td className="right">{fmt(300000)}</td>
              </tr>

              <tr className="grand-total">
                <td>TOTAL EQUITY & LIABILITIES</td>
                <td className="right">{fmt(mockData.equity + mockData.liabilities)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Assets */}
        <div className="bs-side">
          <table className="ca-table">
            <thead>
              <tr>
                <th>Assets</th>
                <th className="right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="section-head">1. Non-Current Assets</td>
                <td className="right section-head">{fmt(12000000)}</td>
              </tr>
              <tr>
                <td className="indent">Fixed Assets (Net)</td>
                <td className="right">{fmt(12000000)}</td>
              </tr>

              <tr>
                <td className="section-head">2. Current Assets</td>
                <td className="right section-head">{fmt(8000000)}</td>
              </tr>
              <tr>
                <td className="indent">Cash & Bank</td>
                <td className="right">{fmt(4000000)}</td>
              </tr>
              <tr>
                <td className="indent">Receivables</td>
                <td className="right">{fmt(1500000)}</td>
              </tr>
              <tr>
                <td className="indent">Inventory</td>
                <td className="right">{fmt(1500000)}</td>
              </tr>
              <tr>
                <td className="indent">Advances</td>
                <td className="right">{fmt(500000)}</td>
              </tr>
              <tr>
                <td className="indent">ITC (Input Tax Credit)</td>
                <td className="right">{fmt(500000)}</td>
              </tr>

              <tr className="grand-total">
                <td>TOTAL ASSETS</td>
                <td className="right">{fmt(mockData.assets)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center' }}>
        {mockData.balanced && (
          <div style={{ background: 'var(--badge-success-bg)', color: 'var(--green)', padding: '8px 24px', borderRadius: '30px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>✓</span> Balanced
          </div>
        )}
      </div>

      <style jsx>{`
        .bs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
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
          font-size: 13px;
        }
        .section-head {
          font-weight: 700;
          color: white;
        }
        .indent {
          padding-left: 24px !important;
          color: var(--text-secondary);
        }
        .right {
          text-align: right;
        }
        .grand-total {
          font-weight: 800;
          font-size: 14px !important;
          border-top: 1px solid var(--text-primary);
          border-bottom: 4px double var(--accent-blue);
          color: var(--accent-blue);
        }
      `}</style>
    </div>
  );
}

export default BalanceSheet;
