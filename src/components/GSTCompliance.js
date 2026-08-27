import React, { useState, useMemo } from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine.js';
import { AlertCircle, FileText, CheckCircle2, Calculator } from 'lucide-react';

const GSTCompliance = ({ period }) => {
  const [activeTab, setActiveTab] = useState('GSTR-3B');

  // Compute GST slabs based on transactions
  const gstData = useMemo(() => {
    const revenue = LedgerEngine.getAccountBalance('Sales Revenue');
    const cogs = LedgerEngine.getAccountBalance('Cost of Goods Sold');
    
    // Simulate slabs
    const sales18 = revenue * 0.6;
    const sales12 = revenue * 0.3;
    const salesNil = revenue * 0.1;

    const pur18 = cogs * 0.7;
    const pur12 = cogs * 0.3;

    // Output Tax (CGST + SGST)
    const outCGST = (sales18 * 0.09) + (sales12 * 0.06);
    const outSGST = (sales18 * 0.09) + (sales12 * 0.06);
    
    // Input Tax Credit (ITC)
    const itcCGST = (pur18 * 0.09) + (pur12 * 0.06);
    const itcSGST = (pur18 * 0.09) + (pur12 * 0.06);

    return {
      sales: { total: revenue, s18: sales18, s12: sales12, sNil: salesNil },
      purchases: { total: cogs, p18: pur18, p12: pur12 },
      output: { cgst: outCGST, sgst: outSGST, igst: 0, total: outCGST + outSGST },
      itc: { cgst: itcCGST, sgst: itcSGST, igst: 0, total: itcCGST + itcSGST },
      payable: { cgst: Math.max(0, outCGST - itcCGST), sgst: Math.max(0, outSGST - itcSGST), igst: 0 }
    };
  }, []);

  const totalPayable = gstData.payable.cgst + gstData.payable.sgst + gstData.payable.igst;

  return (
    <div className="animate-fade" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>GST Compliance</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>GSTR-1 & GSTR-3B Computation (Auto-classified)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            padding: '6px 14px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 600,
            background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <CheckCircle2 size={14} /> Ready for Filing
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Output Tax Liability</div>
          <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatINR(gstData.output.total)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>CGST: {formatINR(gstData.output.cgst)} | SGST: {formatINR(gstData.output.sgst)}</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Eligible ITC</div>
          <div style={{ fontSize: '24px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#10b981' }}>{formatINR(gstData.itc.total)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>CGST: {formatINR(gstData.itc.cgst)} | SGST: {formatINR(gstData.itc.sgst)}</div>
        </div>
        <div className="card" style={{ padding: '20px', background: 'var(--bg-surface)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Net GST Payable</div>
          <div style={{ fontSize: '28px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f97316' }}>{formatINR(totalPayable)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calculator size={12} /> Auto-offset applied
          </div>
        </div>
      </div>

      <div className="statements-nav" style={{ 
        display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-6)'
      }}>
        {['GSTR-3B', 'GSTR-1 (Outward)', 'ITC Audit Trail'].map(tab => (
          <div 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ 
              paddingBottom: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--text-primary)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {activeTab === 'GSTR-3B' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nature of Supplies</th>
                <th style={{ padding: '14px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Taxable Value</th>
                <th style={{ padding: '14px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>CGST</th>
                <th style={{ padding: '14px 24px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>SGST</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 500 }}>3.1(a) Outward Taxable Supplies</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{formatINR(gstData.sales.s18 + gstData.sales.s12)}</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{formatINR(gstData.output.cgst)}</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{formatINR(gstData.output.sgst)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 500 }}>3.1(c) Nil Rated / Exempted</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{formatINR(gstData.sales.sNil)}</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>-</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>-</td>
              </tr>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 500 }}>4(A) All Other ITC</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{formatINR(gstData.purchases.total)}</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#10b981' }}>{formatINR(gstData.itc.cgst)}</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#10b981' }}>{formatINR(gstData.itc.sgst)}</td>
              </tr>
              <tr style={{ background: 'var(--bg-surface)' }}>
                <td colSpan={2} style={{ padding: '14px 24px', fontSize: '13px', fontWeight: 700 }}>6.1 Payment of Tax (Net Cash)</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#f97316' }}>{formatINR(gstData.payable.cgst)}</td>
                <td style={{ padding: '14px 24px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: '#f97316' }}>{formatINR(gstData.payable.sgst)}</td>
              </tr>
            </tbody>
          </table>
        )}
        
        {activeTab !== 'GSTR-3B' && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <div style={{ fontSize: '14px', fontWeight: 500 }}>Detailed schedules available upon month-end close.</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', padding: '12px', background: 'rgba(249,115,22,0.1)', color: '#f97316', borderRadius: '8px', fontSize: '12px' }}>
        <AlertCircle size={14} />
        <span>Disclaimer: Auto-computed figures must be verified against actual GSTR-2B before filing.</span>
      </div>
    </div>
  );
};

export default GSTCompliance;
