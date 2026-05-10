import React, { useState, useMemo } from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { Search, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const CATEGORY_COLORS = {
  'Revenue': '#14B8A6',
  'Expenses': '#EF4444',
  'GST': '#C9A84C',
  'Salary': '#3B82F6',
  'Loan': '#0B1426',
  'Other': '#64748B'
};

function TransactionList({ period }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

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

  const maxBalance = 8000000;

  return (
    <div className="animate-fade-in">
      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {['All', 'Revenue', 'Expenses', 'GST', 'Salary', 'Loan'].map(f => (
            <button
              key={f}
              onClick={() => { setActiveFilter(f); setPage(1); }}
              className={`pill-btn ${activeFilter === f ? 'active' : ''}`}
              style={{
                padding: '8px 20px',
                borderRadius: 20,
                border: activeFilter === f ? '1px solid var(--accent-navy)' : 'none',
                background: activeFilter === f ? '#fff' : '#E2E8F0',
                color: activeFilter === f ? 'var(--accent-navy)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              {f}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: 16 }}>
          <button style={{ 
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', 
            borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            <Calendar size={16} /> Date Range
          </button>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" placeholder="Search ledger..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 16px 8px 40px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', width: 250 }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="transaction-ledger">
          <thead>
            <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTxs.map((t, i) => {
              const d = new Date(t.date);
              const day = d.getDate();
              const month = d.toLocaleString('default', { month: 'short' });
              const balance = 4500000 + (i * 100000); // Simulated running balance
              
              return (
                <tr key={t.id} className="ledger-row" style={{ height: 64 }}>
                  <td style={{ padding: '0 24px' }}>
                    <div className="date-cell">
                      <span className="date-day">{day}</span>
                      <span className="date-month">{month}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="desc-primary">{t.narration}</span>
                      <span className="desc-secondary">Ref: {t.ref}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0 24px' }}>
                    <div className="category-pill" style={{ backgroundColor: `${CATEGORY_COLORS[t.category || 'Other']}15`, color: CATEGORY_COLORS[t.category || 'Other'] }}>
                      <div className="dot-indicator" style={{ backgroundColor: CATEGORY_COLORS[t.category || 'Other'] }} />
                      {t.category || 'Other'}
                    </div>
                  </td>
                  <td style={{ padding: '0 24px', textAlign: 'right' }}>
                    <span className={t.type === 'Credit' ? 'amount-credit' : 'amount-debit'} style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {t.type === 'Credit' ? '+' : '-'}{formatINR(t.amount)}
                    </span>
                  </td>
                  <td style={{ padding: '0 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{formatINR(balance)}</span>
                      <div style={{ width: 60, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${(balance / maxBalance) * 100}%`, height: '100%', backgroundColor: 'var(--accent-navy)' }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              disabled={page === 1} onClick={() => setPage(page - 1)}
              style={{ padding: 8, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', opacity: page === 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled={page === totalPages} onClick={() => setPage(page + 1)}
              style={{ padding: 8, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
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
