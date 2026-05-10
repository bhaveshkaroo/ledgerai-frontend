import React, { useState, useMemo } from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown, CheckCircle2 } from 'lucide-react';

const MONTHS_FULL = [
  "All Months", "April 2025", "May 2025", "June 2025", "July 2025", "August 2025", 
  "September 2025", "October 2025", "November 2025", "December 2025", 
  "January 2026", "February 2026", "March 2026"
];

const TX_TYPES = ["All Types", "Sales", "Purchase", "Expense", "Salary", "Rent", "GST Payment", "Loan Repayment", "Other"];

function TransactionList({ period }) {
  const [filters, setFilters] = useState({ month: 'All Months', type: 'All Types', keyword: '' });
  const [sort, setSort] = useState({ key: 'date', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filteredTransactions = useMemo(() => {
    let txs = LedgerEngine.getFilteredTransactions('Full Year', filters);
    
    // Sorting
    txs.sort((a, b) => {
      let valA = a[sort.key];
      let valB = b[sort.key];
      if (sort.direction === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

    return txs;
  }, [filters, sort]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTxs = filteredTransactions.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === 'Debit') acc.debit += t.amount;
      else acc.credit += t.amount;
      return acc;
    }, { debit: 0, credit: 0 });
  }, [filteredTransactions]);

  const toggleSort = (key) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <div className="transactions-tab">
      <div className="filter-bar card" style={{ background: '#1e293b', border: '1px solid #334155', marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="filter-group">
            <label>Month</label>
            <select value={filters.month} onChange={e => { setFilters({ ...filters, month: e.target.value }); setPage(1); }}>
              {MONTHS_FULL.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Type</label>
            <select value={filters.type} onChange={e => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}>
              {TX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="filter-group" style={{ flex: 1 }}>
            <label>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search narration, account, ref..." 
                value={filters.keyword} 
                onChange={e => { setFilters({ ...filters, keyword: e.target.value }); setPage(1); }}
                style={{ paddingLeft: 36, width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#1e293b', border: '1px solid #334155' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 18 }}>Transaction Records</h3>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Showing {Math.min(filteredTransactions.length, (page-1)*pageSize + 1)}–{Math.min(filteredTransactions.length, page*pageSize)} of {filteredTransactions.length}</span>
        </div>

        <table className="modern-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('date')} style={{ cursor: 'pointer' }}>Date <ArrowUpDown size={12}/></th>
              <th onClick={() => toggleSort('ref')} style={{ cursor: 'pointer' }}>Ref <ArrowUpDown size={12}/></th>
              <th>Particulars</th>
              <th>Account (Dr/Cr)</th>
              <th className="right" onClick={() => toggleSort('amount')} style={{ cursor: 'pointer' }}>Debit (₹) <ArrowUpDown size={12}/></th>
              <th className="right">Credit (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTxs.map(t => (
              <tr key={t.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{t.date}</td>
                <td style={{ color: '#3b82f6', fontWeight: 600 }}>{t.ref}</td>
                <td>{t.narration}</td>
                <td>{t.account}</td>
                <td className="right text-red">{t.type === 'Debit' ? formatINR(t.amount) : '—'}</td>
                <td className="right text-green">{t.type === 'Credit' ? formatINR(t.amount) : '—'}</td>
                <td>
                  <span className="status-badge"><CheckCircle2 size={12}/> Reconciled</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'rgba(255,255,255,0.02)', fontWeight: 700 }}>
              <td colSpan={4}>TOTAL FOR FILTERED PERIOD</td>
              <td className="right text-red">{formatINR(stats.debit)}</td>
              <td className="right text-green">{formatINR(stats.credit)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div className="pagination-bar">
          <div className="page-size">
            <span>Rows per page:</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
              {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="page-controls">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={18}/></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>;
            })}
            {totalPages > 5 && <span>...</span>}
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={18}/></button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .filter-group { display: flex; flex-direction: column; gap: 4px; }
        .filter-group label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px; }
        .filter-group select, .filter-group input { background: #0f172a; border: 1px solid #334155; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px; outline: none; }
        .modern-table { width: 100%; border-collapse: collapse; }
        .modern-table th { text-align: left; padding: 14px 24px; color: #94a3b8; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #334155; }
        .modern-table td { padding: 14px 24px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.02); }
        .right { text-align: right; }
        .text-red { color: #ef4444; }
        .text-green { color: #22c55e; }
        .status-badge { display: flex; align-items: center; gap: 4px; color: #10b981; font-size: 11px; font-weight: 600; }
        .pagination-bar { padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #334155; }
        .page-size { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #94a3b8; }
        .page-controls { display: flex; gap: 4px; align-items: center; }
        .page-controls button { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .page-controls button.active { background: #3b82f6; border-color: #3b82f6; }
        .page-controls button:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

export default TransactionList;
