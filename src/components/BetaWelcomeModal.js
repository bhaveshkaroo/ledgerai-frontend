import React from 'react';
import { X, Sparkles, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';

export default function BetaWelcomeModal({ isOpen, onClose, onGoToSettings }) {
  if (!isOpen) return null;

  return (
    <div className="rafion-modal-overlay" onClick={onClose}>
      <div 
        className="rafion-modal-card" 
        style={{ maxWidth: '520px', position: 'relative' }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="rafion-modal-header" style={{ paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="rafion-modal-icon-badge" style={{ background: '#111111', color: '#ffffff' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="rafion-modal-title">Important Notice: Testing Beta</h2>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--color-positive)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  AI ASSISTANT
                </span>
              </div>
              <p className="rafion-modal-subtitle">AI-Powered Accounting & Statutory Intelligence</p>
            </div>
          </div>
          <button className="rafion-modal-close-btn" onClick={onClose} title="Dismiss notice">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="rafion-modal-body" style={{ gap: '18px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Welcome to <strong>Meso AI</strong>! Meet <strong>Beta</strong>, our autonomous AI assistant designed to verify double-entry books, draft invoices, reconcile bank statements, and validate statutory GST compliance.
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
              <KeyRound size={16} color="var(--color-warning)" />
              <span>How to Test Beta with your API Key</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              To activate and test <strong>Beta</strong>, please upload your <strong>Google Gemini API Key</strong> in the <strong>API Key section in Settings</strong>.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} color="var(--color-positive)" />
              <span>Your API key is securely stored in your local browser storage and never shared.</span>
            </div>
          </div>

          <div style={{
            padding: '12px 14px',
            background: 'rgba(59, 130, 246, 0.06)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}>
            <strong>Demo Product Notice:</strong> This is a demonstration sandbox to show how automated AI intelligence makes accounting effortless for businesses. Dismiss this note at any time to explore the full platform.
          </div>

          {/* Footer Controls */}
          <div className="rafion-modal-footer">
            <button 
              type="button" 
              className="rafion-btn-secondary" 
              onClick={onClose}
            >
              Continue to Meso
            </button>
            <button 
              type="button" 
              className="rafion-btn-dark"
              onClick={() => {
                onClose();
                if (onGoToSettings) onGoToSettings();
              }}
            >
              <span>Add API Key in Settings</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
