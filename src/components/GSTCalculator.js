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
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Calculator size={24} color="var(--accent-navy)" />
          <h3 className="heading-serif" style={{ fontSize: 20 }}>GST Calculator</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Base Amount (₹)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 16, fontWeight: 600 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>GST Rate (%)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[5, 12, 18, 28].map(r => (
                <button 
                  key={r}
                  onClick={() => setRate(r)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-light)',
                    background: rate === r ? 'var(--accent-navy)' : '#fff',
                    color: rate === r ? '#fff' : 'var(--text-primary)',
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: 24, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>CGST (9%)</span>
              <span className="mono" style={{ fontWeight: 600 }}>₹{formatINR(calc.cgst)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>SGST (9%)</span>
              <span className="mono" style={{ fontWeight: 600 }}>₹{formatINR(calc.sgst)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Total GST</span>
              <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-navy)' }}>₹{formatINR(calc.total_gst)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--accent-navy)', paddingTop: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>Invoice Total</span>
              <span className="mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-teal)' }}>₹{formatINR(calc.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: 'var(--bg-sidebar)', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <PieChart size={24} color="var(--accent-gold)" />
          <h3 className="heading-serif" style={{ fontSize: 20 }}>ITC & Liability Summary</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Output GST (Collected)</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 800 }}>₹{formatINR(summary.gst_collected)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Input Tax Credit (Paid)</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 800 }}>₹{formatINR(summary.gst_paid)}</div>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <ShieldCheck size={16} color="var(--accent-gold)" />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-gold)' }}>Net GST Payable</span>
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-gold)' }}>
              ₹{formatINR(summary.net_liability)}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
              Next filing due by 20th May 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GSTCalculator;
