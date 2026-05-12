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
    <div className="ledger-wrap">
      <div className="ledger-header">
        <div className="ledger-controls">
          <select 
            value={selectedAccount} 
            onChange={(e) => setSelectedAccount(e.target.value)} 
            className="ledger-acc-select"
          >
            {CHART_OF_ACCOUNTS.map(acc => <option key={acc.name} value={acc.name}>{acc.name}</option>)}
          </select>
          <div className="txn-search" style={{ margin: 0, padding: '8px 16px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search particulars..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', marginLeft: 8, fontSize: 13 }}
            />
          </div>
        </div>
        <button className="ledger-export-btn">Export Ledger (Excel)</button>
      </div>

      <div className="statement-doc" style={{ marginTop: 24 }}>
        <div className="statement-header">
          <div className="statement-company">Sharma Textiles Pvt Ltd</div>
          <div className="statement-name">{selectedAccount} — General Ledger</div>
          <div className="statement-period">Account Code: 100-{(CHART_OF_ACCOUNTS.findIndex(a => a.name === selectedAccount) + 1).toString().padStart(3, '0')}</div>
        </div>

        <table className="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Particulars</th>
              <th>Voucher</th>
              <th style={{ textAlign: 'right' }}>Debit (Dr)</th>
              <th style={{ textAlign: 'right' }}>Credit (Cr)</th>
              <th style={{ textAlign: 'right' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {ledgerEntries.map((e, i) => (
              <tr key={i} className="ledger-row">
                <td>{e.date}</td>
                <td style={{ fontWeight: 600 }}>{e.particulars}</td>
                <td style={{ color: 'var(--text-muted)' }}>{e.voucher}</td>
                <td style={{ textAlign: 'right' }} className="amount-debit">{e.debit > 0 ? formatINR(e.debit) : '—'}</td>
                <td style={{ textAlign: 'right' }} className="amount-credit">{e.credit > 0 ? formatINR(e.credit) : '—'}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatINR(Math.abs(e.balance))} {e.balance >= 0 ? 'Dr' : 'Cr'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 40, borderTop: '2px solid var(--accent-navy)', paddingTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Closing Balance</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-navy)' }}>{formatINR(Math.abs(closingBalance))} {closingBalance >= 0 ? 'Dr' : 'Cr'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ledger;
