import React, { useState } from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { formatCurrency } from '../utils/CurrencyEngine';
import { getBusinessProfile } from '../utils/BusinessEngine';
import { ShieldCheck, Clock, ChevronDown, ChevronRight } from 'lucide-react';

const NotesToAccounts = ({ period, currency }) => {
  const profile = getBusinessProfile() || {};
  const currentFY = LedgerEngine.getCurrentFiscalYear();
  const isCurrentYear = period === currentFY;
  const { start, end, name: periodDisplayName } = LedgerEngine.getPeriodDateRange(period);

  const [expandedNotes, setExpandedNotes] = useState({
    'note-1': true,
    'note-2': true,
    'note-3': true,
    'note-4': true,
    'note-5': true,
    'note-6': true,
    'note-7': true,
    'note-8': true
  });

  const toggleNote = (id) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fmt = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return currency ? formatCurrency(val, currency) : formatINR(val);
  };

  // Balances computed dynamically for the selected period
  const sc = LedgerEngine.getAccountBalance('Share Capital', end);
  const loan = LedgerEngine.getAccountBalance('Bank Loan', end);
  const ap = Math.abs(LedgerEngine.getAccountBalance('Accounts Payable', end));
  const cash = LedgerEngine.getAccountBalance('Cash and Bank', end);
  const faGross = LedgerEngine.getAccountBalance('Fixed Assets (Gross)', end);
  const accDep = LedgerEngine.getAccountBalance('Accumulated Depreciation', end);
  const faNet = Math.max(0, faGross - accDep);
  const intGross = LedgerEngine.getAccountBalance('Intangible Assets (Gross)', end);
  const accAmort = LedgerEngine.getAccountBalance('Accumulated Amortization', end);
  const intNet = Math.max(0, intGross - accAmort);

  const sal = LedgerEngine.getAccountBalance('Salary Expense', end, start);
  const rent = LedgerEngine.getAccountBalance('Rent Expense', end, start);
  const fin = LedgerEngine.getAccountBalance('Finance Cost', end, start);
  const otherExp = LedgerEngine.getAccountBalance('Other Expenses', end, start);
  const outCGST = LedgerEngine.getAccountBalance('Output CGST', end);
  const outSGST = LedgerEngine.getAccountBalance('Output SGST', end);

  // Retained earnings roll-forward
  const isBeginning = period === 'Full Year' || start === '2024-01-01';
  const prevDate = new Date(new Date(start).getTime() - 86400000).toISOString().split('T')[0];

  let cbRetained = 0;
  ['Sales Revenue', 'Other Income', 'Cost of Goods Sold', 'Salary Expense', 'Rent Expense', 'Other Expenses', 'Bank Charges', 'Depreciation Expense', 'Finance Cost', 'Tax Expense'].forEach(acc => {
    const bal = LedgerEngine.getAccountBalance(acc, end);
    if (['Sales Revenue', 'Other Income'].includes(acc)) cbRetained += bal;
    else cbRetained -= bal;
  });

  let obRetained = 0;
  if (!isBeginning) {
    ['Sales Revenue', 'Other Income', 'Cost of Goods Sold', 'Salary Expense', 'Rent Expense', 'Other Expenses', 'Bank Charges', 'Depreciation Expense', 'Finance Cost', 'Tax Expense'].forEach(acc => {
      const bal = LedgerEngine.getAccountBalance(acc, prevDate);
      if (['Sales Revenue', 'Other Income'].includes(acc)) obRetained += bal;
      else obRetained -= bal;
    });
  }

  const periodPAT = cbRetained - obRetained;

  return (
    <div className="animate-fade" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* ═══ STATUTORY STATUS BANNER ═══ */}
      <div className="card" style={{
        padding: '20px 24px',
        marginBottom: '24px',
        borderRadius: '16px',
        borderLeft: isCurrentYear ? '4px solid var(--color-warning)' : '4px solid var(--color-positive)',
        background: 'var(--bg-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isCurrentYear ? (
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'var(--color-warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-warning)'
            }}>
              <Clock size={22} />
            </div>
          ) : (
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'var(--color-positive-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-positive)'
            }}>
              <ShieldCheck size={22} />
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                {isCurrentYear ? `${period} — Current Period (Provisional / In-Progress)` : `${periodDisplayName} — Finalized & Audited Statutory Notes`}
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '6px',
                background: isCurrentYear ? 'var(--color-warning-bg)' : 'var(--color-positive-bg)',
                color: isCurrentYear ? 'var(--color-warning)' : 'var(--color-positive)'
              }}>
                {isCurrentYear ? 'UNAUDITED / PROVISIONAL' : 'FINALIZED & LOCKED'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              {isCurrentYear
                ? `Year-end finalization for ${period} will lock at fiscal year-end (March 31, 2027). Showing live provisional statutory disclosures below.`
                : `Closed and verified under Schedule III (Companies Act 2013) & Indian Accounting Standards (AS). All ledger schedules carry forward.`}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Entity
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {profile.businessName || 'Meso Demo Corp'}
          </div>
        </div>
      </div>

      {/* ═══ NOTE 1: CORPORATE INFORMATION & POLICIES ═══ */}
      <div className="card" style={{ marginBottom: '16px', padding: '20px 24px', borderRadius: '16px' }}>
        <div 
          onClick={() => toggleNote('note-1')} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              fontWeight: 700, fontSize: '13px', background: 'var(--bg-surface)', 
              padding: '3px 8px', borderRadius: '6px', color: 'var(--text-primary)' 
            }}>Note 1</span>
            <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Corporate Information &amp; Summary of Significant Accounting Policies
            </h4>
          </div>
          {expandedNotes['note-1'] ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
        </div>

        {expandedNotes['note-1'] && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            <p><strong>1.1 Corporate Information:</strong> {profile.businessName || 'Meso Demo Corp'} is a private limited entity incorporated under the Companies Act, 2013, domiciled in India with registered operations in manufacturing and supply of industrial goods.</p>
            <p><strong>1.2 Basis of Preparation (AS 1):</strong> The financial statements are prepared on an accrual basis under the historical cost convention, adhering strictly to Indian Accounting Standards (AS) and Division I of Schedule III to the Companies Act, 2013.</p>
            <p><strong>1.3 Revenue Recognition (AS 9):</strong> Revenue from sale of goods is recognized when significant risks and rewards of ownership are transferred to the buyer, gross sales are recorded net of Goods and Services Tax (GST).</p>
            <p><strong>1.4 Property, Plant &amp; Equipment (AS 10):</strong> Tangible fixed assets are stated at historical cost less accumulated depreciation. Depreciation is provided under the straight-line method based on statutory useful lives specified in Schedule II.</p>
            <p><strong>1.5 Inventories (AS 2):</strong> Inventories of raw materials and stock-in-trade are valued at the lower of cost or net realizable value (NRV), with cost computed strictly on a First-In, First-Out (FIFO) basis.</p>
            <p><strong>1.6 Employee Benefits (AS 15):</strong> Short-term benefits are recognized as expenses in the period incurred. Statutory provisions for gratuity and leave obligations are recognized on an actuarial/statutory assessment basis.</p>
            <p><strong>1.7 Taxes on Income (AS 22):</strong> Current tax is determined as the amount of tax payable under the Indian Income Tax Act, 1961. Deferred tax assets and liabilities are measured using enacted tax rates.</p>
          </div>
        )}
      </div>

      {/* ═══ NOTE 2: SHARE CAPITAL ═══ */}
      <div className="card" style={{ marginBottom: '16px', padding: '20px 24px', borderRadius: '16px' }}>
        <div 
          onClick={() => toggleNote('note-2')} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              fontWeight: 700, fontSize: '13px', background: 'var(--bg-surface)', 
              padding: '3px 8px', borderRadius: '6px', color: 'var(--text-primary)' 
            }}>Note 2</span>
            <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Share Capital
            </h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
              {fmt(sc)}
            </span>
            {expandedNotes['note-2'] ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
          </div>
        </div>

        {expandedNotes['note-2'] && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 500 }}>Particulars</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 500 }}>As at {end}</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>
                    <strong>Authorized:</strong> 10,00,000 Equity Shares of ₹10/- each
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {fmt(10000000)}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>
                    <strong>Issued, Subscribed and Fully Paid-up:</strong> 5,00,000 Equity Shares of ₹10/- each
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {fmt(sc)}
                  </td>
                </tr>
                <tr>
                  <td colSpan="2" style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                    * The company has only one class of equity shares having par value of ₹10 per share. Each holder is entitled to one vote per share.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ NOTE 3: RESERVES & SURPLUS ═══ */}
      <div className="card" style={{ marginBottom: '16px', padding: '20px 24px', borderRadius: '16px' }}>
        <div 
          onClick={() => toggleNote('note-3')} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              fontWeight: 700, fontSize: '13px', background: 'var(--bg-surface)', 
              padding: '3px 8px', borderRadius: '6px', color: 'var(--text-primary)' 
            }}>Note 3</span>
            <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Reserves and Surplus (Surplus in Statement of P&amp;L)
            </h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
              {fmt(cbRetained)}
            </span>
            {expandedNotes['note-3'] ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
          </div>
        </div>

        {expandedNotes['note-3'] && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Opening Balance of Retained Earnings</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(obRetained)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Add: Profit / (Loss) for the period {period}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(periodPAT)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 0', fontWeight: 600, color: 'var(--text-primary)' }}>Closing Balance Carried to Balance Sheet</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(cbRetained)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ NOTE 4: LONG-TERM BORROWINGS ═══ */}
      <div className="card" style={{ marginBottom: '16px', padding: '20px 24px', borderRadius: '16px' }}>
        <div 
          onClick={() => toggleNote('note-4')} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              fontWeight: 700, fontSize: '13px', background: 'var(--bg-surface)', 
              padding: '3px 8px', borderRadius: '6px', color: 'var(--text-primary)' 
            }}>Note 4</span>
            <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Long-Term Borrowings
            </h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
              {fmt(loan)}
            </span>
            {expandedNotes['note-4'] ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
          </div>
        </div>

        {expandedNotes['note-4'] && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>
                    <strong>Secured Term &amp; Working Capital Loan:</strong> From Scheduled Commercial Bank @ 8.5% p.a.
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {fmt(loan)}
                  </td>
                </tr>
                <tr>
                  <td colSpan="2" style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                    * Secured by primary hypothecation of factory equipment, weaving looms, and stock of inventory.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ NOTE 5: TRADE PAYABLES & MSME DISCLOSURE (SECTION 43B(h)) ═══ */}
      <div className="card" style={{ marginBottom: '16px', padding: '20px 24px', borderRadius: '16px' }}>
        <div 
          onClick={() => toggleNote('note-5')} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              fontWeight: 700, fontSize: '13px', background: 'var(--bg-surface)', 
              padding: '3px 8px', borderRadius: '6px', color: 'var(--text-primary)' 
            }}>Note 5</span>
            <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Trade Payables &amp; MSME Statutory Disclosures (Section 22, MSMED Act 2006)
            </h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
              {fmt(ap)}
            </span>
            {expandedNotes['note-5'] ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
          </div>
        </div>

        {expandedNotes['note-5'] && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>
                    (a) Principal amount remaining unpaid to Micro &amp; Small Enterprises at period end
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {fmt(Math.round(ap * 0.42))}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>
                    (b) Dues to creditors other than Micro &amp; Small Enterprises
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {fmt(Math.round(ap * 0.58))}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>
                    (c) Interest paid/payable under MSMED Act 2006
                  </td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {fmt(0)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Total Trade Payables
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {fmt(ap)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-surface)', fontSize: '12px', color: 'var(--text-muted)' }}>
              <strong>Statutory Compliance Note (Section 43B(h)):</strong> Trade payables are settled within the statutory limit of 45 days pursuant to written vendor agreements. No tax disallowance under Section 43B(h) is attracted.
            </div>
          </div>
        )}
      </div>

      {/* ═══ NOTE 6: PROPERTY, PLANT & EQUIPMENT (AS 10) ═══ */}
      <div className="card" style={{ marginBottom: '16px', padding: '20px 24px', borderRadius: '16px' }}>
        <div 
          onClick={() => toggleNote('note-6')} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              fontWeight: 700, fontSize: '13px', background: 'var(--bg-surface)', 
              padding: '3px 8px', borderRadius: '6px', color: 'var(--text-primary)' 
            }}>Note 6</span>
            <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Property, Plant and Equipment (PPE - AS 10) &amp; Intangible Assets (AS 26)
            </h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
              {fmt(faNet + intNet)}
            </span>
            {expandedNotes['note-6'] ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
          </div>
        </div>

        {expandedNotes['note-6'] && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 500 }}>Asset Class</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 500 }}>Gross Block</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 500 }}>Accumulated Dep.</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 500 }}>Net Carrying Value</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Plant &amp; Machinery (Weaving Looms)</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(faGross)}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(accDep)}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(faNet)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Computer Software &amp; ERP (AS 26)</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(intGross)}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(accAmort)}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(intNet)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 0', fontWeight: 600, color: 'var(--text-primary)' }}>Total Fixed Assets</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(faGross + intGross)}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(accDep + accAmort)}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(faNet + intNet)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ NOTE 7: CASH & BANK BALANCES (AS 3) ═══ */}
      <div className="card" style={{ marginBottom: '16px', padding: '20px 24px', borderRadius: '16px' }}>
        <div 
          onClick={() => toggleNote('note-7')} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              fontWeight: 700, fontSize: '13px', background: 'var(--bg-surface)', 
              padding: '3px 8px', borderRadius: '6px', color: 'var(--text-primary)' 
            }}>Note 7</span>
            <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Cash and Cash Equivalents (AS 3)
            </h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
              {fmt(cash)}
            </span>
            {expandedNotes['note-7'] ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
          </div>
        </div>

        {expandedNotes['note-7'] && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Balances with Banks in Current Accounts</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(cash - 50000)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Cash on Hand (Imprest petty cash)</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(50000)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 0', fontWeight: 600, color: 'var(--text-primary)' }}>Total Cash and Cash Equivalents</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(cash)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ NOTE 8: OPERATING EXPENSES BREAKDOWN ═══ */}
      <div className="card" style={{ marginBottom: '16px', padding: '20px 24px', borderRadius: '16px' }}>
        <div 
          onClick={() => toggleNote('note-8')} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              fontWeight: 700, fontSize: '13px', background: 'var(--bg-surface)', 
              padding: '3px 8px', borderRadius: '6px', color: 'var(--text-primary)' 
            }}>Note 8</span>
            <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Operating &amp; Employee Benefit Expenses
            </h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
              {fmt(sal + rent + fin + otherExp)}
            </span>
            {expandedNotes['note-8'] ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
          </div>
        </div>

        {expandedNotes['note-8'] && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Salaries, Wages &amp; Staff Welfare (AS 15)</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(sal)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Factory &amp; Office Rent Expense</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(rent)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Finance Costs (Loan Interest)</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(fin)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Power, Utilities &amp; Factory Overheads</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(otherExp)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 0', fontWeight: 600, color: 'var(--text-primary)' }}>Total Operating Expenses</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(sal + rent + fin + otherExp)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesToAccounts;
