import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { removeCompany } from '../utils/BusinessEngine';

export default function RemoveCompanyModal({ isOpen, onClose, company, onRemoved }) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !company) return null;

  const handleConfirm = () => {
    if (confirmationInput.trim() !== 'remove') {
      setError('You must type "remove" exactly in lowercase to proceed.');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      removeCompany(company.id);
      setIsDeleting(false);
      setConfirmationInput('');
      if (onRemoved) onRemoved(company.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to remove business.');
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmationInput('');
    setError('');
    onClose();
  };

  const isMatched = confirmationInput.trim() === 'remove';

  return (
    <div className="rafion-modal-overlay" onClick={handleClose}>
      <div className="rafion-modal-card" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="rafion-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="rafion-modal-icon-badge" style={{ color: 'var(--color-negative)', background: 'var(--color-negative-bg)' }}>
              <Trash2 size={20} />
            </div>
            <div>
              <h2 className="rafion-modal-title">Remove Business Entity</h2>
              <p className="rafion-modal-subtitle">Permanent deletion of books & vouchers</p>
            </div>
          </div>
          <button className="rafion-modal-close-btn" onClick={handleClose} title="Cancel">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="rafion-modal-body">
          <div style={{
            background: 'var(--color-negative-bg)',
            border: '1px solid var(--color-negative-border)',
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <AlertTriangle size={18} color="var(--color-negative)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{company.name}</strong>?
              All journal entries, trial balances, inventory stock, and invoice records for this business will be permanently erased.
            </div>
          </div>

          <div className="rafion-form-group" style={{ marginTop: '8px' }}>
            <label className="rafion-form-label" htmlFor="remove-confirm-input" style={{ fontSize: '13px' }}>
              To confirm deletion, please type <strong style={{ color: 'var(--color-negative)', fontFamily: 'var(--font-mono)' }}>remove</strong> in lowercase:
            </label>
            <input
              id="remove-confirm-input"
              type="text"
              className="rafion-input"
              style={{
                fontFamily: 'var(--font-mono)',
                borderColor: isMatched ? 'var(--color-negative)' : undefined,
                fontWeight: 600
              }}
              placeholder='Type "remove" here'
              value={confirmationInput}
              onChange={e => {
                setConfirmationInput(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
            {error && (
              <span style={{ fontSize: '12px', color: 'var(--color-negative)', marginTop: '4px' }}>
                {error}
              </span>
            )}
          </div>

          {/* Footer Controls */}
          <div className="rafion-modal-footer" style={{ marginTop: '8px' }}>
            <button type="button" className="rafion-btn-secondary" onClick={handleClose}>
              Keep Business
            </button>
            <button
              type="button"
              className="rafion-btn-dark"
              style={{
                background: isMatched ? 'var(--color-negative)' : '#94a3b8',
                borderColor: isMatched ? 'var(--color-negative)' : '#94a3b8',
                cursor: isMatched && !isDeleting ? 'pointer' : 'not-allowed',
                opacity: isMatched ? 1 : 0.6
              }}
              disabled={!isMatched || isDeleting}
              onClick={handleConfirm}
            >
              <Trash2 size={14} />
              <span>{isDeleting ? 'Removing...' : 'Permanently Delete'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
