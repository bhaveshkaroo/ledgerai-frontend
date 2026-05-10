import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function GSTCalculator() {
  const [amount, setAmount] = useState(0);
  const [rate, setRate] = useState(18);
  const [type, setType] = useState('goods');
  const [calc, setCalc] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const performCalc = async () => {
      const res = await fetch(`${API_URL}/gst/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) || 0, rate, type })
      });
      const data = await res.json();
      setCalc(data);
    };
    performCalc();
  }, [amount, rate, type]);

  useEffect(() => {
    fetch(`${API_URL}/gst/summary`)
      .then(res => res.json())
      .then(setSummary);
  }, []);

  const inputStyle = {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box'
  };

  const resultItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #eee'
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
      <div style={{ backgroundColor: 'var(--card)', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>GST Calculator</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Base Amount (₹)</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>GST Rate (%)</label>
          <select value={rate} onChange={(e) => setRate(parseInt(e.target.value))} style={inputStyle}>
            <option value={5}>5% (Basic)</option>
            <option value={12}>12% (Standard)</option>
            <option value={18}>18% (Standard Plus)</option>
            <option value={28}>28% (Luxury)</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ marginRight: '20px' }}>
            <input type="radio" checked={type === 'goods'} onChange={() => setType('goods')} /> Goods
          </label>
          <label>
            <input type="radio" checked={type === 'services'} onChange={() => setType('services')} /> Services
          </label>
        </div>

        {calc && (
          <div style={{ backgroundColor: 'var(--alt-bg)', padding: '15px', borderRadius: '4px' }}>
            <div style={resultItemStyle}><span>CGST (Central)</span> <strong>${calc.cgst.toLocaleString('en-IN')}</strong></div>
            <div style={resultItemStyle}><span>SGST (State)</span> <strong>${calc.sgst.toLocaleString('en-IN')}</strong></div>
            <div style={resultItemStyle}><span>IGST (Integrated)</span> <strong>${calc.igst.toLocaleString('en-IN')}</strong></div>
            <div style={{ ...resultItemStyle, borderBottom: '2px solid #ddd' }}>
              <span>Total GST</span> <strong>${calc.total_gst.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ ...resultItemStyle, borderBottom: 'none', fontSize: '18px', fontWeight: 'bold', color: '#1D9E75' }}>
              <span>Invoice Total</span> <span>${calc.total_amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ backgroundColor: 'var(--primary)', color: 'var(--text)', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>Monthly GST Summary</h3>
        {summary && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 5px 0', opacity: 0.8 }}>Total GST Collected</p>
              <h2 style={{ margin: 0 }}>${summary.gst_collected.toLocaleString('en-IN')}</h2>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 5px 0', opacity: 0.8 }}>Total GST Paid (ITC)</p>
              <h2 style={{ margin: 0 }}>${summary.gst_paid.toLocaleString('en-IN')}</h2>
            </div>
            <div style={{ padding: '15px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
              <p style={{ margin: '0 0 5px 0' }}>Net GST {summary.status}</p>
              <h2 style={{ margin: 0, color: summary.net_liability > 0 ? 'var(--red)' : 'var(--green)' }}>
                ${Math.abs(summary.net_liability).toLocaleString('en-IN')}
              </h2>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GSTCalculator;
