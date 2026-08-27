import React from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';

const IncomeStatement = ({ period }) => {
  const data = LedgerEngine.calcIncomeStatement(period);

  return (
    <div className="statement-container">
      <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Statement of Profit and Loss</h2>
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>For the period ended {period === 'Full Year' ? 'Mar 31, 2026' : period}</div>
      </div>

      <div className="table-responsive">
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--border)', width: '70%' }}>Particulars</th>
              <th style={{ textAlign: 'right', padding: '12px', borderBottom: '1px solid var(--border)', width: '30%' }}>Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} style={{ 
                borderBottom: row.isTotal ? '2px solid var(--border)' : '1px solid var(--border-light)',
                backgroundColor: row.isSummary && !row.isTotal ? 'var(--bg-surface)' : 'transparent'
              }}>
                <td style={{ 
                  padding: `12px 12px 12px ${12 + (row.level * 24)}px`,
                  fontWeight: row.isSummary || row.isTotal ? 600 : 400,
                  color: row.isSummary ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>
                  {row.name}
                </td>
                <td style={{ 
                  padding: '12px',
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: row.isSummary || row.isTotal ? 600 : 400,
                  borderTop: row.isTotal ? '1px solid var(--text-primary)' : 'none'
                }}>
                  {row.value !== null && row.value !== undefined ? formatINR(row.value) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncomeStatement;
