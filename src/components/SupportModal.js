import React, { useState } from 'react';
import { X, Headphones, CheckCircle2, Send } from 'lucide-react';

const CATEGORIES = [
  { id: 'statutory', label: 'GST & Statutory Compliance' },
  { id: 'accounting', label: 'Double-Entry & Reconciliation' },
  { id: 'invoicing', label: 'Invoicing & Inventory' },
  { id: 'bug', label: 'Technical Bug / Anomaly' },
  { id: 'feature', label: 'Feature Request / Improvement' },
  { id: 'other', label: 'General Accounting Support' }
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: 'var(--text-muted)' },
  { id: 'medium', label: 'Medium', color: 'var(--color-info)' },
  { id: 'high', label: 'High Priority', color: 'var(--color-warning)' },
  { id: 'urgent', label: 'Urgent Audit Deadline', color: 'var(--color-negative)' }
];

export default function SupportModal({ isOpen, onClose }) {
  const [category, setCategory] = useState('statutory');
  const [priority, setPriority] = useState('medium');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachDiagnostics, setAttachDiagnostics] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const ticketId = `MESO-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTicket = {
        id: ticketId,
        category,
        priority,
        subject,
        message,
        attachDiagnostics,
        createdAt: new Date().toISOString()
      };

      try {
        const existing = JSON.parse(localStorage.getItem('MESO_SUPPORT_TICKETS') || '[]');
        localStorage.setItem('MESO_SUPPORT_TICKETS', JSON.stringify([newTicket, ...existing]));
      } catch (_) {}

      setIsSubmitting(false);
      setSubmittedTicket(ticketId);
    }, 600);
  };

  const handleReset = () => {
    setSubmittedTicket(null);
    setSubject('');
    setMessage('');
    setCategory('statutory');
    setPriority('medium');
  };

  return (
    <div className="rafion-modal-overlay" onClick={onClose}>
      <div className="rafion-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="rafion-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="rafion-modal-icon-badge">
              <Headphones size={20} />
            </div>
            <div>
              <h2 className="rafion-modal-title">Customer Support & Helpdesk</h2>
              <p className="rafion-modal-subtitle">Drop a question, statutory doubt, or technical complaint</p>
            </div>
          </div>
          <button className="rafion-modal-close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {submittedTicket ? (
          <div className="rafion-modal-success">
            <div className="rafion-success-icon-wrapper">
              <CheckCircle2 size={44} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '12px 0 6px 0', color: 'var(--text-primary)' }}>
              Ticket #{submittedTicket} Created
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
              Your inquiry has been routed to our chartered accounting and technical engineering support team. You will receive an update shortly.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="rafion-btn-secondary" onClick={handleReset}>
                Drop Another Question
              </button>
              <button className="rafion-btn-dark" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rafion-modal-body">
            {/* Criteria Selection */}
            <div className="rafion-form-group">
              <label className="rafion-form-label">
                Question Criteria / Category
              </label>
              <div className="rafion-pills-wrap">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`rafion-criteria-pill ${category === cat.id ? 'active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Selection */}
            <div className="rafion-form-group">
              <label className="rafion-form-label">
                Urgency Level
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PRIORITIES.map(pri => (
                  <button
                    key={pri.id}
                    type="button"
                    className={`rafion-priority-pill ${priority === pri.id ? 'active' : ''}`}
                    onClick={() => setPriority(pri.id)}
                  >
                    <span className="rafion-priority-dot" style={{ background: pri.color }}></span>
                    {pri.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="rafion-form-group">
              <label className="rafion-form-label" htmlFor="support-subject">
                Subject
              </label>
              <input
                id="support-subject"
                type="text"
                className="rafion-input"
                placeholder="e.g. GSTR-3B vs 2B discrepancy in textile inventory..."
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Message */}
            <div className="rafion-form-group">
              <label className="rafion-form-label" htmlFor="support-message">
                Detailed Complaint or Question
              </label>
              <textarea
                id="support-message"
                className="rafion-textarea"
                rows={4}
                placeholder="Describe your question, error message, or reconciliation issue in detail..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>

            {/* Diagnostic Snapshot Toggle */}
            <label className="rafion-checkbox-row">
              <input
                type="checkbox"
                checked={attachDiagnostics}
                onChange={e => setAttachDiagnostics(e.target.checked)}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Attach current trial balance & diagnostic log to speed up CA resolution
              </span>
            </label>

            {/* Footer Buttons */}
            <div className="rafion-modal-footer">
              <button type="button" className="rafion-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="rafion-btn-dark"
                disabled={isSubmitting || !subject.trim() || !message.trim()}
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Submit Query</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
