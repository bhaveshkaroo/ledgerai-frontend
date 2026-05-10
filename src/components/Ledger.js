import React, { useState, useMemo } from 'react';
import { Search, Printer, Download, ChevronDown, BookText, ArrowRightLeft, CreditCard, ShoppingBag, RotateCcw, ScrollText } from 'lucide-react';
import { LedgerEngine, formatINR, CHART_OF_ACCOUNTS } from '../utils/LedgerEngine';

function Ledger({ period }) {
  const [activeSubTab, setActiveSubTab] = useState('General Ledger');
  const [selectedAccount, setSelectedAccount] = useState(CHART_OF_ACCOUNTS[0].name);
  const [selectedSubBook, setSelectedSubBook] = useState('Sales Book');
  const [searchTerm, setSearchTerm] = useState('');

  const ledgerEntries = useMemo(() => {
    return LedgerEngine.getLedgerEntries(selectedAccount, period).filter(e => 
      e.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.date.includes(searchTerm) ||
      e.ref.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedAccount, period, searchTerm]);

  const subBookData = useMemo(() => {
    // Generate dummy data for subsidiary books based on transactions
    const allTxs = LedgerEngine.getFilteredTransactions(period);
    if (selectedSubBook === 'Sales Book') {
      return allTxs.filter(t => t.account === 'Sales Revenue').map((t, i) => ({
        date: t.date,
        invoice: `INV-25-0${i+1}`,
        customer: 'Retail Customer',
        particulars: t.narration,
        amount: t.amount,
        gst: t.amount * 0.18,
        total: t.amount * 1.18
      }));
    }
    if (selectedSubBook === 'Purchase Book') {
      return allTxs.filter(t => t.account === 'Cost of Materials Consumed').map((t, i) => ({
        date: t.date,
        invoice: `PUR-25-0${i+1}`,
        supplier: 'Global Fabrics Ltd',
        particulars: t.narration,
        amount: t.amount,
        gst: t.amount * 0.05,
        total: t.amount * 1.05
      }));
    }
    // Add others as needed...
    return [];
  }, [selectedSubBook, period]);

  const closingBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;
  const closingType = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].type : 'Dr';

  return (
    <div className="ledger-book-container" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      {/* Sub Tab Navigation */}
      <div className="pill-nav">
        <button 
          className={`pill-btn ${activeSubTab === 'General Ledger' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('General Ledger')}
        >
          General Ledger
        </button>
        <button 
          className={`pill-btn ${activeSubTab === 'Subsidiary Books' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('Subsidiary Books')}
        >
          Subsidiary Books
        </button>
      </div>

      {activeSubTab === 'General Ledger' ? (
        <div className="general-ledger-section">
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
                  placeholder="Search by date, particulars or JV..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="btn-icon" onClick={() => window.print()}><Printer size={18} /></button>
              <button className="btn-icon"><Download size={18} /></button>
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
                  <strong style={{ fontSize: 24 }}>{formatINR(500000)} Cr</strong>
                </div>
                <div className="bal-item">
                  <span>Closing Balance</span>
                  <strong className={closingType === 'Dr' ? 'text-red' : 'text-green'} style={{ fontSize: 24 }}>
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
                    <th>Journal Ref</th>
                    <th className="right">Debit (Dr)</th>
                    <th className="right">Credit (Cr)</th>
                    <th className="right">Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.map((t, idx) => (
                    <tr key={idx} className={t.particulars === 'Opening Balance' ? 'opening-bal-row' : ''}>
                      <td>{t.date}</td>
                      <td style={{ fontWeight: 600 }}>{t.particulars}</td>
                      <td>{t.ref}</td>
                      <td className="right text-red">{t.debit > 0 ? formatINR(t.debit) : '—'}</td>
                      <td className="right text-green">{t.credit > 0 ? formatINR(t.credit) : '—'}</td>
                      <td className="right" style={{ fontWeight: 700 }}>{formatINR(t.balance)} {t.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="subsidiary-books-section">
          <div className="ledger-header">
            <div className="account-selector-wrapper">
              <label>Select Subsidiary Book</label>
              <select 
                value={selectedSubBook} 
                onChange={(e) => setSelectedSubBook(e.target.value)}
                className="ledger-select"
              >
                <option>Sales Book</option>
                <option>Purchase Book</option>
                <option>Sales Return Book</option>
                <option>Purchase Return Book</option>
                <option>Cash Book</option>
                <option>Bank Book</option>
                <option>Journal Proper</option>
              </select>
            </div>
            <button className="pill primary" onClick={() => window.print()}><Printer size={16} /> Print Book</button>
          </div>

          <div className="card glass-card">
            <h3 style={{ marginBottom: 24, fontSize: 20 }}>{selectedSubBook}</h3>
            <table className="modern-table">
              {selectedSubBook === 'Sales Book' && (
                <>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Invoice No</th>
                      <th>Customer</th>
                      <th>Particulars</th>
                      <th className="right">Amount (₹)</th>
                      <th className="right">GST (₹)</th>
                      <th className="right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subBookData.map((d, i) => (
                      <tr key={i}>
                        <td>{d.date}</td>
                        <td>{d.invoice}</td>
                        <td>{d.customer}</td>
                        <td>{d.particulars}</td>
                        <td className="right">{formatINR(d.amount)}</td>
                        <td className="right">{formatINR(d.gst)}</td>
                        <td className="right" style={{ fontWeight: 700 }}>{formatINR(d.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 800, background: 'rgba(255,255,255,0.02)' }}>
                      <td colSpan={4}>TOTAL</td>
                      <td className="right">{formatINR(subBookData.reduce((s,x)=>s+x.amount, 0))}</td>
                      <td className="right">{formatINR(subBookData.reduce((s,x)=>s+x.gst, 0))}</td>
                      <td className="right">{formatINR(subBookData.reduce((s,x)=>s+x.total, 0))}</td>
                    </tr>
                  </tfoot>
                </>
              )}
              {selectedSubBook !== 'Sales Book' && (
                 <tbody><tr><td colSpan={5}>Select a book to view detailed records.</td></tr></tbody>
              )}
            </table>
          </div>
        </div>
      )}

      <style jsx>{`
        .ledger-book-container { padding-bottom: 40px; }
        .general-ledger-section, .subsidiary-books-section { display: flex; flex-direction: column; gap: 24px; }
        .ledger-header { display: flex; justify-content: space-between; align-items: flex-end; background: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155; }
        .account-selector-wrapper { display: flex; flex-direction: column; gap: 8px; }
        .account-selector-wrapper label { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .ledger-actions { display: flex; gap: 12px; align-items: center; }
        .search-wrapper { position: relative; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b; }
        .search-wrapper input { padding: 12px 16px 12px 42px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #f1f5f9; width: 300px; font-size: 14px; outline: none; }
        .btn-icon { width: 44px; height: 44px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #94a3b8; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .btn-icon:hover { background: #3b82f6; color: #fff; border-color: #3b82f6; }
        .ledger-top-info { padding: 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
        .account-name { font-size: 26px; font-weight: 700; color: var(--accent-cyan); }
        .balance-summary { display: flex; gap: 40px; }
        .bal-item { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .bal-item span { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; }
        .ledger-table { width: 100%; border-collapse: collapse; }
        .ledger-table th { text-align: left; padding: 16px; color: #94a3b8; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #334155; }
        .ledger-table td { padding: 16px; font-size: 14px; border-bottom: 1px solid #1e293b; }
        .right { text-align: right; }
        .text-red { color: #ef4444; }
        .text-green { color: #22c55e; }
      `}</style>
    </div>
  );
}

export default Ledger;
