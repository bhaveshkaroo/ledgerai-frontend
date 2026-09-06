import React, { useState, useMemo } from 'react';
import { BRSEngine } from '../utils/BRSEngine';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { Landmark, CheckCircle2, AlertTriangle, ArrowDownLeft, ArrowUpRight, Plus, RefreshCw, Upload, FileText, Check } from 'lucide-react';

const availableMonths = [
  { value: '2026-09-30', label: 'September 2026 (Current)' },
  { value: '2026-08-31', label: 'August 2026' },
  { value: '2026-07-31', label: 'July 2026' },
  { value: '2026-06-30', label: 'June 2026' },
  { value: '2026-05-31', label: 'May 2026' },
  { value: '2026-04-30', label: 'April 2026' },
  { value: '2026-03-31', label: 'March 2026 (FY 2025-26 Year End)' },
  { value: '2025-12-31', label: 'December 2025' },
  { value: '2025-09-30', label: 'September 2025' },
  { value: '2025-03-31', label: 'March 2025' }
];

function BankReconciliation() {
  const [asOfDate, setAsOfDate] = useState('2026-09-30');
  const [bankEntries, setBankEntries] = useState(() => BRSEngine.getSampleBankStatement('2026-09-30'));
  const [activeTab, setActiveTab] = useState('summary');
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);

  const handleMonthChange = (date) => {
    setAsOfDate(date);
    setBankEntries(BRSEngine.getSampleBankStatement(date));
    setFeedbackMsg({ type: 'success', text: `Reconciliation recalculated as at ${availableMonths.find(m => m.value === date)?.label || date}.` });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Compute bank balance directly from statement
  const currentBankBalance = useMemo(() => {
    return bankEntries.reduce((sum, e) => e.type === 'Deposit' ? sum + e.amount : sum - e.amount, 0);
  }, [bankEntries]);

  // Run reconciliation algorithm
  const reconResult = useMemo(() => {
    return BRSEngine.reconcile(bankEntries, asOfDate);
  }, [bankEntries, asOfDate]);

  // Compute reconciled balances
  const balances = useMemo(() => {
    return BRSEngine.computeBalances(reconResult, currentBankBalance);
  }, [reconResult, currentBankBalance]);

  const handlePostBankItem = (item) => {
    try {
      BRSEngine.postBankItem(item);
      // Re-trigger calculation by updating state
      setBankEntries([...bankEntries]);
      setFeedbackMsg({ type: 'success', text: `Posted "${item.description}" (₹${formatINR(item.amount)}) directly to General Ledger.` });
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    try {
      // Parse CSV format: Date, Description, Amount, Type (Deposit/Withdrawal), Ref
      const lines = pasteText.trim().split('\n');
      const parsed = lines.map((line, idx) => {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length < 3) throw new Error(`Invalid format on line ${idx + 1}`);
        const date = parts[0];
        const description = parts[1];
        const amount = parseFloat(parts[2].replace(/[^0-9.-]+/g, ''));
        const type = (parts[3] || '').toLowerCase().includes('dep') || (parts[3] || '').toLowerCase().includes('cr') ? 'Deposit' : 'Withdrawal';
        const ref = parts[4] || `CSV-${idx + 1}`;
        return { id: `CSV-${Date.now()}-${idx}`, date, description, amount, type, ref };
      });

      setBankEntries(parsed);
      setShowPasteModal(false);
      setPasteText('');
      setFeedbackMsg({ type: 'success', text: `Successfully loaded ${parsed.length} statement entries from CSV.` });
    } catch (err) {
      alert(`Failed to parse statement: ${err.message}. Format: Date, Description, Amount, Type (Deposit/Withdrawal), Reference`);
    }
  };

  return (
    <div className="tab-content" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Bank Reconciliation Statement (BRS)</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Reconciliation as at {availableMonths.find(m => m.value === asOfDate)?.label || asOfDate} &middot; AS 3 / Cash &amp; Bank
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={asOfDate}
            onChange={(e) => handleMonthChange(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {availableMonths.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <button 
            className="sidebar-btn" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => {
              setBankEntries(BRSEngine.getSampleBankStatement(asOfDate));
              setFeedbackMsg({ type: 'success', text: `Loaded fresh sample bank statement for ${availableMonths.find(m => m.value === asOfDate)?.label || asOfDate}.` });
              setTimeout(() => setFeedbackMsg(null), 3000);
            }}
          >
            <RefreshCw size={14} /> Reset
          </button>
          <button 
            className="action-btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'var(--text-primary)', color: 'var(--bg-card)', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
            onClick={() => setShowPasteModal(true)}
          >
            <Upload size={14} /> Upload / Paste CSV
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: feedbackMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          color: feedbackMsg.type === 'success' ? '#10b981' : '#ef4444',
          border: `1px solid ${feedbackMsg.type === 'success' ? '#10b981' : '#ef4444'}`
        }}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {feedbackMsg.text}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Bank Statement Balance</div>
          <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatINR(balances.bankBalance)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>As per Bank Feed / Statement</div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Cash &amp; Bank Book Balance</div>
          <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatINR(balances.bookBalance)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>As per General Ledger</div>
        </div>

        <div className="card" style={{ padding: '20px', background: balances.isReconciled ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)' }}>
          <div style={{ fontSize: '11px', color: balances.isReconciled ? '#10b981' : '#ef4444', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {balances.isReconciled ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {balances.isReconciled ? 'Reconciled Adjusted Balance' : 'Unreconciled Variance'}
          </div>
          <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: balances.isReconciled ? '#10b981' : '#ef4444' }}>
            {formatINR(balances.adjustedBankBalance)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {balances.isReconciled ? 'Difference: ₹0 (Perfect Equilibrium)' : `Discrepancy: ${formatINR(balances.difference)}`}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="statements-nav" style={{ 
        display: 'flex', gap: '20px', borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-6)', overflowX: 'auto'
      }}>
        {[
          { id: 'summary', label: 'Reconciliation Statement' },
          { id: 'cheques', label: `Outstanding Cheques (${reconResult.outstandingCheques.length})` },
          { id: 'deposits', label: `Deposits in Transit (${reconResult.depositsInTransit.length})` },
          { id: 'unbooked', label: `Bank-Only Items (${reconResult.bankOnlyItems.length})` },
          { id: 'variance', label: `Unexplained Variance (${reconResult.unexplainedVariance.length})` }
        ].map(tab => (
          <div 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              paddingBottom: '12px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--text-primary)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'summary' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Particulars</th>
                <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 600 }}>Balance as per Bank Statement</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
                  {formatINR(balances.bankBalance)}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '12px 24px', fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '36px' }}>
                  Add: Deposits in Transit (recorded in books, not yet credited by bank)
                </td>
                <td style={{ padding: '12px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#10b981' }}>
                  +{formatINR(reconResult.depositsInTransit.reduce((s, x) => s + x.amount, 0))}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '12px 24px', fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '36px' }}>
                  Less: Outstanding Cheques (issued in books, not yet presented at bank)
                </td>
                <td style={{ padding: '12px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#ef4444' }}>
                  -{formatINR(reconResult.outstandingCheques.reduce((s, x) => s + x.amount, 0))}
                </td>
              </tr>
              <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-surface)' }}>
                <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 700 }}>Adjusted Bank Balance</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700 }}>
                  {formatINR(balances.adjustedBankBalance)}
                </td>
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 600 }}>Balance as per Cash and Bank Ledger</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
                  {formatINR(balances.bookBalance)}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '12px 24px', fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '36px' }}>
                  Add: Direct Bank Deposits (interest/credits not yet in ledger)
                </td>
                <td style={{ padding: '12px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#10b981' }}>
                  +{formatINR(reconResult.bankOnlyItems.filter(i => i.type === 'Deposit').reduce((s, x) => s + x.amount, 0))}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '12px 24px', fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '36px' }}>
                  Less: Direct Bank Charges &amp; Fees (unbooked withdrawals)
                </td>
                <td style={{ padding: '12px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#ef4444' }}>
                  -{formatINR(reconResult.bankOnlyItems.filter(i => i.type === 'Withdrawal').reduce((s, x) => s + x.amount, 0))}
                </td>
              </tr>
              <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-surface)' }}>
                <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 700 }}>Adjusted Book Balance</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700 }}>
                  {formatINR(balances.adjustedBookBalance)}
                </td>
              </tr>

              <tr style={{ background: balances.isReconciled ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>
                <td style={{ padding: '14px 24px', fontSize: '14px', fontWeight: 700 }}>
                  Net Variance (Adjusted Bank − Adjusted Book)
                </td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: balances.isReconciled ? '#10b981' : '#ef4444' }}>
                  {formatINR(balances.difference)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'cheques' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description / Payee</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Book Ref</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {reconResult.outstandingCheques.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No outstanding cheques. All book payments cleared in bank.
                  </td>
                </tr>
              ) : (
                reconResult.outstandingCheques.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                    <td style={{ padding: '14px 20px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{t.date}</td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 500 }}>{t.narration}</td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{t.ref}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>{formatINR(t.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'deposits' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description / Payer</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Book Ref</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {reconResult.depositsInTransit.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No deposits in transit. All collections credited by bank.
                  </td>
                </tr>
              ) : (
                reconResult.depositsInTransit.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                    <td style={{ padding: '14px 20px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{t.date}</td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 500 }}>{t.narration}</td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{t.ref}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#10b981' }}>+{formatINR(t.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'unbooked' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bank Narration</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reconResult.bankOnlyItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No unbooked bank items. All bank entries exist in General Ledger.
                  </td>
                </tr>
              ) : (
                reconResult.bankOnlyItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                    <td style={{ padding: '14px 20px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{item.date}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{item.description}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Ref: {item.ref}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                        background: item.type === 'Withdrawal' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        color: item.type === 'Withdrawal' ? '#ef4444' : '#10b981'
                      }}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
                      {formatINR(item.amount)}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handlePostBankItem(item)}
                        className="action-btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          background: 'var(--text-primary)',
                          color: 'var(--bg-card)',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Post to Ledger
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'variance' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {reconResult.unexplainedVariance.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} /> No unexplained variances found. All entries accounted for.
            </div>
          ) : (
            <div>
              <div style={{ padding: '12px 20px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={14} /> The following bank entries could not be matched automatically and require manual audit review:
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                    <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</th>
                    <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reconResult.unexplainedVariance.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                      <td style={{ padding: '14px 20px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{item.date}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 500 }}>{item.description}</td>
                      <td style={{ padding: '14px 20px', fontSize: '12px' }}>{item.type}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>{formatINR(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Paste Statement Modal */}
      {showPasteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '560px', maxWidth: '90vw', padding: '24px', position: 'relative' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>Import Bank Statement (CSV)</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Paste comma-separated rows in format: <code>Date, Description, Amount, Type (Deposit/Withdrawal), Ref</code>
            </p>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="2026-03-31, Bank Service Charges, 500, Withdrawal, CHG-101&#10;2026-03-28, Interest Received, 1200, Deposit, INT-202"
              style={{ width: '100%', height: '140px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px', resize: 'none', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowPasteModal(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleParsePaste}
                style={{ flex: 2, padding: '10px', borderRadius: '6px', background: 'var(--text-primary)', color: 'var(--bg-card)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                Import Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BankReconciliation;
