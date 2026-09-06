import React from 'react';
import { LedgerEngine, formatINR } from '../utils/LedgerEngine';
import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react';

function JournalDetail({ journalRef, onBack }) {
  const legs = LedgerEngine.transactions.filter(t => t.ref === journalRef);
  
  if (legs.length === 0) {
    return (
      <div className="tab-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, marginBottom: '24px' }}>
          <ArrowLeft size={16} /> Back to Day Book
        </button>
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Journal entry <code>{journalRef}</code> not found.</p>
        </div>
      </div>
    );
  }

  const firstLeg = legs[0];
  const totalDebit = legs.filter(l => l.type === 'Debit').reduce((s, l) => s + l.amount, 0);
  const totalCredit = legs.filter(l => l.type === 'Credit').reduce((s, l) => s + l.amount, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="tab-content animate-fade" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Day Book
      </button>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FileText size={20} color="var(--accent-emerald)" />
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Journal Voucher</h2>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Reference: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 600 }}>{journalRef}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{firstLeg.date}</div>
            <span style={{
              fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
              background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 600, marginTop: '4px', display: 'inline-block'
            }}>
              {firstLeg.category || 'General'}
            </span>
          </div>
        </div>

        {/* Narration */}
        <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '8px', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Narration</div>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{firstLeg.narration}</div>
        </div>

        {/* Double-Entry Legs Table */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px' }}>Double-Entry Legs</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>Account</th>
                <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Debit (₹)</th>
                <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Credit (₹)</th>
              </tr>
            </thead>
            <tbody>
              {legs.map((leg, i) => (
                <tr key={leg.id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500 }}>
                    {leg.type === 'Debit' ? '' : '\u00A0\u00A0\u00A0\u00A0To '}{leg.account}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'var(--font-mono)', textAlign: 'right', fontWeight: 600 }}>
                    {leg.type === 'Debit' ? formatINR(leg.amount) : ''}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'var(--font-mono)', textAlign: 'right', fontWeight: 600 }}>
                    {leg.type === 'Credit' ? formatINR(leg.amount) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-surface)' }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700 }}>TOTAL</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'var(--font-mono)', textAlign: 'right', fontWeight: 700 }}>{formatINR(totalDebit)}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'var(--font-mono)', textAlign: 'right', fontWeight: 700 }}>{formatINR(totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Balance Verification */}
        <div style={{
          padding: '12px 16px', borderRadius: '8px',
          background: isBalanced ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '12px', fontWeight: 600,
          color: isBalanced ? '#10b981' : '#ef4444'
        }}>
          <CheckCircle2 size={16} />
          {isBalanced ? 'Balanced & Double-Entry Verified' : `UNBALANCED — Debit: ${formatINR(totalDebit)}, Credit: ${formatINR(totalCredit)}`}
        </div>
      </div>

      {/* Audit Trail */}
      <div className="card">
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '12px' }}>Audit Trail</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Voucher Ref</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{journalRef}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Date</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{firstLeg.date}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Category</div>
            <div style={{ fontSize: '13px', fontWeight: 500 }}>{firstLeg.category || 'General'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Legs</div>
            <div style={{ fontSize: '13px', fontWeight: 500 }}>{legs.length} entries ({legs.filter(l => l.type === 'Debit').length}D / {legs.filter(l => l.type === 'Credit').length}C)</div>
          </div>
          {firstLeg.createdAt && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Created</div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>{new Date(firstLeg.createdAt).toLocaleString('en-IN')}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Company Scope</div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>Demo Tenant</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JournalDetail;
