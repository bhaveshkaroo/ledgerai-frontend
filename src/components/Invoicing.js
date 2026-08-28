import React, { useState, useMemo } from 'react';
import { InvoiceEngine, HSN_MASTER } from '../utils/InvoiceEngine';
import { formatINR } from '../utils/LedgerEngine';
import { Search, Plus, FileText, CheckCircle2, AlertCircle, Ban, X, Trash2 } from 'lucide-react';

function Invoicing() {
  const [invoices, setInvoices] = useState([...InvoiceEngine.invoices]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const refreshInvoices = () => {
    setInvoices([...InvoiceEngine.invoices]);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inv.party.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // KPI calculations
  const totalInvoiced = useMemo(() => {
    return invoices
      .filter(i => i.status === 'Finalized')
      .reduce((sum, i) => sum + i.total, 0);
  }, [invoices]);

  const totalTax = useMemo(() => {
    return invoices
      .filter(i => i.status === 'Finalized')
      .reduce((sum, i) => sum + i.taxAmount, 0);
  }, [invoices]);

  const handleVoid = (invoiceNumber) => {
    if (window.confirm(`Are you sure you want to void invoice ${invoiceNumber}? This will create a reversal entry in the ledger.`)) {
      try {
        InvoiceEngine.voidInvoice(invoiceNumber);
        refreshInvoices();
        setFeedbackMsg({ type: 'success', text: `Invoice ${invoiceNumber} voided and reversed in ledger.` });
      } catch (err) {
        setFeedbackMsg({ type: 'error', text: err.message });
      }
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  return (
    <div className="tab-content" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header & KPI cards */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Sales Invoicing</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Automated GST calculation &amp; double-entry posting</p>
        </div>
        
        <button 
          className="action-btn" 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--text-primary)', color: 'var(--bg-card)', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {feedbackMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: feedbackMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          color: feedbackMsg.type === 'success' ? '#10b981' : '#ef4444',
          border: `1px solid ${feedbackMsg.type === 'success' ? '#10b981' : '#ef4444'}`
        }}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {feedbackMsg.text}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Total Invoiced (Gross)</div>
          <div style={{ fontSize: '22px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatINR(totalInvoiced)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>Includes Base + GST</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Output GST Collected</div>
          <div style={{ fontSize: '22px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#3b82f6' }}>{formatINR(totalTax)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>CGST / SGST / IGST Output</div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Finalized Invoices</div>
          <div style={{ fontSize: '22px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#10b981' }}>
            {invoices.filter(i => i.status === 'Finalized').length} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>/ {invoices.length} Total</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>Posted to Ledger &amp; AR</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', 'Finalized', 'Draft', 'Void'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`sidebar-btn ${statusFilter === status ? 'active' : ''}`}
              style={{ width: 'auto', background: statusFilter === status ? 'var(--bg-surface)' : 'transparent', padding: '4px 12px', fontSize: '12px' }}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="command-bar-trigger" style={{ width: '260px' }}>
          <Search size={14} />
          <input 
            type="text" 
            placeholder="Search invoice or customer..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%' }}
          />
        </div>
      </div>

      {/* Invoice Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Invoice #</th>
              <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
              <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer / Party</th>
              <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Taxable Base</th>
              <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>GST</th>
              <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Total</th>
              <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px 20px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No invoices found matching current filter.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.invoiceNumber} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '14px 20px', fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {inv.invoiceNumber}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {inv.date}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{inv.party}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {inv.lineItems.map(l => `${l.description} (${l.qty}x)`).join(', ')}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {formatINR(inv.subtotal)}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#3b82f6' }}>
                    {formatINR(inv.taxAmount)}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatINR(inv.total)}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: inv.status === 'Finalized' ? 'rgba(16,185,129,0.1)' : inv.status === 'Void' ? 'rgba(239,68,68,0.1)' : 'rgba(156,163,175,0.1)',
                      color: inv.status === 'Finalized' ? '#10b981' : inv.status === 'Void' ? '#ef4444' : 'var(--text-secondary)'
                    }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    {inv.status === 'Finalized' && (
                      <button
                        onClick={() => handleVoid(inv.invoiceNumber)}
                        className="action-btn"
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Void
                      </button>
                    )}
                    {inv.status === 'Draft' && (
                      <button
                        onClick={() => {
                          try {
                            InvoiceEngine.finalizeInvoice(inv.invoiceNumber);
                            refreshInvoices();
                          } catch (e) {
                            alert(e.message);
                          }
                        }}
                        className="action-btn"
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          background: 'var(--text-primary)',
                          color: 'var(--bg-card)',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Finalize
                      </button>
                    )}
                    {inv.status === 'Void' && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reversed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Invoice Modal */}
      {isModalOpen && (
        <NewInvoiceModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            refreshInvoices();
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function NewInvoiceModal({ isOpen, onClose, onSuccess }) {
  const [party, setParty] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [placeOfSupply, setPlaceOfSupply] = useState('LOCAL');
  const [lineItems, setLineItems] = useState([
    { description: 'Computers', hsnSac: '8471', qty: 1, rate: 10000 }
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAddItem = () => {
    setLineItems([...lineItems, { description: 'IT Services', hsnSac: '9983', qty: 1, rate: 5000 }]);
  };

  const handleRemoveItem = (index) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    if (field === 'hsnSac') {
      const hsnInfo = HSN_MASTER[value];
      if (hsnInfo) {
        updated[index].description = hsnInfo.description;
      }
    }
    setLineItems(updated);
  };

  // Preview Totals
  const previewSubtotal = lineItems.reduce((sum, item) => sum + (Number(item.qty) * Number(item.rate)), 0);
  const previewTax = lineItems.reduce((sum, item) => {
    const rate = (HSN_MASTER[item.hsnSac] || { rate: 18 }).rate;
    return sum + ((Number(item.qty) * Number(item.rate)) * (rate / 100));
  }, 0);
  const previewTotal = previewSubtotal + previewTax;

  const handleSubmit = (finalizeNow = true) => {
    if (!party.trim()) {
      setErrorMsg('Customer/Party name is required.');
      return;
    }
    if (lineItems.some(item => Number(item.qty) <= 0 || Number(item.rate) <= 0)) {
      setErrorMsg('Quantity and Rate must be greater than zero for all items.');
      return;
    }

    try {
      const inv = InvoiceEngine.createInvoice(
        date,
        party.trim(),
        lineItems.map(l => ({
          description: l.description,
          hsnSac: l.hsnSac,
          qty: Number(l.qty),
          rate: Number(l.rate)
        })),
        placeOfSupply
      );

      if (finalizeNow) {
        InvoiceEngine.finalizeInvoice(inv.invoiceNumber);
      }

      onSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create invoice.');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="card" style={{ width: '640px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '24px' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={20} color="var(--text-muted)" />
        </button>
        
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--text-primary)" />
          Create Tax Invoice
        </h3>

        {errorMsg && (
          <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Customer / Party Name</label>
            <input 
              type="text"
              placeholder="e.g. Acme Corp" 
              value={party} 
              onChange={e => { setParty(e.target.value); setErrorMsg(''); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '13px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Invoice Date</label>
            <input 
              type="date"
              value={date} 
              onChange={e => setDate(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '13px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Place of Supply</label>
            <select
              value={placeOfSupply}
              onChange={e => setPlaceOfSupply(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              <option value="LOCAL">Intra-State (CGST+SGST)</option>
              <option value="INTER_STATE">Inter-State (IGST)</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Line Items</span>
            <button 
              type="button" 
              onClick={handleAddItem}
              style={{ fontSize: '12px', color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lineItems.map((item, index) => {
              const hsnRate = (HSN_MASTER[item.hsnSac] || { rate: 18 }).rate;
              const itemTotal = Number(item.qty) * Number(item.rate);
              return (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 40px', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={e => handleItemChange(index, 'description', e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: '13px', color: 'var(--text-primary)' }}
                  />
                  <select 
                    value={item.hsnSac}
                    onChange={e => handleItemChange(index, 'hsnSac', e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: '12px', color: 'var(--text-primary)' }}
                  >
                    <option value="8471">8471 - Computers (18% Goods)</option>
                    <option value="9983">9983 - IT Services (18% Services)</option>
                    <option value="8517">8517 - Phones (12% Goods)</option>
                    <option value="0401">0401 - Milk (0% Nil)</option>
                  </select>
                  <input 
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.qty}
                    onChange={e => handleItemChange(index, 'qty', e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: '13px', color: 'var(--text-primary)' }}
                  />
                  <input 
                    type="number"
                    min="0"
                    placeholder="Rate (₹)"
                    value={item.rate}
                    onChange={e => handleItemChange(index, 'rate', e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: '13px', color: 'var(--text-primary)' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(index)}
                    disabled={lineItems.length === 1}
                    style={{ background: 'none', border: 'none', cursor: lineItems.length === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-muted)', opacity: lineItems.length === 1 ? 0.3 : 1 }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Calculation Box */}
        <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Taxable Subtotal:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatINR(previewSubtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              GST Output ({placeOfSupply === 'LOCAL' ? 'CGST + SGST' : 'IGST'}):
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#3b82f6' }}>{formatINR(previewTax)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '15px', fontWeight: 700 }}>
            <span>Invoice Total:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{formatINR(previewTotal)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: '10px', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px' }}
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={() => handleSubmit(false)}
            style={{ flex: 1, padding: '10px', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
          >
            Save Draft
          </button>
          <button 
            type="button"
            onClick={() => handleSubmit(true)}
            style={{ flex: 2, padding: '10px', borderRadius: '6px', background: 'var(--text-primary)', color: 'var(--bg-card)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <CheckCircle2 size={16} /> Finalize &amp; Post to Ledger
          </button>
        </div>
      </div>
    </div>
  );
}

export default Invoicing;
