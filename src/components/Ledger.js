import React, { useState, useMemo } from 'react';
import { Search, Printer, Download, ChevronDown, BookText, ArrowRightLeft, CreditCard, ShoppingBag, RotateCcw, ScrollText } from 'lucide-react';
import { LedgerEngine, formatINR, CHART_OF_ACCOUNTS } from '../utils/LedgerEngine';

function Ledger({ period }) {
  const [activeSubTab, setActiveSubTab] = useState('General Ledger');
  const [selectedAccount, setSelectedAccount] = useState(CHART_OF_ACCOUNTS[0].name);
  const [selectedSubBook, setSelectedSubBook] = useState('Sales Book');
  const [searchTerm, setSearchTerm] = useState('');

  const ledgerEntries = useMemo(() => {
    const txs = LedgerEngine.getFilteredTransactions(period);
    let runningBalance = selectedAccount === 'Cash and Bank' ? 4500000 : 0;
    const entries = [{
      date: '2025-04-01', particulars: 'Opening Balance', ref: 'OB', debit: runningBalance, credit: 0, balance: runningBalance, type: 'Dr'
    }];
    
    txs.filter(t => t.account === selectedAccount).sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(t => {
      if (t.type === 'Debit') runningBalance += t.amount;
      else runningBalance -= t.amount;
      entries.push({
        date: t.date, particulars: t.narration, ref: t.ref,
        debit: t.type === 'Debit' ? t.amount : 0,
        credit: t.type === 'Credit' ? t.amount : 0,
        balance: Math.abs(runningBalance),
        type: runningBalance >= 0 ? 'Dr' : 'Cr'
      });
    });

    return entries.filter(e => 
      e.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.date.includes(searchTerm) ||
      e.ref.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedAccount, period, searchTerm]);

  const subBookData = useMemo(() => {
    const allTxs = LedgerEngine.getFilteredTransactions(period);
    if (selectedSubBook === 'Sales Book') {
      return allTxs.filter(t => t.account === 'Sales Revenue').map((t, i) => ({
        date: t.date, invoice: t.ref, customer: t.narration.replace('Credit Sale to ', ''), particulars: t.narration, amount: t.amount, gst: Math.floor(t.amount * 0.18), total: Math.floor(t.amount * 1.18)
      }));
    }
    if (selectedSubBook === 'Purchase Book') {
      return allTxs.filter(t => t.account === 'Cost of Materials Consumed').map((t, i) => ({
        date: t.date, invoice: t.ref, supplier: t.narration.replace('Purchase from ', ''), particulars: t.narration, amount: t.amount, gst: Math.floor(t.amount * 0.18), total: Math.floor(t.amount * 1.18)
      }));
    }
    if (selectedSubBook === 'Cash Book') {
      return allTxs.filter(t => t.category === 'Expense' || t.category === 'Salary' || t.category === 'Rent').map(t => ({
        date: t.date, particulars: t.narration, ref: t.ref, receipt: t.type === 'Credit' ? t.amount : 0, payment: t.type === 'Debit' ? t.amount : 0
      }));
    }
    return [];
  }, [selectedSubBook, period]);

  const closingBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;
  const closingType = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].type : 'Dr';

  return (
    <div className="ledger-book-container">
      <div className="pill-nav" style={{ display: 'flex', flexDirection: 'row', gap: 12, padding: '16px 0', flexWrap: 'wrap', marginBottom: 20 }}>
        <button className={`pill-btn ${activeSubTab === 'General Ledger' ? 'active' : ''}`} onClick={() => setActiveSubTab('General Ledger')}>General Ledger</button>
        <button className={`pill-btn ${activeSubTab === 'Subsidiary Books' ? 'active' : ''}`} onClick={() => setActiveSubTab('Subsidiary Books')}>Subsidiary Books</button>
      </div>

      {activeSubTab === 'General Ledger' ? (
        <div className="general-ledger-section">
          <div className="ledger-header card" style={{ background: '#1e293b', padding: 24, border: '1px solid #334155', borderRadius: 12, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className="account-selector-wrapper">
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Select Ledger Account</label>
              <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="ledger-select" style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '10px 16px', borderRadius: 8 }}>
                {CHART_OF_ACCOUNTS.map(acc => <option key={acc.name} value={acc.name}>{acc.name}</option>)}
              </select>
            </div>
            <div className="ledger-actions" style={{ display: 'flex', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 16px 10px 40px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#fff' }} />
              </div>
              <button className="btn-icon" onClick={() => window.print()} style={{ background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, width: 44, display: 'flex', alignItems: 'center', justifyCenter: 'center' }}><Printer size={18} /></button>
            </div>
          </div>

          <div className="card glass-card">
            <div style={{ padding: 30, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155' }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{selectedAccount}</h2>
                <p style={{ color: '#94a3b8', fontSize: 13 }}>Sharma Textiles Pvt Ltd | FY 2025-26</p>
              </div>
              <div style={{ display: 'flex', gap: 40, textAlign: 'right' }}>
                <div><span style={{ fontSize: 11, color: '#94a3b8' }}>CLOSING BALANCE</span><div style={{ fontSize: 22, fontWeight: 700 }}>{formatINR(closingBalance)} {closingType}</div></div>
              </div>
            </div>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Particulars</th>
                  <th>Ref</th>
                  <th className="right">Debit (₹)</th>
                  <th className="right">Credit (₹)</th>
                  <th className="right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgerEntries.map((e, i) => (
                  <tr key={i}>
                    <td>{e.date}</td>
                    <td style={{ fontWeight: 600 }}>{e.particulars}</td>
                    <td style={{ color: '#3b82f6' }}>{e.ref}</td>
                    <td className="right text-red">{e.debit > 0 ? formatINR(e.debit) : '—'}</td>
                    <td className="right text-green">{e.credit > 0 ? formatINR(e.credit) : '—'}</td>
                    <td className="right" style={{ fontWeight: 700 }}>{formatINR(e.balance)} {e.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="subsidiary-books-section">
          <div className="ledger-header card" style={{ background: '#1e293b', padding: 24, border: '1px solid #334155', borderRadius: 12, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Select Subsidiary Book</label>
              <select value={selectedSubBook} onChange={(e) => setSelectedSubBook(e.target.value)} className="ledger-select" style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '10px 16px', borderRadius: 8 }}>
                <option>Sales Book</option>
                <option>Purchase Book</option>
                <option>Cash Book</option>
              </select>
            </div>
          </div>
          <div className="card glass-card">
            <h3 style={{ padding: '24px 30px', borderBottom: '1px solid #334155' }}>{selectedSubBook} - Detailed Records</h3>
            <table className="modern-table">
              {selectedSubBook === 'Sales Book' && (
                <>
                  <thead><tr><th>Date</th><th>Invoice</th><th>Customer</th><th className="right">Amount</th><th className="right">GST</th><th className="right">Total</th></tr></thead>
                  <tbody>{subBookData.map((d, i) => <tr key={i}><td>{d.date}</td><td style={{ color: '#3b82f6' }}>{d.invoice}</td><td>{d.customer}</td><td className="right">{formatINR(d.amount)}</td><td className="right">{formatINR(d.gst)}</td><td className="right" style={{ fontWeight: 700 }}>{formatINR(d.total)}</td></tr>)}</tbody>
                </>
              )}
              {selectedSubBook === 'Purchase Book' && (
                <>
                  <thead><tr><th>Date</th><th>Invoice</th><th>Supplier</th><th className="right">Amount</th><th className="right">GST</th><th className="right">Total</th></tr></thead>
                  <tbody>{subBookData.map((d, i) => <tr key={i}><td>{d.date}</td><td style={{ color: '#3b82f6' }}>{d.invoice}</td><td>{d.supplier}</td><td className="right">{formatINR(d.amount)}</td><td className="right">{formatINR(d.gst)}</td><td className="right" style={{ fontWeight: 700 }}>{formatINR(d.total)}</td></tr>)}</tbody>
                </>
              )}
              {selectedSubBook === 'Cash Book' && (
                <>
                  <thead><tr><th>Date</th><th>Particulars</th><th>Ref</th><th className="right">Receipts</th><th className="right">Payments</th></tr></thead>
                  <tbody>{subBookData.map((d, i) => <tr key={i}><td>{d.date}</td><td>{d.particulars}</td><td style={{ color: '#3b82f6' }}>{d.ref}</td><td className="right text-green">{d.receipt > 0 ? formatINR(d.receipt) : '—'}</td><td className="right text-red">{d.payment > 0 ? formatINR(d.payment) : '—'}</td></tr>)}</tbody>
                </>
              )}
            </table>
          </div>
        </div>
      )}
      <style jsx>{`
        .modern-table { width: 100%; border-collapse: collapse; }
        .modern-table th { text-align: left; padding: 16px 30px; color: #94a3b8; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #334155; }
        .modern-table td { padding: 16px 30px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.02); }
        .right { text-align: right; }
        .text-red { color: #ef4444; }
        .text-green { color: #22c55e; }
      `}</style>
    </div>
  );
}

export default Ledger;
