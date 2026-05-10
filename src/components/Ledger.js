import React, { useState, useMemo } from 'react';
import { Search, Printer, Download, ChevronDown } from 'lucide-react';

const ACCOUNTS = [
  "Sales Revenue", "Capital Account", "Bank Loan Payable", "Raw Material Purchases", 
  "Salary Expense", "Rent Expense", "GST Output Payable", "GST Input ITC", 
  "Utility Expense", "Fixed Assets Machinery", "Loan Repayments", "Finance Cost", 
  "Advance Tax", "Bank Charges", "Depreciation Expense", "Freight Expense", 
  "Repair and Maintenance", "Professional Fees", "Insurance Expense", 
  "Office Expense", "Cash and Bank", "Accounts Receivable", 
  "Accounts Payable", "Inventory", "Advance to Suppliers"
];

const mockTransactions = [
  { id: 'JV001', date: '2025-04-01', particulars: 'Opening Balance', debit: 0, credit: 0, balance: 500000, type: 'Cr' },
  { id: 'JV002', date: '2025-04-05', particulars: 'Cash Sales', debit: 0, credit: 150000, balance: 650000, type: 'Cr' },
  { id: 'JV003', date: '2025-04-10', particulars: 'Purchase of Machinery', debit: 200000, credit: 0, balance: 450000, type: 'Cr' },
  { id: 'JV004', date: '2025-04-15', particulars: 'Payment of Rent', debit: 50000, credit: 0, balance: 400000, type: 'Cr' },
  { id: 'JV005', date: '2025-04-20', particulars: 'Salary Distribution', debit: 120000, credit: 0, balance: 280000, type: 'Cr' },
];

function Ledger() {
  const [selectedAccount, setSelectedAccount] = useState(ACCOUNTS[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const fmt = (v, showSymbol = true) => {
    if (v === 0) return '—';
    const str = v.toLocaleString('en-IN');
    return showSymbol ? `₹${str}` : str;
  };

  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter(t => 
      t.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.date.includes(searchTerm) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const totalDebit = filteredTransactions.reduce((sum, t) => sum + t.debit, 0);
  const totalCredit = filteredTransactions.reduce((sum, t) => sum + t.credit, 0);
  const closingBalance = filteredTransactions.length > 0 ? filteredTransactions[filteredTransactions.length - 1].balance : 0;
  const balanceType = filteredTransactions.length > 0 ? filteredTransactions[filteredTransactions.length - 1].type : 'Cr';

  return (
    <div className="ledger-book-container">
      <div className="ledger-header">
        <div className="account-selector-wrapper">
          <label>Select Ledger Account</label>
          <div className="custom-select">
            <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}>
              {ACCOUNTS.map(acc => <option key={acc} value={acc}>{acc}</option>)}
            </select>
            <ChevronDown size={16} className="select-icon" />
          </div>
        </div>

        <div className="ledger-actions">
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by date, particulars or JV..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-icon" title="Print Ledger"><Printer size={18} /></button>
          <button className="btn-icon" title="Export CSV"><Download size={18} /></button>
        </div>
      </div>

      <div className="card glass-card ledger-card">
        <div className="ledger-top-info">
          <div>
            <h2 className="account-name">{selectedAccount}</h2>
            <p className="company-info">Sharma Textiles Pvt Ltd | FY 2025-26</p>
          </div>
          <div className="balance-summary">
            <div className="bal-item">
              <span>Opening Balance</span>
              <strong>{fmt(500000)} Cr</strong>
            </div>
            <div className="bal-item">
              <span>Closing Balance</span>
              <strong className={balanceType === 'Cr' ? 'text-green' : 'text-red'}>
                {fmt(closingBalance)} {balanceType}
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
                <th>Journal Ref</th>
                <th className="right">Debit (Dr)</th>
                <th className="right">Credit (Cr)</th>
                <th className="right">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t, idx) => (
                <tr key={idx}>
                  <td className="date-cell">{t.date}</td>
                  <td className="particulars-cell">{t.particulars}</td>
                  <td className="ref-cell">{t.id}</td>
                  <td className="right text-red">{t.debit > 0 ? fmt(t.debit) : '—'}</td>
                  <td className="right text-green">{t.credit > 0 ? fmt(t.credit) : '—'}</td>
                  <td className="right balance-cell">
                    {fmt(t.balance)} <small>{t.type}</small>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total Movements</td>
                <td className="right text-red">{fmt(totalDebit)}</td>
                <td className="right text-green">{fmt(totalCredit)}</td>
                <td className="right grand-total">{fmt(closingBalance)} {balanceType}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <style jsx>{`
        .ledger-book-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .ledger-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          background: var(--card-bg);
          padding: 20px;
          border-radius: 16px;
          border: 1px solid var(--border);
        }
        .account-selector-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .account-selector-wrapper label {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .custom-select {
          position: relative;
          min-width: 300px;
        }
        .custom-select select {
          width: 100%;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: white;
          appearance: none;
          font-size: 14px;
          cursor: pointer;
        }
        .select-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: var(--text-secondary);
        }
        .ledger-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .search-wrapper {
          position: relative;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
        }
        .search-wrapper input {
          padding: 10px 16px 10px 40px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: white;
          width: 300px;
          font-size: 14px;
        }
        .btn-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.05);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-icon:hover {
          background: var(--accent-blue);
          border-color: var(--accent-blue);
        }
        .ledger-card {
          padding: 0;
          overflow: hidden;
        }
        .ledger-top-info {
          padding: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.02);
        }
        .account-name {
          font-size: 24px;
          font-weight: 700;
          color: var(--accent-cyan);
          margin-bottom: 4px;
        }
        .company-info {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .balance-summary {
          display: flex;
          gap: 40px;
        }
        .bal-item {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .bal-item span {
          font-size: 11px;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 1px;
        }
        .bal-item strong {
          font-size: 18px;
        }
        .text-red { color: #ff4d4f; }
        .text-green { color: #52c41a; }
        .table-wrapper {
          padding: 20px;
        }
        .ledger-table {
          width: 100%;
          border-collapse: collapse;
        }
        .ledger-table th {
          text-align: left;
          padding: 12px 16px;
          color: var(--text-secondary);
          font-size: 12px;
          text-transform: uppercase;
          border-bottom: 1px solid var(--border);
        }
        .ledger-table td {
          padding: 16px;
          font-size: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }
        .right { text-align: right; }
        .balance-cell {
          font-weight: 600;
          color: white;
        }
        .balance-cell small {
          color: var(--text-secondary);
          font-weight: 400;
          margin-left: 4px;
        }
        tfoot td {
          padding: 20px 16px;
          font-weight: 700;
          border-top: 2px solid var(--border);
        }
        .grand-total {
          font-size: 16px;
          color: var(--accent-cyan);
        }
      `}</style>
    </div>
  );
}

export default Ledger;
