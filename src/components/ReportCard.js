import React from 'react';
import { Sparkles } from 'lucide-react';

function ReportCard() {
  return (
    <div className="card glass-card ai-summary-card" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <Sparkles size={40} color="var(--accent-cyan)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>AI Financial Summary</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Intelligent insights for Sharma Textiles Pvt Ltd</p>
      </div>
      
      <div className="summary-content" style={{ lineHeight: 1.8, fontSize: 16, color: '#f1f5f9' }}>
        <p>Overall performance for FY 2025-26 shows a <strong>strong upward trend</strong> in revenue from operations. The gross margin is stable at 50.5%, indicating healthy core efficiency.</p>
        <br />
        <p>Net profit after tax stands at ₹1,87,500 for the current period. We recommend optimizing finance costs which currently account for 12% of total expenses. Cash flow remains positive with a strong closing balance of ₹40,00,000.</p>
        <br />
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: 20, borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <h4 style={{ color: 'var(--accent-blue)', marginBottom: 10 }}>Actionable Insight</h4>
          <p style={{ fontSize: 14 }}>Inventory turnover has slowed slightly in the last quarter. Consider reviewing supply chain lead times to free up working capital.</p>
        </div>
      </div>

      <button className="pill primary" style={{ width: '100%', marginTop: 30, padding: 16 }}>
        Regenerate Full Intelligence Report
      </button>
    </div>
  );
}

export default ReportCard;
