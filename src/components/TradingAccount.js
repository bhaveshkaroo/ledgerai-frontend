import React from 'react';
import { LedgerEngine, formatCurrency } from '../utils/LedgerEngine';

function TradingAccount({ period, currency = 'INR' }) {
  const statement = LedgerEngine.calcTradingAccount(period);

  return (
    <div className="card" style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Trading Account</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            For the period ended {period === 'Full Year' ? '31 Mar 2026' : period}
          </p>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
          Currency: {currency} | Scale: Absolute
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', width: '70%' }}>Particulars</th>
              <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {statement.map((row, idx) => {
              if (row.isHeader) return null; // Skip header row from data
              
              const isTitle = row.isSummary && !row.isTotal;
              const isTotal = row.isTotal;
              
              let rowStyle = { borderBottom: '1px solid var(--border-light)' };
              let cellStyle = { padding: '12px 20px', fontSize: '13px' };
              
              if (isTitle) {
                cellStyle.fontWeight = 700;
                cellStyle.color = 'var(--text-primary)';
                rowStyle.background = 'var(--bg-surface)';
              } else if (isTotal) {
                cellStyle.fontWeight = 700;
                cellStyle.color = 'var(--text-primary)';
                rowStyle.borderTop = '1px solid var(--border)';
                rowStyle.borderBottom = '2px solid var(--border)';
                rowStyle.background = 'var(--bg-page)';
              } else {
                cellStyle.color = 'var(--text-secondary)';
                cellStyle.paddingLeft = `${20 + (row.level * 16)}px`; // indent based on level
              }
              
              // Highlight Gross Profit
              if (row.name.includes('Gross Profit')) {
                cellStyle.color = row.value >= 0 ? '#10b981' : '#ef4444'; // Green if profit, red if loss
              }

              return (
                <tr key={idx} style={rowStyle} className="table-row-hover">
                  <td style={cellStyle}>{row.name}</td>
                  <td style={{ ...cellStyle, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {row.value !== null ? formatCurrency(row.value, currency) : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TradingAccount;
