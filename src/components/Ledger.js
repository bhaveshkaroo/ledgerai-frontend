import React, { useState, useMemo } from 'react';
import { Search, Printer, Download, ChevronDown } from 'lucide-react';
import { LedgerEngine, formatINR, CHART_OF_ACCOUNTS } from '../utils/LedgerEngine';

function Ledger({ period }) {
  const [selectedAccount, setSelectedAccount] = useState(CHART_OF_ACCOUNTS[0].name);
  const [searchTerm, setSearchTerm] = useState('');

  const ledgerEntries = useMemo(() => {
    return LedgerEngine.getLedgerEntries(selectedAccount, period).filter(e => 
      e.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.date.includes(searchTerm) ||
      e.ref.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedAccount, period, searchTerm]);

  const closingBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;
  const closingType = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].type : 'Dr';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="ledger-book-container">
      <div className="ledger-header">
        <div className="account-selector-wrapper">
          <label>Select Ledger Account</label>
          <div className="custom-select-wrapper">
            <select 
              value={selectedAccount} 
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="ledger-select"
            >
              {CHART_OF_ACCOUNTS.map(acc => <option key={acc.name} value={acc.name}>{acc.name}</option>)}
            </select>
          </div>
        </div>

        <div className="ledger-actions">
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by date, particulars or ref..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-icon" title="Print Ledger" onClick={handlePrint}><Printer size={18} /></button>
          <button className="btn-icon" title="Export CSV"><Download size={18} /></button>
        </div>
      </div>

      <div className="card glass-card ledger-card">
        <div className="ledger-top-info">
          <div>
            <h2 className="account-name">{selectedAccount}</h2>
            <p className="company-info">Sharma Textiles Pvt Ltd | FY 2025-26 | Period: {period}</p>
          </div>
          <div className="balance-summary">
            <div className="bal-item">
              <span>Closing Balance</span>
              <strong className={closingType === 'Dr' ? 'text-red' : 'text-green'}>
                {formatINR(closingBalance)} {closingType}
              </strong>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Particulars</th>
                <th>Ref</th>
                <th className="right">Debit (₹)</th>
                <th className="right">Credit (₹)</th>
                <th className="right">Running Balance</th>
                <th>Side</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map((t, idx) => (
                <tr key={idx} className={t.particulars === 'Opening Balance' ? 'opening-bal-row' : ''}>
                  <td className="date-cell">{t.date}</td>
                  <td className="particulars-cell">{t.particulars}</td>
                  <td className="ref-cell">{t.ref}</td>
                  <td className="right text-red">{t.debit > 0 ? formatINR(t.debit) : '—'}</td>
                  <td className="right text-green">{t.credit > 0 ? formatINR(t.credit) : '—'}</td>
                  <td className="right balance-cell">{formatINR(t.balance)}</td>
                  <td className="type-cell">{t.type}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="closing-balance-row">
                <td colSpan={5}>CLOSING BALANCE</td>
                <td className="right">{formatINR(closingBalance)}</td>
                <td>{closingType}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <style jsx>{`
        .ledger-book-container { display: flex; flex-direction: column; gap: 24px; }
        .ledger-header { display: flex; justify-content: space-between; align-items: flex-end; background: var(--card-bg); padding: 24px; border-radius: 20px; border: 1px solid var(--border); }
        .account-selector-wrapper { display: flex; flex-direction: column; gap: 10px; }
        .account-selector-wrapper label { font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        
        .ledger-select {
          min-width: 300px;
          background-color: #1e293b !important;
          color: #f1f5f9 !important;
          border: 1px solid var(--border) !important;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
        }

        .ledger-actions { display: flex; gap: 12px; align-items: center; }
        .search-wrapper { position: relative; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
        .search-wrapper input { padding: 12px 16px 12px 42px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border); border-radius: 10px; color: white; width: 300px; font-size: 14px; outline: none; }
        .search-wrapper input:focus { border-color: var(--accent-blue); }

        .btn-icon { width: 44px; height: 44px; border-radius: 10px; border: 1px solid var(--border); background: rgba(255, 255, 255, 0.05); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .btn-icon:hover { background: var(--accent-blue); border-color: var(--accent-blue); }

        .ledger-card { padding: 0; overflow: hidden; }
        .ledger-top-info { padding: 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); background: rgba(255, 255, 255, 0.02); }
        .account-name { font-size: 26px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 4px; }
        .company-info { font-size: 13px; color: var(--text-secondary); }
        .bal-item { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .bal-item span { font-size: 11px; text-transform: uppercase; color: var(--text-secondary); font-weight: 700; }
        .bal-item strong { font-size: 20px; }

        .table-wrapper { padding: 20px; }
        .ledger-table { width: 100%; border-collapse: collapse; }
        .ledger-table th { text-align: left; padding: 14px 16px; color: var(--text-secondary); font-size: 12px; text-transform: uppercase; border-bottom: 2px solid var(--border); }
        .ledger-table td { padding: 16px; font-size: 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.03); }
        .right { text-align: right; }
        .text-red { color: #ff4d4f; }
        .text-green { color: #10b981; }
        .balance-cell { font-weight: 600; color: #fff; }
        .type-cell { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-align: center; }

        .opening-bal-row { background: rgba(59, 130, 246, 0.05); }
        .closing-balance-row td { font-weight: 800; font-size: 16px; border-top: 2px solid var(--border); padding: 24px 16px; color: var(--accent-cyan); }

        @media print {
          .ledger-header, .sidebar, .sub-nav, .search-wrapper, .btn-icon { display: none !important; }
          .main-content { padding: 0 !important; overflow: visible !important; }
          .ledger-card { border: 1px solid #000 !important; color: #000 !important; background: #fff !important; }
          .account-name { color: #000 !important; }
          .ledger-table th { color: #000 !important; border-bottom: 2px solid #000 !important; }
          .ledger-table td { border-bottom: 1px solid #eee !important; color: #000 !important; }
        }
      `}</style>
    </div>
  );
}

export default Ledger;
