import React, { useState } from 'react';
import { 
  Scale, Users, Building2, FileCheck, CheckCircle2, AlertTriangle, 
  ExternalLink, Download, FileText, ChevronRight, ShieldCheck, 
  Award, Eye, RefreshCw, Printer
} from 'lucide-react';
import { formatINR } from '../utils/LedgerEngine';

// Pre-configured client companies under CA firm audit
const CLIENT_COMPANIES = [
  {
    id: 'client-1',
    name: 'Apex Innovations Pvt Ltd',
    gstin: '27AABCA1234R1ZM',
    pan: 'AABCA1234R',
    turnover: 35000000,
    fy: '2026-27',
    status: 'Audit in Progress',
    form3CDStatus: 'Pending Sign-Off',
    taxAuditApplicable: true,
    clausesCompleted: 38,
    totalClauses: 44,
    msmePending: 3,
    tdsDisallowanceRisk: 45000
  },
  {
    id: 'client-2',
    name: 'Bharat Logistics & Infra LLP',
    gstin: '27AABCB9012F1ZT',
    pan: 'AABCB9012F',
    turnover: 68000000,
    fy: '2026-27',
    status: 'Under Review',
    form3CDStatus: 'Draft Ready',
    taxAuditApplicable: true,
    clausesCompleted: 42,
    totalClauses: 44,
    msmePending: 0,
    tdsDisallowanceRisk: 0
  },
  {
    id: 'client-3',
    name: 'Kavita Textile Mills Pvt Ltd',
    gstin: '24AAECK4491D1ZX',
    pan: 'AAECK4491D',
    turnover: 18500000,
    fy: '2026-27',
    status: 'Books Finalized',
    form3CDStatus: 'Signed & Certified',
    taxAuditApplicable: false, // 44AD presumptive
    clausesCompleted: 44,
    totalClauses: 44,
    msmePending: 1,
    tdsDisallowanceRisk: 12000
  }
];

export default function CAAuditPortal({ onSelectClient }) {
  const [selectedClientId, setSelectedClientId] = useState('client-1');
  const [activeTab, setActiveTab] = useState('form3cd');
  const [signOffStatus, setSignOffStatus] = useState(false);
  const [caUDIN, setCaUDIN] = useState('26049281BCDEF9012');

  const selectedClient = CLIENT_COMPANIES.find(c => c.id === selectedClientId) || CLIENT_COMPANIES[0];

  const handleDigitalSign = () => {
    if (!caUDIN || caUDIN.length < 15) {
      alert('Please enter a valid 18-digit ICAI UDIN number.');
      return;
    }
    setSignOffStatus(true);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px', color: 'var(--text-primary)' }}>
      {/* Top Banner / CA Firm Identification */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '24px',
        boxShadow: '0 10px 30px rgba(30, 58, 138, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Scale size={26} color="#60a5fa" />
          </div>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, letterSpacing: '0.5px' }}>
              <span>ICAI REGISTERED CA AUDIT DESK</span>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 0 0', letterSpacing: '-0.3px' }}>
              R. K. Singhania &amp; Associates, Chartered Accountants
            </h2>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
              Firm Reg No: 109281W • Multi-Client Tax Audit &amp; GSTR-9C Workstation
            </div>
          </div>
        </div>

        {/* Client Company Switcher Dropdown */}
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            Active Audit Client:
          </label>
          <select
            value={selectedClientId}
            onChange={e => {
              setSelectedClientId(e.target.value);
              setSignOffStatus(false);
            }}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              minWidth: '240px'
            }}
          >
            {CLIENT_COMPANIES.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.gstin.slice(0, 2)} State)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Client Snapshot Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Legal Entity &amp; PAN</div>
          <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px', fontFamily: 'monospace' }}>{selectedClient.pan}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>GSTIN: {selectedClient.gstin}</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Annual Turnover</div>
          <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px', color: '#2563eb' }}>{formatINR(selectedClient.turnover)}</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>Sec 44AB Tax Audit Mandatory</div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Clause Completion</div>
          <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>
            {selectedClient.clausesCompleted} / {selectedClient.totalClauses} Clauses
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {Math.round((selectedClient.clausesCompleted / selectedClient.totalClauses) * 100)}% workpapers ready
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Tax Disallowance Risks</div>
          <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px', color: selectedClient.tdsDisallowanceRisk > 0 ? '#dc2626' : '#10b981' }}>
            {selectedClient.tdsDisallowanceRisk > 0 ? formatINR(selectedClient.tdsDisallowanceRisk) : 'Nil Risk'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {selectedClient.msmePending} MSME overdue invoices
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Form 3CD Workpapers vs GSTR-9C vs Audit Certification */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('form3cd')}
          style={{
            padding: '10px 18px', border: 'none', background: 'transparent',
            borderBottom: activeTab === 'form3cd' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'form3cd' ? '#2563eb' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '13px', cursor: 'pointer'
          }}
        >
          Form 3CD Tax Audit Workpapers
        </button>
        <button
          onClick={() => setActiveTab('gstr9c')}
          style={{
            padding: '10px 18px', border: 'none', background: 'transparent',
            borderBottom: activeTab === 'gstr9c' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'gstr9c' ? '#2563eb' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '13px', cursor: 'pointer'
          }}
        >
          GSTR-9 / 9C Annual Reconciliation
        </button>
        <button
          onClick={() => setActiveTab('signoff')}
          style={{
            padding: '10px 18px', border: 'none', background: 'transparent',
            borderBottom: activeTab === 'signoff' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'signoff' ? '#2563eb' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '13px', cursor: 'pointer'
          }}
        >
          ICAI Digital UDIN Sign-Off
        </button>
      </div>

      {/* Tab 1: Form 3CD Workpapers */}
      {activeTab === 'form3cd' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Clause 22: MSME Interest & Delays */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  CLAUSE 22 (MSMED ACT, 2006 &amp; SEC 43B(h))
                </span>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '6px 0 0 0' }}>
                  Interest &amp; Overdue Invoices Payable to Micro and Small Enterprises
                </h4>
              </div>
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={16} /> Auto-Computed from Books
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
              Amount of interest payable under Section 16 of MSMED Act, and invoice sums disallowed under Section 43B(h) due to payment beyond 45 days.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Vendor Name</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>UDYAM Reg No</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Invoice Amt</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Days Delayed</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Section 43B(h) Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Surat Silk Suppliers</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'monospace' }}>UDYAM-GJ-01-0081291</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>{formatINR(210400)}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', color: '#dc2626', fontWeight: 700 }}>48 Days</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', color: '#dc2626', fontWeight: 600 }}>Disallowed (Add-Back)</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Vardhman Textiles</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'monospace' }}>UDYAM-PB-02-0044910</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>{formatINR(148500)}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', color: '#10b981' }}>28 Days</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', color: '#10b981', fontWeight: 600 }}>Allowed (Paid within 45D)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Clause 34: TDS Deductions & Disallowance under 40(a)(ia) */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  CLAUSE 34 (CHAPTER XVII-B / SEC 40(a)(ia))
                </span>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '6px 0 0 0' }}>
                  Compliance with TDS Provisions &amp; 30% Tax Penalty Add-Backs
                </h4>
              </div>
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={16} /> Verified with TDSEngine
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Section</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Nature of Payment</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Total Paid</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>TDS Deducted</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>TDS Deposited</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Disallowance 40(a)(ia)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>194J</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Technical / Legal Fees</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>{formatINR(327000)}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>{formatINR(20940)}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', color: '#10b981' }}>{formatINR(20940)}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', color: '#10b981' }}>Nil</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>194C</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Contractor &amp; Transport</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>{formatINR(150000)}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>{formatINR(3000)}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', color: '#dc2626' }}>{formatINR(0)}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', color: '#dc2626', fontWeight: 700 }}>{formatINR(45000)} (30%)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Clause 44: Break-up of Total Expenditure in respect of GST Entities */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px' }}>
            <span style={{ fontSize: '11px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
              CLAUSE 44 (GST EXPENDITURE BREAKUP)
            </span>
            <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '6px 0 12px 0' }}>
              Expenditure in respect of entities registered and not registered under GST
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered Entities (Composition)</div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>{formatINR(85000)}</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered Entities (Standard GST)</div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>{formatINR(1420000)}</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Non-GST / Exempt Entities</div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>{formatINR(310000)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: GSTR-9/9C Reconciliation */}
      {activeTab === 'gstr9c' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '24px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>
            Table 5: Reconciliation of Gross Turnover (Audited Books vs GSTR-9)
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Auto-reconciles audited Financial Statements turnover against GSTR-1 &amp; GSTR-3B filed returns.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '13px' }}>
              <span>Turnover as per Audited Profit &amp; Loss Account (5A)</span>
              <strong>{formatINR(35000000)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '13px' }}>
              <span>Unbilled Revenue at the beginning of Financial Year (5B)</span>
              <strong>{formatINR(0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '13px' }}>
              <span>Turnover as declared in Annual Return GSTR-9 (5Q)</span>
              <strong>{formatINR(35000000)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', fontSize: '13px', color: '#10b981', fontWeight: 700 }}>
              <span>Unreconciled Turnover Difference (5R)</span>
              <span>₹0.00 (100% Reconciled)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Digital UDIN Sign-off */}
      {activeTab === 'signoff' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '24px', maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Award size={24} color="#2563eb" />
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              ICAI Form 3CA / 3CB Audit Report Certification
            </h4>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Unique Document Identification Number (UDIN)
            </label>
            <input
              type="text"
              value={caUDIN}
              onChange={e => setCaUDIN(e.target.value.toUpperCase())}
              placeholder="e.g. 26049281BCDEF9012"
              maxLength={18}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid var(--border)', background: 'var(--bg-surface)',
                color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace', fontWeight: 700
              }}
            />
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
            By applying this digital certification, you certify that you have conducted the audit of <strong>{selectedClient.name}</strong> in accordance with the Standards on Auditing issued by the ICAI.
          </div>

          {signOffStatus ? (
            <div style={{ padding: '14px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
              <CheckCircle2 size={20} />
              <span>Tax Audit Report Certified with UDIN {caUDIN}. Workpapers Locked.</span>
            </div>
          ) : (
            <button
              onClick={handleDigitalSign}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '8px', border: 'none',
                background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
              }}
            >
              <FileCheck size={16} />
              <span>Certify &amp; Sign Tax Audit Report</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
