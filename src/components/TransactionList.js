import React from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { CheckCircle2 } from 'lucide-react';

function TransactionList({ period }) {
  const transactions = LedgerEngine.getFilteredTransactions(period);

  return (
    <div className="transactions-container">
      <div className="card glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2>Transactions Overview</h2>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Showing {transactions.length} entries for {period}</span>
        </div>
        
        <table className="modern-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Account</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, idx) => (
              <tr key={idx}>
                <td>{txn.date}</td>
                <td>{txn.narration}</td>
                <td>{txn.account}</td>
                <td style={{
                  fontWeight: 'bold',
                  color: txn.type === 'Debit' ? 'var(--red)' : 'var(--green)'
                }}>
                  {txn.type === 'Debit' ? '-' : '+'} {formatINR(txn.amount)}
                </td>
                <td style={{ textTransform: 'capitalize' }}>{txn.type}</td>
                <td>
                  <div className="status-cell status-approved">
                    <CheckCircle2 size={16}/> Reconciled
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .transactions-container { animation: fadeIn 0.8s ease-out; }
        .modern-table { width: 100%; border-collapse: collapse; }
        .modern-table th { text-align: left; padding: 16px; color: var(--text-secondary); font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--border); letter-spacing: 1px; }
        .modern-table td { padding: 18px 16px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.02); }
        .status-approved { color: #10b981; }
      `}</style>
    </div>
  );
}

export default TransactionList;
