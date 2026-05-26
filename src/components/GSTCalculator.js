import React, { useState, useEffect } from 'react';
import { formatINR } from '../utils/LedgerEngine';
import { Calculator, PieChart, ShieldCheck } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function GSTCalculator() {
  const [amount, setAmount] = useState(100000);
  const [rate, setRate] = useState(18);
  const [type, setType] = useState('goods');
  const [calc, setCalc] = useState({ cgst: 9000, sgst: 9000, igst: 18000, total_gst: 18000, total_amount: 118000 });
  const [summary, setSummary] = useState({ gst_collected: 450000, gst_paid: 320000, net_liability: 130000, status: 'Payable' });

  useEffect(() => {
    fetch(`${API_URL}/gst/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount) || 0, rate, type })
    })
    .then(r => r.json())
    .then(d => { if(d.total_gst !== undefined) setCalc(d); })
    .catch(() => console.log('Mocking GST calc'));
  }, [amount, rate, type]);

  useEffect(() => {
    fetch(`${API_URL}/gst/summary`)
      .then(res => res.json())
      .then(d => { if(d.gst_collected) setSummary(d); })
      .catch(() => console.log('Mocking GST summary'));
  }, []);

  return (
    <div className="gst-wrap">
      <div className="gst-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Calculator size={20} color="#000000" />
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>GST Computation Tool</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label className="gst-label">Base Taxable Amount (₹)</label>
            <input 
              type="number" 
              className="gst-input"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
            />
          </div>

          <div>
            <label className="gst-label">Select GST Slab (%)</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {[5, 12, 18, 28].map(r => (
                <button 
                  key={r}
                  onClick={() => setRate(r)}
                  className={`filter-chip ${rate === r ? 'active' : ''}`}
                  style={{ flex: 1, padding: '12px' }}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12, padding: 24, background: 'var(--bg-page)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <div className="stmt-row">
              <span className="stmt-label">CGST ({rate/2}%)</span>
              <span className="stmt-amount">₹{formatINR(calc.cgst)}</span>
            </div>
            <div className="stmt-row">
              <span className="stmt-label">SGST ({rate/2}%)</span>
              <span className="stmt-amount">₹{formatINR(calc.sgst)}</span>
            </div>
            <div className="stmt-subtotal" style={{ marginTop: 16 }}>
              <span className="stmt-label">Total GST Collected</span>
              <span className="stmt-amount">₹{formatINR(calc.total_gst)}</span>
            </div>
            <div className="stmt-total" style={{ marginTop: 16, borderTop: '2px solid #000000' }}>
              <span className="stmt-label">INVOICE TOTAL</span>
              <span className="stmt-amount">₹{formatINR(calc.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="gst-result-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <PieChart size={20} color="var(--accent-gold)" />
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>ITC & Liability Summary</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div>
            <div className="gst-label" style={{ color: 'var(--text-secondary)' }}>Output GST (Sales)</div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>₹{formatINR(summary.gst_collected)}</div>
          </div>
          <div>
            <div className="gst-label" style={{ color: 'var(--text-secondary)' }}>Input Tax Credit (ITC)</div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>₹{formatINR(summary.gst_paid)}</div>
          </div>
          
          <div style={{ background: 'var(--bg-surface)', padding: 32, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <ShieldCheck size={18} color="var(--accent-gold)" />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-gold)', letterSpacing: '0.05em' }}>Net GST Payable</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
              ₹{formatINR(summary.net_liability)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
              Next filing (GSTR-3B) due by 20th May 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GSTCalculator;
