import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, X } from 'lucide-react';

const ManualEntryModal = ({ isOpen, onClose, onConfirm }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Editable fields for override
  const [editDebit, setEditDebit] = useState('');
  const [editCredit, setEditCredit] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editNarration, setEditNarration] = useState('');

  if (!isOpen) return null;

  const handleSuggest = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setErrorMsg('');
    
    try {
      const res = await fetch('http://localhost:8000/api/ai/suggest-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });

      if (!res.ok) {
        let errDetail = 'AI classification unavailable — please enter manually.';
        try {
          const errJson = await res.json();
          if (errJson && errJson.detail) errDetail = errJson.detail;
        } catch (_) {}
        throw new Error(errDetail);
      }

      const data = await res.json();
      setSuggestion(data);
      setEditDebit(data.debit_account || '');
      setEditCredit(data.credit_account || '');
      setEditAmount(data.amount ? data.amount.toString() : '');
      setEditNarration(data.narration || description);
      
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'AI classification unavailable — please enter manually.');
      // Graceful fallback to manual entry mode with empty fields
      setSuggestion({
        transaction_type: 'Journal',
        debit_account: '',
        credit_account: '',
        amount: 0,
        narration: description,
        confidence: 0,
        is_ambiguous: true,
        clarification_needed: 'Manual entry fallback'
      });
      setEditDebit('');
      setEditCredit('');
      setEditAmount('');
      setEditNarration(description);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      debit: editDebit,
      credit: editCredit,
      amount: parseFloat(editAmount),
      narration: editNarration,
      type: suggestion.transaction_type
    });
    setSuggestion(null);
    setDescription('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ width: '500px', maxWidth: '90vw', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={20} color="var(--text-muted)" />
        </button>
        
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--accent-emerald)" />
          AI Manual Entry
        </h3>
        
        {!suggestion ? (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Describe the transaction in plain English. Meso AI will determine the correct double-entry posting.
            </p>
            {errorMsg && (
              <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                {errorMsg}
              </div>
            )}
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Paid ₹5,000 to Nitin for office supplies..."
              style={{ 
                width: '100%', height: '100px', padding: '12px', 
                borderRadius: '8px', border: '1px solid var(--border)', 
                backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)',
                resize: 'none', marginBottom: '16px'
              }}
            />
            <button 
              onClick={handleSuggest}
              disabled={loading || !description.trim()}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                backgroundColor: 'var(--text-primary)', color: 'var(--bg-card)',
                border: 'none', fontWeight: 600, cursor: 'pointer',
                opacity: loading || !description.trim() ? 0.7 : 1
              }}
            >
              {loading ? 'Analyzing...' : 'Generate Entry'}
            </button>
          </div>
        ) : (
          <div>
            {errorMsg && (
              <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                {errorMsg}
              </div>
            )}
            <div style={{ padding: '12px', backgroundColor: suggestion.is_ambiguous ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: suggestion.is_ambiguous ? '#f59e0b' : 'var(--accent-emerald)', fontWeight: 600, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {suggestion.is_ambiguous ? 'AMBIGUOUS INPUT (Review Carefully)' : `SUGGESTED POSTING (${Math.round(suggestion.confidence * 100)}% Confidence)`}
                </span>
                {suggestion.clarification_needed && (
                  <span style={{ fontSize: '11px', fontWeight: 400 }}>{suggestion.clarification_needed}</span>
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Debit Account</label>
                  <input value={editDebit} onChange={e => setEditDebit(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Credit Account</label>
                  <input value={editCredit} onChange={e => setEditCredit(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Amount</label>
                  <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Type</label>
                  <div style={{ padding: '8px', fontSize: '13px', fontWeight: 500 }}>{suggestion.transaction_type}</div>
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Narration</label>
                <input value={editNarration} onChange={e => setEditNarration(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setSuggestion(null)}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', cursor: 'pointer' }}
              >
                Back
              </button>
              <button 
                onClick={handleConfirm}
                style={{ flex: 2, padding: '10px', borderRadius: '6px', backgroundColor: 'var(--text-primary)', color: 'var(--bg-card)', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <CheckCircle2 size={16} /> Confirm & Post
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualEntryModal;
