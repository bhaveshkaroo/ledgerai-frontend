import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Search, CreditCard } from 'lucide-react';

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
  "Goldman Sachs Bank", "Morgan Stanley Bank", "Credit Suisse", "UBS", "Societe Generale", 
  "Rabobank", "ABN AMRO", "ING Bank", "Commerzbank", "UniCredit"
];

function BankModal({ isOpen, onClose, onAdd }) {
  const [step, setStep] = useState(1); // 1: form, 2: success
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
    if (!/^\d{9,18}$/.test(formData.accountNumber)) newErrors.accountNumber = "Invalid (9-18 digits)";
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc)) newErrors.ifsc = "Invalid IFSC format";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConnect = () => {
    if (!validate()) return;
    setStep(2); // loading
    setTimeout(() => {
      setStep(3); // success
      onAdd({
        bankName: formData.bankName,
        accountType: formData.accountType,
        accountNumber: formData.accountNumber.slice(-4)
      });
      setTimeout(() => {
        onClose();
        setStep(1);
        setFormData({ ...formData, bankName: '', accountNumber: '', ifsc: '' });
      }, 1500);
    }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><X size={20} /></button>
        
        {step === 1 && (
          <>
            <div className="modal-header">
              <CreditCard className="header-icon" />
              <h2>Connect Bank Account</h2>
              <p>Securely link your business accounts via RBI AA framework</p>
            </div>

            <div className="modal-form">
              <div className="form-group">
                <label>Bank Name</label>
                <div className="search-input">
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
                    className={errors.accountNumber ? 'error' : ''}
                    type="text" 
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                  />
                  {errors.accountNumber && <span className="err-txt">{errors.accountNumber}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input 
                    className={errors.ifsc ? 'error' : ''}
                    type="text" 
                    value={formData.ifsc}
                    onChange={(e) => setFormData({...formData, ifsc: e.target.value.toUpperCase()})}
                  />
                  {errors.ifsc && <span className="err-txt">{errors.ifsc}</span>}
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

              <div className="aa-toggle">
                <div className="aa-info">
                  <strong>Enable Account Aggregator (AA) Integration</strong>
                  <span>RBI regulated secure data sharing framework</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={formData.aaConsent}
                    onChange={(e) => setFormData({...formData, aaConsent: e.target.checked})}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={onClose}>Cancel</button>
                <button className="btn-connect" onClick={handleConnect}>Connect Bank Account</button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="loading-state">
            <div className="spinner"></div>
            <h3>Connecting to {formData.bankName}...</h3>
            <p>Authenticating via RBI secure gateway</p>
          </div>
        )}

        {step === 3 && (
          <div className="success-state">
            <div className="success-icon"><CheckCircle size={60} /></div>
            <h3>Account Connected Successfully!</h3>
            <p>Your bank data will be synchronized shortly.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(8px);
        }
        .modal-container {
          background: white;
          width: 520px;
          border-radius: 20px;
          padding: 40px;
          position: relative;
          color: #1a1a1a;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .close-btn {
          position: absolute;
          right: 20px;
          top: 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #999;
        }
        .modal-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header-icon {
          color: var(--accent-blue);
          margin-bottom: 12px;
          width: 40px;
          height: 40px;
        }
        .modal-header h2 {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .modal-header p {
          color: #666;
          font-size: 14px;
        }
        .form-group {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        label {
          font-size: 12px;
          font-weight: 700;
          color: #333;
          text-transform: uppercase;
        }
        input, select {
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }
        input.error { border-color: #ff4d4f; }
        .err-txt { font-size: 10px; color: #ff4d4f; margin-top: -4px; }
        .search-input { position: relative; }
        .search-icon { position: absolute; left: 12px; top: 14px; color: #999; }
        .search-input input { padding-left: 40px; width: 100%; }
        .bank-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-top: 4px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          z-index: 10;
        }
        .bank-option {
          padding: 10px 16px;
          cursor: pointer;
        }
        .bank-option:hover { background: #f5f5f5; }
        .aa-toggle {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        .aa-info { display: flex; flex-direction: column; }
        .aa-info strong { font-size: 13px; }
        .aa-info span { font-size: 11px; color: #666; }
        .modal-footer {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 16px;
        }
        .btn-cancel {
          padding: 14px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-connect {
          padding: 14px;
          border: none;
          background: #020a1c;
          color: white;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }
        .loading-state, .success-state {
          text-align: center;
          padding: 40px 0;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 24px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .success-icon { color: #52c41a; margin-bottom: 24px; }
        /* Switch styling */
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
          background-color: #ccc; transition: .4s; border-radius: 24px;
        }
        .slider:before {
          position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
          background-color: white; transition: .4s; border-radius: 50%;
        }
        input:checked + .slider { background-color: #3b82f6; }
        input:checked + .slider:before { transform: translateX(20px); }
      `}</style>
    </div>
  );
}

export default BankModal;
