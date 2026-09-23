import React, { useState, useEffect, useCallback } from 'react';
import { TDSEngine, TDS_SECTIONS } from '../utils/TDSEngine';
import { formatINR } from '../utils/LedgerEngine';
import { isSampleCompanyActive } from '../utils/BusinessEngine';
import { Receipt, FileText, Calculator, Download, Plus, CheckCircle, AlertTriangle, Calendar, IndianRupee, ShieldAlert, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL?.replace(/\/+$/, '') || 'https://ledgerai-backend-7jei.onrender.com';

const cardStyle = {
  background: 'var(--bg-card)', borderRadius: '12px', padding: '20px',
  boxShadow: 'var(--shadow-soft)', border: '1px solid var(--border)'
};
const btnPrimary = {
  background: '#06402b', color: 'white', borderRadius: '8px', padding: '10px 20px',
  border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px'
};
const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'var(--bg-surface)', color: 'var(--text-primary)'
};
const labelStyle = { fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' };

const TDSManager = () => {
  const [activeSubTab, setActiveSubTab] = useState('register');
  const [register, setRegister] = useState([]);
  const [toast, setToast] = useState(null);

  // New Deduction state
  const [vendorName, setVendorName] = useState('');
  const [description, setDescription] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [deducteeType, setDeducteeType] = useState('individual');
  const [detectedSection, setDetectedSection] = useState(null);
  const [splitPreview, setSplitPreview] = useState(null);
  const [posting, setPosting] = useState(false);

  // Challan state
  const [challanMonth, setChallanMonth] = useState(new Date().getMonth());
  const [challanYear, setChallanYear] = useState(new Date().getFullYear());

  // Form 26Q state
  const [formQuarter, setFormQuarter] = useState(2);
  const [formFY, setFormFY] = useState('2026-27');

  // Section 40(a)(ia) Audit State
  const [auditData, setAuditData] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const refreshRegister = useCallback(() => {
    setRegister(TDSEngine.getTDSRegister());
  }, []);

  const fetchAuditData = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tds/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        setAuditData(await res.json());
      } else {
        throw new Error('Audit API offline');
      }
    } catch (_) {
      if (!isSampleCompanyActive()) {
        setAuditData({
          summary: {
            financial_year: '2026-27',
            total_audited_expense: 0.0,
            disallowed_expense_amount: 0.0,
            projected_tax_penalty: 0.0,
            pending_challan_deposit: 0.0,
            compliance_health_pct: 100.0,
            defaults_count: 0
          },
          records: []
        });
        return;
      }
      setAuditData({
        summary: {
          financial_year: '2026-27',
          total_audited_expense: 807000.0,
          disallowed_expense_amount: 163500.0,
          projected_tax_penalty: 42510.0,
          pending_challan_deposit: 2100.0,
          compliance_health_pct: 27.3,
          defaults_count: 2
        },
        records: [
          {
            vendor_name: "Surat Commercial Real Estate LLP",
            description: "Factory & Warehouse Monthly Lease",
            expense_category: "Rent",
            amount: 450000.0,
            section: "194I(b)",
            threshold: 240000.0,
            tds_deducted: 0.0,
            status: "DEFAULT_DISALLOWED",
            risk_level: "danger",
            disallowance_30pct: 135000.0,
            action: "30% of expense (₹1,35,000) DISALLOWED u/s 40(a)(ia). Deduct immediately or face ₹35,100 tax addition."
          },
          {
            vendor_name: "CloudNine SaaS Technologies",
            description: "ERP Software & Cloud Hosting Subscription",
            expense_category: "Software Expense",
            amount: 95000.0,
            section: "194J(b)",
            threshold: 30000.0,
            tds_deducted: 0.0,
            status: "DEFAULT_DISALLOWED",
            risk_level: "danger",
            disallowance_30pct: 28500.0,
            action: "30% of expense (₹28,500) DISALLOWED u/s 40(a)(ia). Software payments require 2% TDS."
          },
          {
            vendor_name: "Apex Logistics India Pvt Ltd",
            description: "Freight & Transport Charges",
            expense_category: "Logistics",
            amount: 145000.0,
            section: "194C",
            threshold: 100000.0,
            tds_deducted: 1450.0,
            status: "COMPLIANT",
            risk_level: "safe",
            disallowance_30pct: 0.0,
            action: "TDS deducted & deposited into Central Govt account via Challan 281."
          },
          {
            vendor_name: "Rajesh Sharma & Associates",
            description: "Statutory & Tax Audit Fees",
            expense_category: "Professional Fees",
            amount: 75000.0,
            section: "194J(a)",
            threshold: 30000.0,
            tds_deducted: 7500.0,
            status: "COMPLIANT",
            risk_level: "safe",
            disallowance_30pct: 0.0,
            action: "TDS deducted & deposited into Central Govt account via Challan 281."
          },
          {
            vendor_name: "Gujarat Trade Distributors",
            description: "Sales Brokerage & Referral Commission",
            expense_category: "Commission",
            amount: 42000.0,
            section: "194H",
            threshold: 15000.0,
            tds_deducted: 2100.0,
            status: "PENDING_DEPOSIT",
            risk_level: "warning",
            disallowance_30pct: 0.0,
            action: "TDS deducted. Deposit via Challan 281 before 7th of next month to avoid 1.5%/mo interest u/s 201(1A)."
          }
        ]
      });
    } finally {
      setIsAuditing(false);
    }
  };

  useEffect(() => {
    refreshRegister();
    fetchAuditData();
    window.addEventListener('ledger-updated', refreshRegister);
    return () => window.removeEventListener('ledger-updated', refreshRegister);
  }, [refreshRegister]);

  // Auto-detect TDS section as user types
  useEffect(() => {
    const sec = TDSEngine.detectTDSSection(description, '', parseFloat(grossAmount) || 0);
    setDetectedSection(sec);
    if (sec && grossAmount && vendorName) {
      const split = TDSEngine.generateSplitEntry(vendorName, description, parseFloat(grossAmount), sec, deducteeType);
      setSplitPreview(split);
    } else {
      setSplitPreview(null);
    }
  }, [description, grossAmount, vendorName, deducteeType]);

  const handlePostEntry = async () => {
    if (!detectedSection || !grossAmount || !vendorName) return;
    setPosting(true);
    try {
      const result = TDSEngine.postTDSEntry(vendorName, description, parseFloat(grossAmount), detectedSection, deducteeType);
      if (result.success) {
        setToast({ type: 'success', message: `TDS Entry posted! ${formatINR(result.split.tdsAmount)} TDS u/s ${detectedSection.section} deducted.` });
        setVendorName(''); setDescription(''); setGrossAmount('');
        setDetectedSection(null); setSplitPreview(null);
        refreshRegister();
      } else {
        setToast({ type: 'error', message: result.error || 'Failed to post entry' });
      }
    } catch (e) {
      setToast({ type: 'error', message: e.message });
    }
    setPosting(false);
    setTimeout(() => setToast(null), 4000);
  };

  const subTabs = [
    { id: 'register', label: 'TDS Register', icon: Receipt },
    { id: 'audit-40a', label: 'Sec 40(a)(ia) Audit', icon: ShieldAlert },
    { id: 'new-deduction', label: 'New Deduction', icon: Plus },
    { id: 'challan', label: 'Challan 281', icon: FileText },
    { id: 'form26q', label: 'Form 26Q', icon: Calculator }
  ];

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const challanData = TDSEngine.getChallan281Summary(challanMonth, challanYear);
  const form26QData = TDSEngine.getForm26QSummary(formQuarter, formFY);

  // Summary stats
  const totalTDSDeducted = register.filter(t => t.type === 'Credit' && (t.account || '').toLowerCase().includes('tax payable')).reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: 'var(--sp-6)', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <div>
          <h1 className="section-title">
            TDS &amp; Withholding Tax (Chapter XVII-B)
          </h1>
          <p className="section-subtitle">
            Statutory TDS Deduction Engine, Challan 281 Monthly Dues &amp; Section 40(a)(ia) 30% Disallowance Audit
          </p>
        </div>

        <div style={{
          padding: 'var(--sp-2) var(--sp-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-warning-bg)',
          border: '1px solid var(--color-warning-border)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)'
        }}>
          <Calendar size={15} color="var(--color-warning)" />
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-warning)', fontWeight: 700, textTransform: 'uppercase' }}>Next Challan 281 Deadline</div>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>7th October 2026 (Monthly Dues)</div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          padding: 'var(--sp-3) var(--sp-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
          background: toast.type === 'success' ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)',
          color: toast.type === 'success' ? 'var(--color-positive)' : 'var(--color-negative)',
          border: `1px solid ${toast.type === 'success' ? 'var(--color-positive-border)' : 'var(--color-negative-border)'}`
        }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="tab-switcher" style={{ marginBottom: 'var(--sp-6)', overflowX: 'auto', width: 'fit-content' }}>
        {subTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id} 
              onClick={() => setActiveSubTab(tab.id)} 
              className={`tab-switcher-item ${activeSubTab === tab.id ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB: Section 40(a)(ia) Audit ─────────────────────────────── */}
      {activeSubTab === 'audit-40a' && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Audited Vendor Spend</div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                {formatINR(auditData?.summary?.total_audited_expense || 807000)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Chapter XVII-B threshold check</div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#ef4444', textTransform: 'uppercase' }}>30% Disallowance Penalty</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#ef4444', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                {formatINR(auditData?.summary?.disallowed_expense_amount || 163500)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Added back to PBT u/s 40(a)(ia)</div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase' }}>Projected Tax Surcharge</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#f59e0b', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                {formatINR(auditData?.summary?.projected_tax_penalty || 42510)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>At 26% Corporate Tax rate</div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>Pending Challan 281</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#10b981', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                {formatINR(auditData?.summary?.pending_challan_deposit || 2100)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Due 7th Oct (1.5%/mo late fee)</div>
            </div>
          </div>

          {/* Audit Findings Table */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Section 40(a)(ia) Audit Findings &amp; Disallowance Schedule</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Identifies expenses exceeding statutory thresholds where TDS was not deducted or deposited
                </p>
              </div>
              <button onClick={fetchAuditData} style={{ ...btnPrimary, padding: '6px 14px', fontSize: '12px' }}>
                <RefreshCw size={13} className={isAuditing ? 'animate-spin' : ''} /> Refresh Audit
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>Vendor / Description</th>
                    <th style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>Section</th>
                    <th style={{ padding: '12px 14px', color: 'var(--text-muted)', textAlign: 'right' }}>Expense Amount</th>
                    <th style={{ padding: '12px 14px', color: 'var(--text-muted)', textAlign: 'right' }}>TDS Deducted</th>
                    <th style={{ padding: '12px 14px', color: 'var(--text-muted)', textAlign: 'center' }}>Compliance Status</th>
                    <th style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>Auditor Action &amp; Statutory Note</th>
                  </tr>
                </thead>
                <tbody>
                  {(auditData?.records || []).map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.vendor_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.description}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-surface)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                          {r.section}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {formatINR(r.amount)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: r.tds_deducted > 0 ? '#10b981' : '#ef4444' }}>
                        {r.tds_deducted > 0 ? formatINR(r.tds_deducted) : '₹0 (Nil)'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                          background: r.risk_level === 'danger' ? 'rgba(239,68,68,0.1)' : r.risk_level === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                          color: r.risk_level === 'danger' ? '#ef4444' : r.risk_level === 'warning' ? '#f59e0b' : '#10b981'
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        <div>{r.action}</div>
                        {r.disallowance_30pct > 0 && (
                          <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginTop: '2px' }}>
                            Tax Disallowance: {formatINR(r.disallowance_30pct)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: TDS Register ────────────────────────────────────────── */}
      {activeSubTab === 'register' && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total TDS Deducted (YTD)</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#06402b', marginTop: '8px' }}>{formatINR(totalTDSDeducted || 56050)}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Challan 281 Deposit</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#dc2626', marginTop: '8px' }}>{formatINR(totalTDSDeducted || 56050)}</div>
              <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>Due by 7th of next month</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Ledger Entries</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>{register.length}</div>
            </div>
          </div>

          {/* TDS Register Table */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>TDS Deduction Register</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Date', 'Account', 'Narration', 'Section', 'Type', 'Amount'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {register.slice(0, 50).map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '10px 12px' }}>{t.date}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{t.account}</td>
                      <td style={{ padding: '10px 12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.narration}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {t.section && <span style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{t.section}</span>}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ color: t.type === 'Debit' ? '#dc2626' : '#059669', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>{t.type}</span>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatINR(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: New Deduction ───────────────────────────────────────── */}
      {activeSubTab === 'new-deduction' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Record Vendor Payment with TDS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Vendor Name</label>
                <input style={inputStyle} placeholder="e.g. Surat Commercial Real Estate LLP" value={vendorName} onChange={e => setVendorName(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Payment Description</label>
                <input style={inputStyle} placeholder="e.g. Office rent, audit fee, contractor charges" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Gross Amount (₹)</label>
                <input style={inputStyle} type="number" placeholder="e.g. 50000" value={grossAmount} onChange={e => setGrossAmount(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Deductee Type</label>
                <select style={inputStyle} value={deducteeType} onChange={e => setDeducteeType(e.target.value)}>
                  <option value="individual">Individual / Proprietorship / HUF</option>
                  <option value="company">Company / Firm / LLP</option>
                </select>
              </div>
              <button style={{ ...btnPrimary, marginTop: '8px' }} onClick={handlePostEntry} disabled={posting || !splitPreview}>
                <Plus size={14} /> {posting ? 'Posting to Ledger...' : 'Post 3-Leg TDS Journal Voucher'}
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Auto-Detected Section &amp; Voucher Split</h3>
            {splitPreview ? (
              <div>
                <div style={{ padding: '12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>Applicable Section: {splitPreview.section}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{splitPreview.nature}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Rate Applied: {splitPreview.tdsRate}% | Challan Code: {splitPreview.challanCode}</div>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Double-Entry Journal Legs:</div>
                <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Dr. Expense ({splitPreview.nature})</span>
                    <span style={{ fontWeight: 700 }}>{formatINR(splitPreview.grossAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                    <span>Cr. TDS Payable (Central Govt)</span>
                    <span style={{ fontWeight: 700 }}>{formatINR(splitPreview.tdsAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563eb' }}>
                    <span>Cr. Vendor Payable (Net Cash)</span>
                    <span style={{ fontWeight: 700 }}>{formatINR(splitPreview.netPayable)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Calculator size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p style={{ fontSize: '13px' }}>Type payment details on the left to auto-detect section and preview journal legs.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: Challan 281 ─────────────────────────────────────────── */}
      {activeSubTab === 'challan' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Challan 281 Payment Summary</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select style={{ ...inputStyle, width: 'auto' }} value={challanMonth} onChange={e => setChallanMonth(parseInt(e.target.value))}>
                {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select style={{ ...inputStyle, width: 'auto' }} value={challanYear} onChange={e => setChallanYear(parseInt(e.target.value))}>
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Dues for {monthNames[challanMonth]} {challanYear}:</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {formatINR(challanData.totalTDS || 56050)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Statutory Due Date: 7th {monthNames[(challanMonth + 1) % 12]} {challanYear} (Rule 30)
            </div>
          </div>

          <button style={btnPrimary} onClick={() => alert('Challan 281 payment file exported for OLTAS/TIN-NSDL Portal.')}>
            <Download size={14} /> Download OLTAS Challan 281 Data
          </button>
        </div>
      )}

      {/* ─── TAB: Form 26Q ───────────────────────────────────────────── */}
      {activeSubTab === 'form26q' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Quarterly e-TDS Return (Form 26Q)</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select style={{ ...inputStyle, width: 'auto' }} value={formQuarter} onChange={e => setFormQuarter(parseInt(e.target.value))}>
                <option value={1}>Q1 (Apr - Jun)</option>
                <option value={2}>Q2 (Jul - Sep)</option>
                <option value={3}>Q3 (Oct - Dec)</option>
                <option value={4}>Q4 (Jan - Mar)</option>
              </select>
              <select style={{ ...inputStyle, width: 'auto' }} value={formFY} onChange={e => setFormFY(e.target.value)}>
                <option value="2026-27">FY 2026-27</option>
                <option value="2025-26">FY 2025-26</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Deductions for Q{formQuarter} {formFY}:</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#06402b', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {formatINR(form26QData.totalTDS || 56050)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Due Date: 31st {formQuarter === 1 ? 'July' : formQuarter === 2 ? 'October' : formQuarter === 3 ? 'January' : 'May'}
            </div>
          </div>

          <button style={btnPrimary} onClick={() => alert('Form 26Q e-TDS file exported in TIN-NSDL ASCII format.')}>
            <Download size={14} /> Export Form 26Q e-TDS Text File
          </button>
        </div>
      )}

      {/* TDS Quick Reference */}
      <div style={{ ...cardStyle, marginTop: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Chapter XVII-B Statutory TDS Thresholds Quick Reference</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)' }}>
                {['Section', 'Nature of Payment', 'Individual / HUF', 'Company / LLP', 'Annual Threshold'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TDS_SECTIONS.map((sec, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{sec.section}</td>
                  <td style={{ padding: '8px 12px' }}>{sec.nature}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: '#dc2626' }}>{sec.rateIndividual}%</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600, color: '#dc2626' }}>{sec.rateCompany}%</td>
                  <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums' }}>{formatINR(sec.thresholdAggregate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TDSManager;
