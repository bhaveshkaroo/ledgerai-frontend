import React from 'react';
import { Sparkles, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

function ReportCard() {
  return (
    <div className="statement-document animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="document-header">
        <h1 className="company-name heading-serif">Sharma Textiles Pvt Ltd</h1>
        <h2 className="statement-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Sparkles size={24} color="var(--accent-gold)" />
          AI Financial Intelligence Report
        </h2>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          Generated: May 10, 2026 | Analysis Period: FY 2025-26
        </div>
      </div>
      
      <div className="double-line"></div>
      
      <div className="report-content" style={{ marginTop: 40, lineHeight: 1.8 }}>
        <div style={{ marginBottom: 32 }}>
          <h3 className="heading-serif" style={{ fontSize: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <TrendingUp size={20} color="var(--accent-teal)" />
            Executive Summary
          </h3>
          <p style={{ fontSize: 15, color: 'var(--text-primary)' }}>
            Overall performance for FY 2025-26 shows a <strong>strong upward trend</strong> in revenue from operations, primarily driven by the festive season demand in Q3. The gross margin is stable at 50.5%, indicating healthy core efficiency and effective procurement strategies for raw materials.
          </p>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h3 className="heading-serif" style={{ fontSize: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Zap size={20} color="var(--accent-gold)" />
            Key Recommendations
          </h3>
          <p style={{ fontSize: 15, color: 'var(--text-primary)' }}>
            Net profit after tax stands at ₹1,87,500 for the current period. We recommend optimizing finance costs which currently account for 12% of total expenses. Consider refinancing high-interest short-term loans with long-term debt to improve the interest coverage ratio.
          </p>
        </div>

        <div style={{ background: 'var(--bg-primary)', padding: 32, borderRadius: 12, border: '1px solid var(--border-light)' }}>
          <h4 className="heading-serif" style={{ color: 'var(--accent-navy)', marginBottom: 12, fontSize: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShieldCheck size={20} />
            Compliance Alert
          </h4>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Inventory turnover has slowed slightly in the last quarter (from 4.2x to 3.8x). This may lead to higher holding costs and potential obsolescence risk for textile stock. Consider reviewing supply chain lead times to free up working capital.
          </p>
          <div style={{ marginTop: 16, fontSize: 12, fontWeight: 700, color: 'var(--accent-navy)', textTransform: 'uppercase' }}>
            Action required: Review Inventory Aging Report
          </div>
        </div>
      </div>

      <div style={{ marginTop: 60, textAlign: 'center' }}>
        <button className="pill-btn active" style={{ padding: '16px 40px', fontSize: 14 }}>
          Regenerate Full Intelligence Report
        </button>
      </div>
    </div>
  );
}

export default ReportCard;
