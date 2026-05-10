import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const PAGE_SIZE = 50;

function Ledger() {
  const [categories, setCategories] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeBook, setActiveBook] = useState('main');

  useEffect(() => {
    fetch(`${API}/ledger/categories`).then(r => r.json()).then(data => {
      setCategories(data);
      if (data.main_ledger.length > 0) setSelectedAccount(data.main_ledger[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedAccount) return;
    setLoading(true);
    setPage(1);
    fetch(`${API}/ledger/account?name=${encodeURIComponent(selectedAccount)}`)
      .then(r => r.json())
      .then(setLedgerData)
      .finally(() => setLoading(false));
  }, [selectedAccount]);

  const filteredMain = useMemo(() => {
    if (!categories) return [];
    return categories.main_ledger.filter(c =>
      c.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  const subsidiaryBooks = categories ? Object.entries(categories.subsidiary) : [];

  const totalPages = ledgerData ? Math.ceil(ledgerData.entries.length / PAGE_SIZE) : 1;
  const pagedEntries = ledgerData
    ? ledgerData.entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : [];

  const fmt = v => `₹${v.toLocaleString('en-IN', {maximumFractionDigits:0})}`;

  const downloadPDF = () => {
    if (!ledgerData) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Sharma Textiles Pvt Ltd', 14, 15);
    doc.setFontSize(11);
    doc.text(`General Ledger: ${selectedAccount}`, 14, 23);
    doc.text(`Period: January 2026 — December 2026`, 14, 29);
    doc.text(`Opening Balance: ${fmt(0)}  |  Closing Balance: ${fmt(ledgerData.closing_balance)}`, 14, 35);

    doc.autoTable({
      startY: 42,
      head: [['Date', 'Particulars', 'Voucher', 'Debit (Dr)', 'Credit (Cr)', 'Balance']],
      body: ledgerData.entries.map(e => [
        e.date,
        e.narration.substring(0, 50),
        e.debit > 0 ? 'Payment' : 'Receipt',
        e.debit > 0 ? fmt(e.debit) : '-',
        e.credit > 0 ? fmt(e.credit) : '-',
        fmt(e.balance)
      ]),
      foot: [['', 'TOTAL', '', fmt(ledgerData.total_debits), fmt(ledgerData.total_credits), fmt(ledgerData.closing_balance)]],
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [10, 22, 40] },
      footStyles: { fillColor: [237, 242, 247], textColor: [10, 22, 40], fontStyle: 'bold' },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
      }
    });
    doc.save(`Ledger_${selectedAccount.replace(/\s/g, '_')}.pdf`);
  };

  const downloadCSV = () => {
    if (!ledgerData) return;
    const header = 'Date,Particulars,Debit,Credit,Balance\n';
    const rows = ledgerData.entries.map(e =>
      `${e.date},"${e.narration}",${e.debit},${e.credit},${e.balance}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ledger_${selectedAccount.replace(/\s/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubBookClick = (bookName) => {
    if (!categories) return;
    const cats = categories.subsidiary[bookName];
    if (cats && cats.length > 0) {
      setSelectedAccount(cats[0]);
    }
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <h2>General Ledger</h2>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={downloadPDF}>⬇ PDF</button>
          <button className="btn btn-outline" onClick={downloadCSV}>⬇ Excel/CSV</button>
        </div>
      </div>

      <div className="ledger-sidebar">
        {/* Left Menu */}
        <div className="ledger-menu">
          {/* Book Toggle */}
          <div style={{display:'flex', marginBottom:12, borderRadius:6, overflow:'hidden', border:'1px solid var(--border)'}}>
            <button
              className={`btn ${activeBook === 'main' ? 'btn-primary' : 'btn-outline'}`}
              style={{flex:1, borderRadius:0}}
              onClick={() => setActiveBook('main')}
            >Main Ledger</button>
            <button
              className={`btn ${activeBook === 'subsidiary' ? 'btn-primary' : 'btn-outline'}`}
              style={{flex:1, borderRadius:0}}
              onClick={() => setActiveBook('subsidiary')}
            >Subsidiary</button>
          </div>

          <input
            className="ledger-search"
            placeholder="Search accounts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className="ledger-list">
            {activeBook === 'main' ? (
              filteredMain.map(cat => (
                <div
                  key={cat}
                  className={`ledger-item ${selectedAccount === cat ? 'active' : ''}`}
                  onClick={() => setSelectedAccount(cat)}
                >
                  {cat}
                </div>
              ))
            ) : (
              subsidiaryBooks.map(([bookName, cats]) => (
                <React.Fragment key={bookName}>
                  <div className="ledger-group-title">{bookName}</div>
                  {cats.map(cat => (
                    <div
                      key={cat}
                      className={`ledger-item ${selectedAccount === cat ? 'active' : ''}`}
                      onClick={() => setSelectedAccount(cat)}
                    >
                      {cat}
                    </div>
                  ))}
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        {/* Right Content */}
        <div className="ledger-content">
          {loading ? (
            <div className="loading">Loading ledger</div>
          ) : ledgerData ? (
            <>
              <div className="report-company">
                <h3>Sharma Textiles Pvt Ltd</h3>
                <p>Ledger Account: {selectedAccount} — FY 2026</p>
              </div>

              {/* Summary Cards */}
              <div className="card-grid card-grid-4" style={{marginTop:16}}>
                <div className="card stat-card">
                  <div className="label">Opening Bal</div>
                  <div className="value" style={{fontSize:18}}>{fmt(0)}</div>
                </div>
                <div className="card stat-card">
                  <div className="label">Total Debits</div>
                  <div className="value negative" style={{fontSize:18}}>{fmt(ledgerData.total_debits)}</div>
                </div>
                <div className="card stat-card">
                  <div className="label">Total Credits</div>
                  <div className="value positive" style={{fontSize:18}}>{fmt(ledgerData.total_credits)}</div>
                </div>
                <div className="card stat-card">
                  <div className="label">Closing Bal</div>
                  <div className={`value ${ledgerData.closing_balance >= 0 ? 'positive' : 'negative'}`} style={{fontSize:18}}>
                    {fmt(ledgerData.closing_balance)}
                  </div>
                </div>
              </div>

              {/* Ledger Table */}
              <table className="acc-table" style={{marginTop:16}}>
                <thead>
                  <tr>
                    <th style={{width:100}}>Date</th>
                    <th>Particulars</th>
                    <th style={{width:80}}>Voucher</th>
                    <th className="right" style={{width:120}}>Debit (Dr)</th>
                    <th className="right" style={{width:120}}>Credit (Cr)</th>
                    <th className="right" style={{width:130}}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening Balance Row */}
                  <tr style={{background:'var(--hover-bg)'}}>
                    <td></td>
                    <td style={{fontStyle:'italic', color:'var(--text-muted)'}}>Opening Balance</td>
                    <td></td>
                    <td className="right">-</td>
                    <td className="right">-</td>
                    <td className="right" style={{fontWeight:600}}>{fmt(0)}</td>
                  </tr>
                  {pagedEntries.map((e, i) => (
                    <tr key={i}>
                      <td>{e.date}</td>
                      <td>{e.narration}</td>
                      <td style={{color:'var(--text-muted)', fontSize:12}}>
                        {e.debit > 0 ? 'Payment' : 'Receipt'}
                      </td>
                      <td className="right" style={{color: e.debit > 0 ? 'var(--red)' : 'inherit'}}>
                        {e.debit > 0 ? fmt(e.debit) : '-'}
                      </td>
                      <td className="right" style={{color: e.credit > 0 ? 'var(--green)' : 'inherit'}}>
                        {e.credit > 0 ? fmt(e.credit) : '-'}
                      </td>
                      <td className="right" style={{fontWeight:600}}>{fmt(e.balance)}</td>
                    </tr>
                  ))}
                  {/* Closing Balance Row */}
                  <tr className="total-row">
                    <td></td>
                    <td>CLOSING BALANCE</td>
                    <td></td>
                    <td className="right">{fmt(ledgerData.total_debits)}</td>
                    <td className="right">{fmt(ledgerData.total_credits)}</td>
                    <td className="right">{fmt(ledgerData.closing_balance)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Prev</button>
                  <span>Page {page} of {totalPages} ({ledgerData.entries.length} entries)</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next →</button>
                </div>
              )}
            </>
          ) : (
            <div className="loading">Select an account from the left panel</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Ledger;
