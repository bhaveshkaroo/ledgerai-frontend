import React, { useState, useEffect } from 'react';
import { formatINR } from '../utils/LedgerEngine';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function TrialBalance() {
  const [data, setData] = useState({
    accounts: {
      'Sales Revenue': { debit: 0, credit: 12000000 },
      'Cost of Materials': { debit: 4500000, credit: 0 },
      'Employee Expenses': { debit: 2800000, credit: 0 },
      'Cash and Bank': { debit: 4500000, credit: 0 },
      'Trade Payables': { debit: 0, credit: 600000 },
      'Share Capital': { debit: 0, credit: 5000000 },
      'Fixed Assets': { debit: 7500000, credit: 0 },
      'Depreciation': { debit: 1000000, credit: 0 },
      'Retained Earnings': { debit: 0, credit: 1700000 }
    },
    total_debits: 19300000,
    total_credits: 19300000,
    is_balanced: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/reports/trial-balance`)
      .then(r => r.json())
      .then(d => { if(d.accounts) setData(d); })
      .catch(e => console.log('Using mock data'))
      .finally(() => setLoading(false));
  }, []);

  const Row = ({ label, debit, credit, isTotal }) => (
    <tr>
      <td style={{ padding: 12, fontSize: 14, fontWeight: isTotal ? 700 : 400 }}>{label}</td>
      <td className={`align-right mono ${isTotal ? 'section-total' : ''}`} style={{ padding: 12, fontSize: 14 }}>
        {debit > 0 ? `₹${formatINR(debit)}` : '—'}
      </td>
      <td className={`align-right mono ${isTotal ? 'section-total' : ''}`} style={{ padding: 12, fontSize: 14 }}>
        {credit > 0 ? `₹${formatINR(credit)}` : '—'}
      </td>
    </tr>
  );

  if (loading) return <div className="animate-pulse" style={{ textAlign: 'center', padding: 100 }}>Loading Trial Balance...</div>;

  return (
    <div className="statement-document animate-fade-in">
      <div className="document-header">
        <h1 className="company-name heading-serif">Sharma Textiles Pvt Ltd</h1>
        <h2 className="statement-name">Trial Balance</h2>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          As at 31 March 2026 | Registration: MSME-MH-2024-001
        </div>
      </div>
      
      <div className="double-line"></div>
      
      <table className="accounting-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 32 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th style={{ textAlign: 'left', padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>Particulars</th>
            <th style={{ textAlign: 'right', padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>Debit (₹)</th>
            <th style={{ textAlign: 'right', padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>Credit (₹)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.accounts).map(([name, vals]) => (
            <Row key={name} label={name} debit={vals.debit} credit={vals.credit} />
          ))}
          <tr style={{ height: 24 }}><td></td><td></td><td></td></tr>
          <Row label="GRAND TOTAL" debit={data.total_debits} credit={data.total_credits} isTotal />
        </tbody>
      </table>

      {data.is_balanced ? (
        <div style={{ marginTop: 40, padding: '12px 24px', background: 'rgba(20, 184, 166, 0.1)', color: 'var(--accent-teal)', borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: 'center', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
          ✓ The Trial Balance is perfectly balanced.
        </div>
      ) : (
        <div style={{ marginTop: 40, padding: '12px 24px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          ⚠ Warning: The Trial Balance is currently out of balance.
        </div>
      )}

      <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
        <div style={{ borderTop: '1px solid #000', width: 150, textAlign: 'center', paddingTop: 8 }}>Authorized Signatory</div>
        <div style={{ borderTop: '1px solid #000', width: 150, textAlign: 'center', paddingTop: 8 }}>Date: 10/05/2026</div>
      </div>
    </div>
  );
}

export default TrialBalance;
