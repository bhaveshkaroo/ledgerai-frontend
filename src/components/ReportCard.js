import React from 'react';
import { Sparkles, TrendingUp, ShieldCheck, Zap, ArrowRight, Share2, Printer } from 'lucide-react';

function ReportCard() {
  return (
    <div className="tab-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Initiative Header */}
      <div style={{ marginBottom: 'var(--space-12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-4)' }}>
          <div className="status-dot emerald"></div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letter-spacing: '0.05em' }}>
            Intelligence Report • FY 2025-26
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            AI Financial Intelligence Analysis
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="sidebar-btn" style={{ width: 'auto' }}><Share2 size={16} /></button>
            <button className="sidebar-btn" style={{ width: 'auto' }} onClick={() => window.print()}><Printer size={16} /></button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 'var(--space-12)' }}>
        
        {/* Left Column: Long-form analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
          
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-4)' }}>
              <TrendingUp size={20} color="var(--accent-emerald)" />
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Executive Summary</h2>
            </div>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '65ch' }}>
              Overall performance for the period shows a **strong upward trend** in revenue from operations. The gross margin is stable at 50.5%, indicating healthy core efficiency and effective procurement strategies for raw materials.
            </p>
          </section>

          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-4)' }}>
              <Zap size={20} color="var(--accent-emerald)" />
              <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Key Recommendations</h2>
            </div>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '65ch' }}>
              Net profit after tax stands at ₹1,87,500. We recommend optimizing finance costs which currently account for 12% of total expenses. Consider refinancing high-interest short-term loans with long-term debt to improve the interest coverage ratio.
            </p>
            <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                "Renegotiate raw material contracts with Tier 1 vendors.",
                "Review inventory turnover (currently at 3.8x).",
                "Automate TDS reconciliation to reduce manual errors."
              ].map((rec, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-primary)' }}>
                  <ArrowRight size={14} color="var(--accent-emerald)" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-bright)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-3)' }}>
              <ShieldCheck size={20} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Compliance Strategy</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Inventory turnover has slowed slightly in the last quarter (from 4.2x to 3.8x). This may lead to higher holding costs and potential obsolescence risk for textile stock. 
            </p>
            <button className="sidebar-btn" style={{ width: 'auto', marginTop: 'var(--space-4)', background: 'var(--bg-surface)' }}>
              View Aging Report
            </button>
          </div>
        </div>

        {/* Right Column: Metadata Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 'var(--space-4)' }}>Metadata</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                { label: 'Status', value: 'Completed', color: 'var(--accent-emerald)' },
                { label: 'Confidence', value: 'High (98%)' },
                { label: 'Generated By', value: 'LedgerAI Core' },
                { label: 'Last Sync', value: '12m ago' }
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                  <span style={{ color: m.color || 'var(--text-primary)', fontWeight: 500 }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 var(--space-4)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 'var(--space-4)' }}>Insights Engine</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              This report is generated using our proprietary AS-compliant validation engine, scanning over 12,400 journal entries.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ReportCard;
