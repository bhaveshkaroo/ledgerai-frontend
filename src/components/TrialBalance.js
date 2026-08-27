import React from 'react';
import { LedgerEngine, formatINR, CHART_OF_ACCOUNTS } from '../utils/LedgerEngine';

const TrialBalance = ({ period }) => {
  // Calculate balance for every account in the Chart of Accounts
  const accounts = CHART_OF_ACCOUNTS.map(acc => {
    const balance = LedgerEngine.getAccountBalance(acc.name);
    const isDebitNormal = ['Asset', 'Expense'].includes(acc.type);
    return {
      ...acc,
      balance,
      debit: isDebitNormal ? balance : 0,
      credit: !isDebitNormal ? balance : 0,
    };
  }).filter(a => a.balance !== 0); // Only show accounts with balances

  const totalDebits = accounts.reduce((sum, a) => sum + a.debit, 0);
  const totalCredits = accounts.reduce((sum, a) => sum + a.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 1;

  return (
    <div className="animate-fade" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Trial Balance</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>As at Mar 31, 2026</p>
        </div>
        <div style={{
          padding: '6px 14px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 600,
          background: isBalanced ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          color: isBalanced ? '#10b981' : '#ef4444'
        }}>
          {isBalanced ? '✓ Balanced' : '✗ Imbalanced'}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account</th>
              <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
              <th style={{ padding: '14px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Debit (Dr.)</th>
              <th style={{ padding: '14px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Credit (Cr.)</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 500 }}>{acc.name}</td>
                <td style={{ padding: '14px 24px' }}>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                    background: acc.type === 'Asset' ? 'rgba(59,130,246,0.08)' :
                                acc.type === 'Liability' ? 'rgba(239,68,68,0.08)' :
                                acc.type === 'Revenue' ? 'rgba(16,185,129,0.08)' :
                                acc.type === 'Expense' ? 'rgba(249,115,22,0.08)' :
                                acc.type === 'Equity' ? 'rgba(139,92,246,0.08)' : 'var(--bg-surface)',
                    color: acc.type === 'Asset' ? '#3b82f6' :
                           acc.type === 'Liability' ? '#ef4444' :
                           acc.type === 'Revenue' ? '#10b981' :
                           acc.type === 'Expense' ? '#f97316' :
                           acc.type === 'Equity' ? '#8b5cf6' : 'var(--text-muted)'
                  }}>
                    {acc.type}
                  </span>
                </td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                  {acc.debit > 0 ? formatINR(acc.debit) : ''}
                </td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                  {acc.credit > 0 ? formatINR(acc.credit) : ''}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--bg-surface)', borderTop: '2px solid var(--border)' }}>
              <td colSpan={2} style={{ padding: '14px 24px', fontWeight: 700, fontSize: '13px' }}>TOTAL</td>
              <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700 }}>{formatINR(totalDebits)}</td>
              <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700 }}>{formatINR(totalCredits)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default TrialBalance;
