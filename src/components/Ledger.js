import React, { useState, useMemo } from 'react';
import { LedgerEngine, formatINR, CHART_OF_ACCOUNTS } from '../utils/LedgerEngine';
import { Search } from 'lucide-react';

function Ledger({ period }) {
  const [selectedAccount, setSelectedAccount] = useState(CHART_OF_ACCOUNTS[0].name);
  const [searchTerm, setSearchTerm] = useState('');

  const ledgerEntries = useMemo(() => {
    const txs = LedgerEngine.getFilteredTransactions(period);
    let runningBalance = 0;
    const entries = [];
    
    // Simple logic to find opening balance or use fixed starting point
    if (selectedAccount === 'Cash and Bank') runningBalance = 4500000;
    
    entries.push({
      date: '2025-04-01', particulars: 'Opening Balance', voucher: 'OB-001', debit: runningBalance, credit: 0, balance: runningBalance
    });

    txs.filter(t => t.account === selectedAccount).sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(t => {
      if (t.type === 'Debit') runningBalance += t.amount;
      else runningBalance -= t.amount;
      entries.push({
        date: t.date, particulars: t.narration, voucher: t.ref,
        debit: t.type === 'Debit' ? t.amount : 0,
        credit: t.type === 'Credit' ? t.amount : 0,
        balance: runningBalance
      });
    });

    return entries.filter(e => 
      e.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.voucher.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedAccount, period, searchTerm]);

  const closingBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;

  return (
    <div className="ledger-container animate-fade-in">
      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Account:</label>
          <select 
            value={selectedAccount} 
            onChange={(e) => setSelectedAccount(e.target.value)} 
            className="ledger-select"
            style={{ 
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-light)', 
              background: '#fff', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' 
            }}
          >
            {CHART_OF_ACCOUNTS.map(acc => <option key={acc.name} value={acc.name}>{acc.name}</option>)}
          </select>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" placeholder="Search entries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 16px 8px 40px', borderRadius: 8, border: '1px solid var(--border-light)', background: '#fff', width: 250 }}
          />
        </div>
      </div>

      <div className="statement-document">
        <div className="document-header" style={{ borderBottom: 'none', marginBottom: 0 }}>
          <h1 className="company-name heading-serif">Sharma Textiles Pvt Ltd</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 8, marginTop: 20 }}>
            <span style={{ fontWeight: 700 }}>Dr.</span>
            <div style={{ textAlign: 'center' }}>
              <h2 className="heading-serif" style={{ fontSize: 24, margin: 0 }}>{selectedAccount}</h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Account Code: 100-{(CHART_OF_ACCOUNTS.findIndex(a => a.name === selectedAccount) + 1).toString().padStart(3, '0')}</span>
            </div>
            <span style={{ fontWeight: 700 }}>Cr.</span>
          </div>
        </div>

        <table className="ledger-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
          <thead>
            <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid #000' }}>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 12 }}>Date</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 12 }}>Particulars</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 12 }}>Voucher No.</th>
              <th style={{ padding: 12, textAlign: 'right', fontSize: 12 }}>Debit (₹)</th>
              <th style={{ padding: 12, textAlign: 'right', fontSize: 12 }}>Credit (₹)</th>
              <th style={{ padding: 12, textAlign: 'right', fontSize: 12 }}>Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            {ledgerEntries.map((e, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : 'rgba(0,0,0,0.02)' }}>
                <td style={{ padding: 12, fontSize: 13 }}>{e.date}</td>
                <td style={{ padding: 12, fontSize: 13, fontWeight: 600 }}>{e.particulars}</td>
                <td style={{ padding: 12, fontSize: 13, color: 'var(--text-muted)' }}>{e.voucher}</td>
                <td style={{ padding: 12, fontSize: 13, textAlign: 'right', color: e.debit > 0 ? 'var(--accent-red)' : 'inherit' }}>{e.debit > 0 ? formatINR(e.debit) : '—'}</td>
                <td style={{ padding: 12, fontSize: 13, textAlign: 'right', color: e.credit > 0 ? 'var(--accent-teal)' : 'inherit' }}>{e.credit > 0 ? formatINR(e.credit) : '—'}</td>
                <td style={{ padding: 12, fontSize: 13, textAlign: 'right', fontWeight: 700 }}>{formatINR(e.balance)} {e.balance >= 0 ? 'Dr' : 'Cr'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
          <div className="card" style={{ background: 'var(--bg-primary)', padding: '16px 24px', minWidth: 250 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Closing Balance</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-navy)' }}>{formatINR(Math.abs(closingBalance))} {closingBalance >= 0 ? 'Dr' : 'Cr'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ledger;
