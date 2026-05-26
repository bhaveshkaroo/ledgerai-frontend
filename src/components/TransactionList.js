import React, { useState, useMemo } from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { Search, ChevronLeft, ChevronRight, Download, MoreHorizontal, Filter } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';

function TransactionList({ period }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const filteredTransactions = useMemo(() => {
    let txs = LedgerEngine.getFilteredTransactions('Full Year');
    
    if (activeFilter !== 'All') {
      txs = txs.filter(t => t.category === activeFilter || (activeFilter === 'Revenue' && t.type === 'Credit') || (activeFilter === 'Expenses' && t.type === 'Debit'));
    }
    
    if (searchTerm) {
      txs = txs.filter(t => t.narration.toLowerCase().includes(searchTerm.toLowerCase()) || t.ref.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return txs;
  }, [activeFilter, searchTerm]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTxs = filteredTransactions.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="tab-content" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', 'Revenue', 'Expenses'].map(f => (
            <button
              key={f}
              onClick={() => { setActiveFilter(f); setPage(1); }}
              className={`sidebar-btn ${activeFilter === f ? 'active' : ''}`}
              style={{ width: 'auto', background: activeFilter === f ? 'var(--bg-surface)' : 'transparent', padding: '4px 12px' }}
            >
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="command-bar-trigger" style={{ width: '240px' }}>
            <Search size={14} />
            <input 
              type="text" 
              placeholder="Filter transactions..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%' }}
            />
          </div>
          <button className="sidebar-btn" style={{ width: 'auto' }} onClick={() => {
            const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
            const data = paginatedTxs.map(t => [t.date, t.narration, t.category, t.type, t.amount.toString()]);
            exportToPDF('Transaction List', headers, data, 'transactions.pdf');
          }}>
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
              <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</th>
              <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '12px 24px', width: '48px' }}></th>
            </tr>
          </thead>
          <tbody>
            {paginatedTxs.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                <td style={{ padding: '16px 24px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  {t.date}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{t.narration}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t.ref}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`status-dot ${t.type === 'Credit' ? 'emerald' : ''}`} style={{ background: t.type === 'Credit' ? '#34c759' : '#e5e5e7' }}></div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.category}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
                  <span style={{ color: t.type === 'Credit' ? '#34c759' : 'var(--text-primary)' }}>
                    {t.type === 'Credit' ? '+' : ''}{formatINR(t.amount)}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                  <MoreHorizontal size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {paginatedTxs.length} of {filteredTransactions.length} transactions
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="sidebar-btn" 
              style={{ width: 'auto', padding: '4px' }} 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="sidebar-btn" 
              style={{ width: 'auto', padding: '4px' }} 
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionList;
