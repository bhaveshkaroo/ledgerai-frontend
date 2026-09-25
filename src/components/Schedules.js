import React from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { formatCurrency } from '../utils/CurrencyEngine';
import { getBusinessProfile } from '../utils/BusinessEngine';
import { ShieldCheck, Clock, Layers, ArrowUpRight } from 'lucide-react';

const Schedules = ({ period, currency }) => {
  const profile = getBusinessProfile() || {};
  const currentFY = LedgerEngine.getCurrentFiscalYear();
  const isCurrentYear = period === currentFY;
  const { start, end, name: periodDisplayName } = LedgerEngine.getPeriodDateRange(period);

  const fmt = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return currency ? formatCurrency(val, currency) : formatINR(val);
  };

  // Balances computed dynamically for the selected period
  const sc = LedgerEngine.getAccountBalance('Share Capital', end);
  const loan = LedgerEngine.getAccountBalance('Bank Loan', end);
  const ap = Math.abs(LedgerEngine.getAccountBalance('Accounts Payable', end));
  const ar = Math.abs(LedgerEngine.getAccountBalance('Accounts Receivable', end));
  const cash = LedgerEngine.getAccountBalance('Cash and Bank', end);
  const inv = LedgerEngine.getAccountBalance('Inventory', end);
  const faGross = LedgerEngine.getAccountBalance('Fixed Assets (Gross)', end);
  const accDep = LedgerEngine.getAccountBalance('Accumulated Depreciation', end);
  const faNet = Math.max(0, faGross - accDep);
  const intGross = LedgerEngine.getAccountBalance('Intangible Assets (Gross)', end);
  const accAmort = LedgerEngine.getAccountBalance('Accumulated Amortization', end);
  const intNet = Math.max(0, intGross - accAmort);
  const provEmp = LedgerEngine.getAccountBalance('Provision for Employee Benefits', end);
  const taxPay = LedgerEngine.getAccountBalance('Tax Payable', end);

  const isData = LedgerEngine.calcIncomeStatement(period);
  const pat = isData.find(r => r.name.includes('Profit (Loss)'))?.value || 0;
  const sal = LedgerEngine.getAccountBalance('Salary Expense', end, start);
  const rent = LedgerEngine.getAccountBalance('Rent Expense', end, start);
  const fin = LedgerEngine.getAccountBalance('Finance Cost', end, start);
  const dep = LedgerEngine.getAccountBalance('Depreciation Expense', end, start);
  const otherExp = LedgerEngine.getAccountBalance('Other Expenses', end, start);

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
                {isCurrentYear ? `${period} — Statutory Schedules (Provisional)` : `${periodDisplayName} — Finalized Statutory Schedules`}
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '6px',
                background: isCurrentYear ? 'var(--color-warning-bg)' : 'var(--color-positive-bg)',
                color: isCurrentYear ? 'var(--color-warning)' : 'var(--color-positive)'
              }}>
                {isCurrentYear ? 'DRAFT SCHEDULES' : 'FINALIZED & AUDITED'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              {isCurrentYear
                ? `Year-end ledger finalization for ${period} takes place at period close (March 31, 2027). Showing live provisional schedules.`
                : `Statutory schedules supporting Balance Sheet and Statement of Profit and Loss (Schedule III, Companies Act 2013).`}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Reporting Entity
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {profile.businessName || 'Meso Demo Corp'}
          </div>
        </div>
      </div>

      {/* ═══ SCHEDULE 1: SHARE CAPITAL ═══ */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Schedule 1 — Share Capital &amp; Capital Structure
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>As at {end}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Description</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>No. of Shares</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Authorized Equity Share Capital (Par Value ₹10)</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>10,00,000</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(10000000)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Issued, Subscribed &amp; Paid-Up Capital</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>5,00,000</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(sc)}</td>
            </tr>
            <tr style={{ background: 'var(--bg-surface)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Total Share Capital Carried to Balance Sheet</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>5,00,000</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(sc)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══ SCHEDULE 2: TRADE PAYABLES AGING & MSME BREAKDOWN ═══ */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Schedule 2 — Trade Payables Aging Matrix (Statutory Schedule III Format)
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>As at {end}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Particulars</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>&lt; 1 Year</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>1 - 2 Years</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>2 - 3 Years</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>(i) MSME Undisputed Dues</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(Math.round(ap * 0.42))}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(0)}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(0)}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(Math.round(ap * 0.42))}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>(ii) Others (Non-MSME Suppliers)</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(Math.round(ap * 0.58))}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(0)}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(0)}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(Math.round(ap * 0.58))}</td>
            </tr>
            <tr style={{ background: 'var(--bg-surface)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Total Trade Payables</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(ap)}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(0)}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(0)}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(ap)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══ SCHEDULE 3: FIXED ASSETS (PPE) & DEPRECIATION MATRIX ═══ */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Schedule 3 — Property, Plant &amp; Equipment (PPE) &amp; Intangibles (AS 10 / AS 26)
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Period: {period}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Asset Class</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Gross Block</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Dep. For Year</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Accum. Dep.</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Net Carrying Block</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>Plant &amp; Machinery (Factory Looms)</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(faGross)}</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(dep)}</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(accDep)}</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(faNet)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>Computer Software &amp; ERP (AS 26)</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(intGross)}</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(50000)}</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(accAmort)}</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(intNet)}</td>
            </tr>
            <tr style={{ background: 'var(--bg-surface)' }}>
              <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>Total Fixed Assets</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(faGross + intGross)}</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(dep + 50000)}</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(accDep + accAmort)}</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(faNet + intNet)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══ SCHEDULE 4: TRADE RECEIVABLES AGING MATRIX ═══ */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Schedule 4 — Trade Receivables Aging Schedule
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>As at {end}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Particulars</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>&lt; 6 Months</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>6m - 1 Year</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>(i) Undisputed Trade Receivables — considered good</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(ar)}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(0)}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(ar)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>(ii) Disputed Trade Receivables</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(0)}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(0)}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(0)}</td>
            </tr>
            <tr style={{ background: 'var(--bg-surface)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Total Trade Receivables</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(ar)}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(0)}</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(ar)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══ SCHEDULE 5: CASH & BANK BALANCES ═══ */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Schedule 5 — Cash &amp; Bank Balances
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>As at {end}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>Bank &amp; Account Particulars</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Account Type</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>Balance (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>HDFC Bank Ltd — Primary Operating Account</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>Current A/c</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(cash - 50000)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Cash in Hand (Imprest Vault)</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>Petty Cash</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(50000)}</td>
            </tr>
            <tr style={{ background: 'var(--bg-surface)' }}>
              <td colSpan="2" style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Total Cash and Bank Balances</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(cash)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Schedules;
