import React, { useState, useEffect } from 'react';

const mockData = {
  revenue: 8500000,
  cogs: 4200000,
  gross_profit: 4300000,
  operating_expenses: 1500000,
  ebit: 2800000,
  finance_costs: 300000,
  pbt: 2500000,
  tax: 625000,
  net_profit: 1875000,
  margins: { gross: 50.5, ebit: 32.9, net: 22.0 }
};

function IncomeStatement() {
  const [data, setData] = useState(mockData);

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
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Profit and Loss Account for the year ended 31 March 2026</h2>
        <h3 style={{ fontSize: 18, color: 'var(--accent-blue)', margin: 0 }}>Sharma Textiles Pvt Ltd</h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Registration No: MSME-MH-2024-001</p>
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
            <td className="section-head">I. Revenue from Operations</td>
            <td className="right section-head">{fmt(data.revenue)}</td>
          </tr>
          <tr>
            <td className="indent">II. Less: Cost of Goods Sold</td>
            <td className="right">{fmt(-data.cogs)}</td>
          </tr>
          <tr className="subtotal">
            <td>III. GROSS PROFIT <span className="margin-text">{data.margins.gross}%</span></td>
            <td className="right">{fmt(data.gross_profit)}</td>
          </tr>
          
          <tr><td colSpan={2} style={{height: 10}}></td></tr>
          
          <tr>
            <td className="section-head">IV. Operating Expenses</td>
            <td className="right"></td>
          </tr>
          <tr>
            <td className="indent">Administrative Expenses</td>
            <td className="right">{fmt(600000)}</td>
          </tr>
          <tr>
            <td className="indent">Selling & Distribution</td>
            <td className="right">{fmt(400000)}</td>
          </tr>
          <tr>
            <td className="indent">Employee Benefit Expenses</td>
            <td className="right">{fmt(500000)}</td>
          </tr>
          <tr className="subtotal">
            <td>V. OPERATING PROFIT (EBIT) <span className="margin-text">{data.margins.ebit}%</span></td>
            <td className="right">{fmt(data.ebit)}</td>
          </tr>

          <tr><td colSpan={2} style={{height: 10}}></td></tr>

          <tr>
            <td className="indent">VI. Less: Finance Costs</td>
            <td className="right">{fmt(-data.finance_costs)}</td>
          </tr>
          <tr className="subtotal">
            <td>VII. PROFIT BEFORE TAX (PBT)</td>
            <td className="right">{fmt(data.pbt)}</td>
          </tr>

          <tr>
            <td className="indent">VIII. Less: Tax Expense</td>
            <td className="right">{fmt(-data.tax)}</td>
          </tr>
          <tr className="grand-total">
            <td>IX. NET PROFIT AFTER TAX <span className="margin-text">{data.margins.net}%</span></td>
            <td className="right">{fmt(data.net_profit)}</td>
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
          border-bottom: 1px solid var(--border);
        }
        .grand-total {
          font-weight: 800;
          font-size: 16px !important;
          border-top: 1px solid var(--text-primary);
          border-bottom: 4px double var(--accent-blue);
          color: var(--accent-cyan);
        }
        .margin-text {
          font-weight: 400;
          font-size: 12px;
          color: var(--text-secondary);
          margin-left: 8px;
        }
      `}</style>
    </div>
  );
}

export default IncomeStatement;
