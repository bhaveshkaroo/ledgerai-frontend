import React, { useState, useEffect, useCallback } from 'react';
import { TDSEngine, TDS_SECTIONS } from '../utils/TDSEngine';
import { formatINR } from '../utils/LedgerEngine';
import { Receipt, FileText, Calculator, Download, Plus, CheckCircle, AlertTriangle, Calendar, IndianRupee } from 'lucide-react';

const cardStyle = {
  background: 'white', borderRadius: '12px', padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)'
};
const btnPrimary = {
  background: '#06402b', color: 'white', borderRadius: '8px', padding: '10px 20px',
  border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px'
};
const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border, rgba(0,0,0,0.1))',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'var(--bg-secondary, #f9fafb)'
};
const labelStyle = { fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #6b7280)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' };

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

  const refreshRegister = useCallback(() => {
    setRegister(TDSEngine.getTDSRegister());
  }, []);

  useEffect(() => {
    refreshRegister();
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
    <div style={{ padding: '28px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary, #111827)', margin: 0 }}>
          <IndianRupee size={20} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#10b981' }} />
          TDS &amp; Withholding Tax
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #6b7280)', marginTop: '4px' }}>
          Auto TDS Engine — Chapter XVII-B, Income Tax Act 1961
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
          background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: toast.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#fecaca'}`
        }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span style={{ fontSize: '13px', fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-secondary, #f3f4f6)', padding: '4px', borderRadius: '10px' }}>
        {subTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveSubTab(tab.id)} style={{
              flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: activeSubTab === tab.id ? 'white' : 'transparent',
              color: activeSubTab === tab.id ? '#06402b' : 'var(--text-muted, #6b7280)',
              boxShadow: activeSubTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TDS Register */}
      {activeSubTab === 'register' && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div style={cardStyle}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total TDS Deducted (YTD)</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#06402b', marginTop: '8px' }}>{formatINR(totalTDSDeducted)}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Deposit</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#dc2626', marginTop: '8px' }}>{formatINR(totalTDSDeducted)}</div>
              <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>Due by 7th of next month</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Entries</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>{register.length}</div>
            </div>
          </div>

          {/* TDS Register Table */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>TDS Deduction Register</h3>
            {register.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Calculator size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p style={{ fontSize: '14px' }}>No TDS deductions recorded yet.</p>
                <p style={{ fontSize: '12px' }}>Use the "New Deduction" tab to post your first TDS entry.</p>
              </div>
            ) : (
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
                        <td style={{ padding: '10px 12px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.narration}</td>
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
            )}
          </div>
        </div>
      )}

      {/* New Deduction */}
      {activeSubTab === 'new-deduction' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Input Form */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>
              <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Record TDS Deduction
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Vendor / Party Name</label>
              <input style={inputStyle} value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="e.g. Sharma & Associates" />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Nature of Payment / Description</label>
              <input style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Legal advisory fees for trademark registration" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Gross Amount (&#8377;)</label>
                <input style={inputStyle} type="number" value={grossAmount} onChange={e => setGrossAmount(e.target.value)} placeholder="e.g. 100000" />
              </div>
              <div>
                <label style={labelStyle}>Deductee Type</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={deducteeType} onChange={e => setDeducteeType(e.target.value)}>
                  <option value="individual">Individual / HUF</option>
                  <option value="company">Company</option>
                </select>
              </div>
            </div>

            {/* Auto-detected Section */}
            {detectedSection && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  Auto-Detected TDS Section
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#065f46' }}>
                  Section {detectedSection.section} — {detectedSection.nature}
                </div>
                <div style={{ fontSize: '12px', color: '#047857', marginTop: '4px' }}>
                  Rate: {deducteeType === 'company' ? detectedSection.rateCompany : detectedSection.rateIndividual}% | Threshold: {formatINR(detectedSection.thresholdAggregate)}/year | Challan: {detectedSection.challanCode}
                </div>
              </div>
            )}

            {!detectedSection && description && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#92400e' }}>
                  <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  No TDS section detected. Try keywords like "legal fees", "contractor works", "office rent", "software services".
                </div>
              </div>
            )}

            <button onClick={handlePostEntry} disabled={posting || !splitPreview} style={{ ...btnPrimary, opacity: (!splitPreview || posting) ? 0.5 : 1, width: '100%', justifyContent: 'center' }}>
              {posting ? 'Posting...' : 'Post TDS Entry to Ledger'}
            </button>
          </div>

          {/* Live Split Preview */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>
              <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Journal Entry Preview
            </h3>

            {splitPreview ? (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  {splitPreview.legs.map((leg, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px', marginBottom: '8px', borderRadius: '8px',
                      background: leg.type === 'debit' ? '#fef2f2' : '#ecfdf5',
                      border: `1px solid ${leg.type === 'debit' ? '#fecaca' : '#a7f3d0'}`
                    }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: leg.type === 'debit' ? '#dc2626' : '#059669', marginRight: '8px' }}>
                          {leg.type === 'debit' ? 'DR' : 'CR'}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{leg.account}</span>
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatINR(leg.amount)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <strong>Narration:</strong> {splitPreview.narration}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px' }}>
                  <div style={{ textAlign: 'center', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Gross</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{formatINR(splitPreview.grossAmount)}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: '#fef2f2', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>TDS @ {splitPreview.tdsRate}%</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626', marginTop: '4px' }}>{formatINR(splitPreview.tdsAmount)}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: '#ecfdf5', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Net Payable</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#059669', marginTop: '4px' }}>{formatINR(splitPreview.netPayable)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <Calculator size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p style={{ fontSize: '14px' }}>Fill in vendor details and description to see the auto-split preview.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Challan 281 */}
      {activeSubTab === 'challan' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
              <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Challan No. 281 — TDS Payment Summary
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select style={{ ...inputStyle, width: 'auto' }} value={challanMonth} onChange={e => setChallanMonth(parseInt(e.target.value))}>
                {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select style={{ ...inputStyle, width: 'auto' }} value={challanYear} onChange={e => setChallanYear(parseInt(e.target.value))}>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#065f46' }}>Total TDS to Deposit for {monthNames[challanMonth]} {challanYear}</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#06402b', marginTop: '4px' }}>{formatINR(challanData.totalTDS)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#065f46' }}>Due Date for Government Deposit</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#06402b' }}>7th {monthNames[(challanMonth + 1) % 12]} {challanMonth === 11 ? challanYear + 1 : challanYear}</div>
            </div>
          </div>

          {challanData.sections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Receipt size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px' }}>No TDS deductions for this month.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Section', 'No. of Deductions', 'Total TDS Amount'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {challanData.sections.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>u/s {s.section}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{s.count}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatINR(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button style={{ ...btnPrimary, marginTop: '20px' }}>
            <Download size={14} /> Generate Challan 281 PDF
          </button>
        </div>
      )}

      {/* Form 26Q */}
      {activeSubTab === 'form26q' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
              <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Form 26Q — Quarterly TDS Return
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select style={{ ...inputStyle, width: 'auto' }} value={formQuarter} onChange={e => setFormQuarter(parseInt(e.target.value))}>
                <option value={1}>Q1 (Apr - Jun)</option>
                <option value={2}>Q2 (Jul - Sep)</option>
                <option value={3}>Q3 (Oct - Dec)</option>
                <option value={4}>Q4 (Jan - Mar)</option>
              </select>
              <select style={{ ...inputStyle, width: 'auto' }} value={formFY} onChange={e => setFormFY(e.target.value)}>
                <option value="2024-25">FY 2024-25</option>
                <option value="2025-26">FY 2025-26</option>
                <option value="2026-27">FY 2026-27</option>
              </select>
            </div>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>
              {form26QData.quarter} | FY {formFY} | Total TDS: {formatINR(form26QData.totalTDS)} | Deductees: {form26QData.deductees.length}
            </div>
          </div>

          {form26QData.deductees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <FileText size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px' }}>No TDS deductions for this quarter.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Deductee Name', 'PAN', 'Section', 'TDS Deducted'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form26QData.deductees.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{d.name}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{d.pan}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{d.section}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatINR(d.tdsDeducted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button style={{ ...btnPrimary, marginTop: '20px' }}>
            <Download size={14} /> Export for Filing
          </button>
        </div>
      )}

      {/* TDS Quick Reference */}
      <div style={{ ...cardStyle, marginTop: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>TDS Quick Reference — Applicable Sections</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Section', 'Nature', 'Individual Rate', 'Company Rate', 'Threshold (Aggregate/Year)'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TDS_SECTIONS.map((sec, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{sec.section}</td>
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
