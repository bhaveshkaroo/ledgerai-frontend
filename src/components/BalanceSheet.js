import React from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';

const BalanceSheet = ({ period }) => {
  const data = LedgerEngine.calcBalanceSheet(period);
  const { end, name: periodName } = LedgerEngine.getPeriodDateRange(period);

  return (
    <div className="animate-fade" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Balance Sheet</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>As at {end} — {periodName}</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '70%' }}>Particulars</th>
              <th style={{ padding: '14px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', width: '30%' }}>Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} style={{ 
                borderBottom: row.isTotal ? '2px solid var(--border)' : '1px solid var(--border-light)',
                backgroundColor: row.level === 0 && !row.isTotal ? 'var(--bg-surface)' : 'transparent',
                lineHeight: 'var(--lh-relaxed)'
              }} className={!row.isSummary ? "table-row-hover" : ""}>
                <td style={{ 
                  padding: `16px 24px 16px ${24 + (row.level * 24)}px`,
                  fontWeight: row.isSummary || row.isTotal ? 600 : 400,
                  color: row.level === 0 ? 'var(--text-primary)' : (row.isSummary ? 'var(--text-primary)' : 'var(--text-secondary)'),
                  fontSize: row.isTotal ? '15px' : '14px'
                }}>
                  {row.name}
                </td>
                <td style={{ 
                  padding: '16px 24px',
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: row.isSummary || row.isTotal ? 700 : 500,
                  fontSize: row.isTotal ? '15px' : '14px',
                  color: row.isTotal ? 'var(--text-primary)' : 'var(--text-secondary)'
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

export default BalanceSheet;
