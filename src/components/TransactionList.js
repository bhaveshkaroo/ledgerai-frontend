import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LedgerEngine, formatINR, CHART_OF_ACCOUNTS } from '../utils/LedgerEngine';
import { Search, ChevronLeft, ChevronRight, Download, Plus, BookOpen, Receipt } from 'lucide-react';
import { exportToPDF, exportMultiYearLedgerToPDF } from '../utils/exportUtils';
import ManualEntryModal from './ManualEntryModal';

// ─── Account grouping helper for the Ledger Book dropdown ────────────────────
const ACCOUNT_GROUPS = [
  { label: 'Cash & Bank', types: ['Asset'], filter: a => a.name === 'Cash and Bank' },
  { label: 'Trade Receivables (Debtors)', types: ['Asset'], filter: a => a.section === 'Trade Receivables' },
  { label: 'Trade Payables (Creditors)', types: ['Liability'], filter: a => a.section === 'Trade Payables' },
  { label: 'Revenue', types: ['Revenue'] },
  { label: 'Expenses', types: ['Expense'] },
  { label: 'Fixed & Intangible Assets', types: ['Asset', 'Contra Asset'], filter: a => a.section?.includes('Assets') || a.type === 'Contra Asset' },
  { label: 'Other Current Assets', types: ['Asset'], filter: a => a.section?.includes('current assets') || a.section?.includes('Inventories') },
  { label: 'Equity', types: ['Equity'] },
  { label: 'Liabilities (Non-Trade)', types: ['Liability'], filter: a => a.section !== 'Trade Payables' },
];

function getGroupedAccounts() {
  const used = new Set();
  const groups = [];
  ACCOUNT_GROUPS.forEach(g => {
    const accounts = CHART_OF_ACCOUNTS.filter(a => {
      if (used.has(a.name)) return false;
      if (g.filter) return g.filter(a);
      return g.types.includes(a.type);
    });
    if (accounts.length > 0) {
      accounts.forEach(a => used.add(a.name));
      groups.push({ label: g.label, accounts });
    }
  });
  // Any remaining
  const remaining = CHART_OF_ACCOUNTS.filter(a => !used.has(a.name));
  if (remaining.length > 0) {
    groups.push({ label: 'Other', accounts: remaining });
  }
  return groups;
}

// ─── Sub-Tab: Day Book (Daily Journal) ───────────────────────────────────────
function DayBookTab({ period }) {
  const [selectedPeriod, setSelectedPeriod] = useState(period || LedgerEngine.getCurrentFiscalYear());
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [localTransactions, setLocalTransactions] = useState(LedgerEngine.getFilteredTransactions(selectedPeriod));
  const pageSize = 25;

  useEffect(() => {
    const handleUpdate = () => setLocalTransactions(LedgerEngine.getFilteredTransactions(selectedPeriod));
    window.addEventListener('ledger-updated', handleUpdate);
    return () => window.removeEventListener('ledger-updated', handleUpdate);
  }, [selectedPeriod]);

  useEffect(() => {
    setLocalTransactions(LedgerEngine.getFilteredTransactions(selectedPeriod));
    setPage(1);
  }, [selectedPeriod]);

  const filteredTransactions = useMemo(() => {
    let txs = localTransactions;
    if (activeFilter !== 'All') {
      txs = txs.filter(t => t.category === activeFilter || (activeFilter === 'Revenue' && t.type === 'Credit') || (activeFilter === 'Expenses' && t.type === 'Debit'));
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      txs = txs.filter(t => (t.narration || '').toLowerCase().includes(q) || (t.ref || '').toLowerCase().includes(q) || (t.account || '').toLowerCase().includes(q));
    }
    return txs;
  }, [activeFilter, searchTerm, localTransactions]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTxs = filteredTransactions.slice((page - 1) * pageSize, page * pageSize);

  // Compute Day Book totals
  const totals = useMemo(() => {
    let dr = 0, cr = 0;
    filteredTransactions.forEach(t => { if (t.type === 'Debit') dr += t.amount; else cr += t.amount; });
    return { dr, cr };
  }, [filteredTransactions]);

  const handleManualEntry = async (entry) => {
    const date = new Date().toISOString().split('T')[0];
    setSaveError(null);
    try {
      await LedgerEngine.postTransaction(date, entry.narration, entry.debit, entry.credit, Number(entry.amount), entry.type);
      window.dispatchEvent(new Event('ledger-updated'));
    } catch (err) {
      setSaveError(err.message || 'Failed to save transaction to database.');
      console.error('[Meso] Manual entry save failed:', err);
    }
  };

  // Fixed: Build proper Day Book data objects for exportToPDF
  const handleExportDayBookPDF = useCallback(() => {
    const dayBookData = filteredTransactions.map(t => ({
      date: t.date,
      ref: t.ref || '',
      account: t.account || '',
      narration: t.narration || '',
      category: t.category || '',
      type: t.type,
      amount: t.amount,
      debit: t.type === 'Debit' ? t.amount : 0,
      credit: t.type === 'Credit' ? t.amount : 0,
      isTotal: false
    }));
    // Add totals row
    dayBookData.push({
      date: '',
      ref: '',
      account: 'GRAND TOTAL',
      narration: '',
      category: '',
      debit: totals.dr,
      credit: totals.cr,
      isTotal: true
    });
    const periodLabel = selectedPeriod === 'Full Year' ? 'All_3_Years' : selectedPeriod.replace(/\s+/g, '_');
    exportToPDF(
      `Day Book / Journal — ${selectedPeriod === 'Full Year' ? 'All 3 Years' : selectedPeriod}`,
      dayBookData,
      `Day_Book_${periodLabel}.pdf`,
      { isDayBook: true }
    );
  }, [filteredTransactions, totals, selectedPeriod]);

  return (
    <>
      {saveError && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ {saveError}</span>
          <button onClick={() => setSaveError(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>✕</button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none' }}
          >
            <option value="Full Year">All 3 Years</option>
            <option value="FY 2024-25">FY 2024-25</option>
            <option value="FY 2025-26">FY 2025-26</option>
            <option value={LedgerEngine.getCurrentFiscalYear()}>{LedgerEngine.getCurrentFiscalYear()} (Current)</option>
          </select>
          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 4px' }}></div>
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
          <div className="command-bar-trigger" style={{ width: '220px' }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Filter transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%' }}
            />
          </div>
          <button
            className="action-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--text-primary)', color: 'var(--bg-card)', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
            onClick={() => setIsEntryModalOpen(true)}
          >
            <Plus size={14} /> New Entry
          </button>
          <button
            className="sidebar-btn"
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}
            onClick={handleExportDayBookPDF}
            title="Export Day Book as statutory PDF"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Day Book Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Voucher Ref</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Particulars (Account & Narration)</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Debit (Dr.)</th>
              <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Credit (Cr.)</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTxs.map((t) => (
              <tr
                key={t.id}
                style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'pointer' }}
                className="table-row-hover"
                onClick={() => { window.location.hash = `#/journal/${encodeURIComponent(t.ref)}`; }}
                title="Click to view journal voucher detail"
              >
                <td style={{ padding: '14px 16px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {t.date}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {t.ref}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{t.account}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{t.narration}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`status-dot ${t.type === 'Credit' ? 'emerald' : ''}`} style={{ background: t.type === 'Credit' ? '#34c759' : '#e5e5e7', width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 }}></div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.category}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
                  {t.type === 'Debit' ? formatINR(t.amount) : ''}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#34c759' }}>
                  {t.type === 'Credit' ? formatINR(t.amount) : ''}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Totals Footer */}
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-surface)' }}>
              <td colSpan={4} style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                Grand Total ({filteredTransactions.length} entries)
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatINR(totals.dr)}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#34c759' }}>
                {formatINR(totals.cr)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Pagination */}
        <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {paginatedTxs.length} of {filteredTransactions.length} entries
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="sidebar-btn" style={{ width: 'auto', padding: '4px' }} disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Page {page} of {totalPages}</span>
            <button className="sidebar-btn" style={{ width: 'auto', padding: '4px' }} disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <ManualEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onConfirm={handleManualEntry}
      />
    </>
  );
}

// ─── Sub-Tab: General Ledger Book ────────────────────────────────────────────
function GeneralLedgerBookTab({ period }) {
  const [selectedAccount, setSelectedAccount] = useState('Cash and Bank');
  const [viewMode, setViewMode] = useState('3year'); // '3year' or 'single'
  const [selectedFY, setSelectedFY] = useState(LedgerEngine.getCurrentFiscalYear());
  const [accountSearch, setAccountSearch] = useState('');

  const groupedAccounts = useMemo(() => getGroupedAccounts(), []);

  // Filter accounts in dropdown based on search
  const filteredGroups = useMemo(() => {
    if (!accountSearch) return groupedAccounts;
    const q = accountSearch.toLowerCase();
    return groupedAccounts
      .map(g => ({
        ...g,
        accounts: g.accounts.filter(a => a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q))
      }))
      .filter(g => g.accounts.length > 0);
  }, [groupedAccounts, accountSearch]);

  // Compute ledger data
  const threeYearData = useMemo(() => LedgerEngine.getThreeYearLedger(selectedAccount), [selectedAccount]);
  const singleFYData = useMemo(() => LedgerEngine.getAccountLedger(selectedAccount, selectedFY), [selectedAccount, selectedFY]);


  // KPI Totals
  const kpis = useMemo(() => {
    if (viewMode === '3year') {
      return {
        totalDebits: threeYearData.grandTotalDebits,
        totalCredits: threeYearData.grandTotalCredits,
        netBalance: threeYearData.finalClosingBalance,
        balanceType: threeYearData.finalClosingBalanceType,
        label: '3-Year Cumulative'
      };
    } else {
      return {
        totalDebits: singleFYData.totalDebits,
        totalCredits: singleFYData.totalCredits,
        netBalance: singleFYData.closingBalance,
        balanceType: singleFYData.closingBalanceType,
        label: singleFYData.periodName
      };
    }
  }, [viewMode, threeYearData, singleFYData]);

  // Export handler
  const handleExportLedgerPDF = useCallback(() => {
    const cleanName = selectedAccount.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
    if (viewMode === '3year') {
      exportMultiYearLedgerToPDF(
        selectedAccount,
        threeYearData,
        `Ledger_${cleanName}_3Years.pdf`
      );
    } else {
      // Build ledger rows for single-FY export
      const ledgerRows = [];
      // Opening balance row
      ledgerRows.push({
        date: singleFYData.startDate,
        particulars: 'To / By Opening Balance b/f',
        ref: 'OP-BAL',
        debit: singleFYData.openingBalance > 0 && singleFYData.isDebitNormal ? singleFYData.openingBalance : 0,
        credit: singleFYData.openingBalance > 0 && !singleFYData.isDebitNormal ? singleFYData.openingBalance : 0,
        runningBalance: Math.abs(singleFYData.openingBalance),
        balanceType: singleFYData.openingBalanceType,
        isHeader: true,
        isTotal: false
      });
      // Transaction entries
      singleFYData.entries.forEach(e => {
        ledgerRows.push({
          date: e.date,
          particulars: e.particulars,
          name: e.particulars,
          ref: e.ref,
          debit: e.debit,
          credit: e.credit,
          runningBalance: e.runningBalance,
          balanceType: e.balanceType,
          isHeader: false,
          isTotal: false
        });
      });
      // Totals row
      ledgerRows.push({
        date: singleFYData.endDate,
        particulars: `TOTALS FOR ${singleFYData.periodName}`,
        ref: '',
        debit: singleFYData.totalDebits,
        credit: singleFYData.totalCredits,
        runningBalance: undefined,
        balance: undefined,
        isHeader: false,
        isTotal: true
      });
      // Closing balance row
      ledgerRows.push({
        date: singleFYData.endDate,
        particulars: `Closing Balance c/f (${singleFYData.closingBalanceType})`,
        ref: 'CL-BAL',
        debit: 0,
        credit: 0,
        runningBalance: singleFYData.closingBalance,
        balanceType: singleFYData.closingBalanceType,
        isHeader: true,
        isTotal: true
      });
      const fyLabel = selectedFY.replace(/\s+/g, '_');
      exportToPDF(
        `General Ledger: ${selectedAccount} — ${singleFYData.periodName}`,
        ledgerRows,
        `Ledger_${cleanName}_${fyLabel}.pdf`,
        { isLedger: true, subTitle: `General Ledger Account: ${selectedAccount} — ${singleFYData.periodName}` }
      );
    }
  }, [viewMode, selectedAccount, threeYearData, singleFYData, selectedFY]);

  return (
    <>
      {/* Controls Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Account Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none', minWidth: '260px', maxWidth: '360px' }}
            >
              {filteredGroups.map(g => (
                <optgroup key={g.label} label={`── ${g.label} ──`}>
                  {g.accounts.map(a => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Search accounts */}
          <div className="command-bar-trigger" style={{ width: '200px' }}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Search accounts..."
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%' }}
            />
          </div>

          <div style={{ width: '1px', height: '28px', background: 'var(--border)' }}></div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setViewMode('3year')}
              style={{
                padding: '5px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                background: viewMode === '3year' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === '3year' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: viewMode === '3year' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              All 3 FYs
            </button>
            <button
              onClick={() => setViewMode('single')}
              style={{
                padding: '5px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                background: viewMode === 'single' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'single' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'single' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Selected FY
            </button>
          </div>

          {viewMode === 'single' && (
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, outline: 'none' }}
            >
              <option value="FY 2024-25">FY 2024-25</option>
              <option value="FY 2025-26">FY 2025-26</option>
              <option value={LedgerEngine.getCurrentFiscalYear()}>{LedgerEngine.getCurrentFiscalYear()} (Current)</option>
            </select>
          )}
        </div>

        <button
          className="sidebar-btn"
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontWeight: 600, fontSize: '12px' }}
          onClick={handleExportLedgerPDF}
          title="Export Ledger Book as statutory PDF"
        >
          <Download size={14} /> Export Ledger PDF
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Total Debits ({kpis.label})</div>
          <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatINR(kpis.totalDebits)}</div>
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Total Credits ({kpis.label})</div>
          <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#34c759' }}>{formatINR(kpis.totalCredits)}</div>
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Net Current Balance</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatINR(Math.abs(kpis.netBalance))}</span>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px',
              background: kpis.balanceType === 'Dr.' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: kpis.balanceType === 'Dr.' ? '#3b82f6' : '#10b981'
            }}>
              {kpis.balanceType}
            </span>
          </div>
        </div>
      </div>

      {/* Ledger Tables */}
      {viewMode === '3year' ? (
        // ── 3-Year Bifurcated View ──
        threeYearData.years.map((fy, fyIdx) => (
          <FYLedgerTable key={fy.periodName} fy={fy} fyIdx={fyIdx} />
        ))
      ) : (
        // ── Single FY View ──
        <FYLedgerTable fy={singleFYData} fyIdx={0} />
      )}
    </>
  );
}

// ─── Reusable FY Ledger Table Component ──────────────────────────────────────
function FYLedgerTable({ fy, fyIdx }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
      {/* FY Header Banner */}
      <div style={{
        padding: '14px 20px',
        background: 'linear-gradient(135deg, rgba(6, 64, 43, 0.06), rgba(6, 64, 43, 0.02))',
        borderBottom: '2px solid rgba(6, 64, 43, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '8px', color: '#06402b' }}>●</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#06402b', letterSpacing: '0.3px' }}>
            {fy.periodName}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ({fy.startDate} to {fy.endDate})
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Opening: <strong style={{ color: 'var(--text-primary)' }}>{formatINR(Math.abs(fy.openingBalance))} {fy.openingBalanceType}</strong></span>
          <span style={{ color: 'var(--text-muted)' }}>Closing: <strong style={{ color: 'var(--text-primary)' }}>{formatINR(Math.abs(fy.closingBalance))} {fy.closingBalanceType}</strong></span>
        </div>
      </div>

      {/* Ledger Entry Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', width: '100px' }}>Date</th>
            <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Particulars (Contra Account)</th>
            <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', width: '100px' }}>Voucher Ref</th>
            <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right', width: '120px' }}>Debit (Dr.)</th>
            <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right', width: '120px' }}>Credit (Cr.)</th>
            <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right', width: '140px' }}>Running Balance</th>
          </tr>
        </thead>
        <tbody>
          {/* Opening Balance Row */}
          <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(241, 245, 249, 0.5)' }}>
            <td style={{ padding: '10px 16px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{fy.startDate}</td>
            <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>To / By Opening Balance b/f</td>
            <td style={{ padding: '10px 16px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>OP-BAL</td>
            <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
              {fy.openingBalance > 0 && fy.isDebitNormal ? formatINR(fy.openingBalance) : ''}
            </td>
            <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#34c759' }}>
              {fy.openingBalance > 0 && !fy.isDebitNormal ? formatINR(fy.openingBalance) : ''}
            </td>
            <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700 }}>
              {formatINR(Math.abs(fy.openingBalance))} {fy.openingBalanceType}
            </td>
          </tr>

          {/* Transaction Entries */}
          {fy.entries.map((e, idx) => (
            <tr
              key={e.id || idx}
              style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s', cursor: 'pointer' }}
              className="table-row-hover"
              onClick={() => { window.location.hash = `#/journal/${encodeURIComponent(e.ref)}`; }}
              title={e.narration || 'Click to view journal voucher'}
            >
              <td style={{ padding: '10px 16px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{e.date}</td>
              <td style={{ padding: '10px 16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{e.particulars}</div>
                {e.narration && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{e.narration}</div>}
              </td>
              <td style={{ padding: '10px 16px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{e.ref}</td>
              <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
                {e.debit > 0 ? formatINR(e.debit) : ''}
              </td>
              <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#34c759' }}>
                {e.credit > 0 ? formatINR(e.credit) : ''}
              </td>
              <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
                {formatINR(Math.abs(e.runningBalance))} {e.balanceType}
              </td>
            </tr>
          ))}
        </tbody>

        {/* Totals Footer */}
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-surface)' }}>
            <td colSpan={3} style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              Totals — {fy.periodName} ({fy.entries.length} entries)
            </td>
            <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatINR(fy.totalDebits)}
            </td>
            <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#34c759' }}>
              {formatINR(fy.totalCredits)}
            </td>
            <td style={{ padding: '12px 16px', textAlign: 'right' }}></td>
          </tr>
          <tr style={{ background: 'rgba(6, 64, 43, 0.04)', borderTop: '1px solid rgba(6, 64, 43, 0.12)' }}>
            <td colSpan={3} style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#06402b' }}>
              Closing Balance c/f
            </td>
            <td colSpan={2} style={{ padding: '12px 16px' }}></td>
            <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#06402b' }}>
              {formatINR(Math.abs(fy.closingBalance))} {fy.closingBalanceType}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Main TransactionList Component (Container with Sub-Tabs) ────────────────
function TransactionList({ period }) {
  const [activeSubTab, setActiveSubTab] = useState('daybook'); // 'daybook' | 'ledger'

  return (
    <div className="tab-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Sub-Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        background: 'var(--bg-surface)',
        padding: '4px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setActiveSubTab('daybook')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 20px', borderRadius: '9px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
            background: activeSubTab === 'daybook' ? 'var(--bg-card)' : 'transparent',
            color: activeSubTab === 'daybook' ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: activeSubTab === 'daybook' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Receipt size={15} />
          Day Book (Daily Journal)
        </button>
        <button
          onClick={() => setActiveSubTab('ledger')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 20px', borderRadius: '9px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
            background: activeSubTab === 'ledger' ? 'var(--bg-card)' : 'transparent',
            color: activeSubTab === 'ledger' ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: activeSubTab === 'ledger' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <BookOpen size={15} />
          General Ledger Book
        </button>
      </div>

      {/* Sub-Tab Content */}
      {activeSubTab === 'daybook' ? (
        <DayBookTab period={period} />
      ) : (
        <GeneralLedgerBookTab period={period} />
      )}
    </div>
  );
}

export default TransactionList;
