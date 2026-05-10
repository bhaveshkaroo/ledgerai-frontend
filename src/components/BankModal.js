import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Search, CreditCard, Shield, Loader2 } from 'lucide-react';

const BANKS = [
  "State Bank of India", "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India", 
  "Bank of India", "Central Bank of India", "Indian Bank", "Indian Overseas Bank", "UCO Bank", 
  "Bank of Maharashtra", "Punjab and Sind Bank", "HDFC Bank", "ICICI Bank", "Axis Bank", 
  "Kotak Mahindra Bank", "Yes Bank", "IndusInd Bank", "IDFC First Bank", "Federal Bank", 
  "South Indian Bank", "Karur Vysya Bank", "City Union Bank", "Dhanlaxmi Bank", "Catholic Syrian Bank", 
  "Tamilnad Mercantile Bank", "Nainital Bank", "RBL Bank", "Bandhan Bank", "DCB Bank",
  "AU Small Finance Bank", "Equitas Small Finance Bank", "Ujjivan Small Finance Bank", 
  "ESAF Small Finance Bank", "Jana Small Finance Bank", "Suryoday Small Finance Bank", 
  "Utkarsh Small Finance Bank", "Capital Small Finance Bank", "Fincare Small Finance Bank", 
  "North East Small Finance Bank", "Airtel Payments Bank", "India Post Payments Bank", 
  "Jio Payments Bank", "Paytm Payments Bank", "Fino Payments Bank", "NSDL Payments Bank",
  "Saraswat Bank", "Abhyudaya Bank", "TJSB Bank", "Cosmos Bank", "Shamrao Vithal Bank", 
  "Kalupur Commercial Bank", "Citibank", "HSBC", "Standard Chartered", "Deutsche Bank", 
  "DBS Bank", "Barclays", "BNP Paribas", "Bank of America", "JPMorgan Chase", "Wells Fargo",
  "Goldman Sachs", "Morgan Stanley", "Credit Suisse", "UBS", "Societe Generale", 
  "Rabobank", "ABN AMRO", "ING Bank", "Commerzbank", "UniCredit"
];

function BankModal({ isOpen, onClose, onAdd }) {
  const [step, setStep] = useState('form'); // 'form', 'loading', 'success'
  const [bankSearch, setBankSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    accountType: 'Current Account',
    accountNumber: '',
    ifsc: '',
    accountHolder: 'Sharma Textiles Pvt Ltd',
    aaConsent: false
  });
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const filteredBanks = BANKS.filter(b => b.toLowerCase().includes(bankSearch.toLowerCase())).slice(0, 5);

  const validate = () => {
    let newErrors = {};
    if (!formData.bankName) newErrors.bankName = "Required";
    if (!/^\d{9,18}$/.test(formData.accountNumber)) newErrors.accountNumber = "9-18 digits required";
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc)) newErrors.ifsc = "Invalid IFSC format (e.g. HDFC0001234)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConnect = () => {
    if (!validate()) return;
    setStep('loading');
    setTimeout(() => {
      setStep('success');
      onAdd({
        bankName: formData.bankName,
        accountType: formData.accountType,
        accountNumber: formData.accountNumber.slice(-4)
      });
      setTimeout(() => {
        onClose();
        setStep('form');
        setBankSearch('');
        setFormData({ ...formData, bankName: '', accountNumber: '', ifsc: '', aaConsent: false });
      }, 1500);
    }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bank-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={24} /></button>
        
        {step === 'form' && (
          <div className="modal-padding">
            <div className="modal-header">
              <div className="icon-circle"><CreditCard size={24} /></div>
              <h2>Connect Bank Account</h2>
              <p>Securely link your business accounts via RBI AA framework</p>
            </div>

            <div className="form-body">
              <div className="form-group">
                <label>Bank Name</label>
                <div className="search-input-wrapper">
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search for your bank..." 
                    value={bankSearch}
                    onChange={(e) => {
                      setBankSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                  />
                  {showDropdown && bankSearch && (
                    <div className="bank-dropdown">
                      {filteredBanks.map(b => (
                        <div key={b} className="bank-option" onClick={() => {
                          setFormData({...formData, bankName: b});
                          setBankSearch(b);
                          setShowDropdown(false);
                        }}>
                          {b}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.bankName && <span className="error-text">{errors.bankName}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Account Type</label>
                  <select 
                    value={formData.accountType}
                    onChange={(e) => setFormData({...formData, accountType: e.target.value})}
                  >
                    <option>Current Account</option>
                    <option>Savings Account</option>
                    <option>Cash Credit Account</option>
                    <option>Overdraft Account</option>
                    <option>Fixed Deposit Account</option>
                    <option>Loan Account</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input 
                    className={errors.accountNumber ? 'input-error' : ''}
                    type="text" 
                    placeholder="Enter account number"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value.replace(/\D/g, '')})}
                  />
                  {errors.accountNumber && <span className="error-text">{errors.accountNumber}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input 
                    className={errors.ifsc ? 'input-error' : ''}
                    type="text" 
                    placeholder="e.g. HDFC0000123"
                    value={formData.ifsc}
                    onChange={(e) => setFormData({...formData, ifsc: e.target.value.toUpperCase()})}
                  />
                  {errors.ifsc && <span className="error-text">{errors.ifsc}</span>}
                </div>
                <div className="form-group">
                  <label>Account Holder</label>
                  <input 
                    type="text" 
                    value={formData.accountHolder}
                    onChange={(e) => setFormData({...formData, accountHolder: e.target.value})}
                  />
                </div>
              </div>

              <div className={`aa-consent-box ${formData.aaConsent ? 'active' : ''}`}>
                <div className="aa-flex">
                  <div className="aa-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong>Enable Account Aggregator (AA) Integration</strong>
                      <span className="aa-logo">AA</span>
                    </div>
                    <span>RBI regulated secure data sharing framework</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={formData.aaConsent}
                      onChange={(e) => setFormData({...formData, aaConsent: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {formData.aaConsent && (
                  <div className="aa-explanation">
                    <Shield size={14} />
                    <span>You are granting 1-year revocable consent to शर्मा Textiles Pvt Ltd to fetch your transaction data directly from your bank using the NBFC-AA framework.</span>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn-primary" onClick={handleConnect}>Connect Bank Account</button>
              </div>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="status-state">
            <Loader2 className="spinner" size={48} />
            <h3>Connecting to {formData.bankName}...</h3>
            <p>Authenticating via RBI secure gateway</p>
          </div>
        )}

        {step === 'success' && (
          <div className="status-state">
            <div className="success-icon-wrapper"><CheckCircle size={60} /></div>
            <h3 style={{ color: '#10b981' }}>Account Connected!</h3>
            <p>Your financial data is now being synchronized.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-padding { padding: 40px; }
        .modal-header { text-align: center; margin-bottom: 32px; }
        .icon-circle { width: 56px; height: 56px; background: rgba(59, 130, 246, 0.1); color: var(--accent-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .modal-header h2 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .modal-header p { color: var(--text-secondary); font-size: 14px; }

        .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        label { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
        
        input, select { padding: 12px 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border); border-radius: 10px; color: #fff; font-size: 14px; outline: none; }
        input:focus { border-color: var(--accent-blue); }
        .input-error { border-color: #ff4d4f !important; }
        .error-text { color: #ff4d4f; font-size: 11px; font-weight: 600; }

        .search-input-wrapper { position: relative; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
        .search-input-wrapper input { padding-left: 42px; width: 100%; }

        .bank-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #1e293b; border: 1px solid var(--border); border-radius: 10px; margin-top: 4px; z-index: 100; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
        .bank-option { padding: 12px 16px; cursor: pointer; font-size: 14px; }
        .bank-option:hover { background: rgba(59, 130, 246, 0.1); color: var(--accent-blue); }

        .aa-consent-box { background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); padding: 20px; border-radius: 12px; margin: 10px 0 30px; transition: all 0.3s; }
        .aa-consent-box.active { border-color: var(--accent-blue); background: rgba(59, 130, 246, 0.05); }
        .aa-flex { display: flex; justify-content: space-between; align-items: flex-start; }
        .aa-info { display: flex; flex-direction: column; gap: 4px; }
        .aa-info strong { font-size: 14px; }
        .aa-info span { font-size: 11px; color: var(--text-secondary); }
        .aa-logo { background: var(--accent-blue); color: #fff; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 4px; }
        
        .aa-explanation { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; gap: 10px; font-size: 11px; color: var(--text-secondary); line-height: 1.5; }

        .modal-actions { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; }
        .btn-secondary { padding: 14px; background: transparent; border: 1px solid var(--border); color: #fff; border-radius: 10px; font-weight: 600; cursor: pointer; }
        .btn-primary { padding: 14px; background: var(--accent-blue); border: none; color: #fff; border-radius: 10px; font-weight: 700; cursor: pointer; }

        .status-state { text-align: center; padding: 60px 40px; }
        .spinner { animation: spin 1s linear infinite; color: var(--accent-blue); margin: 0 auto 24px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .success-icon-wrapper { color: #10b981; margin-bottom: 24px; }

        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.1); transition: .4s; border-radius: 24px; }
        .toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .toggle-slider { background-color: var(--accent-blue); }
        input:checked + .toggle-slider:before { transform: translateX(20px); }
      `}</style>
    </div>
  );
}

export default BankModal;
