import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Search, CreditCard, Shield, Loader2, Info } from 'lucide-react';

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
  const [step, setStep] = useState('form'); 
  const [bankSearch, setBankSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [existingCount, setExistingCount] = useState(0);
  const [formData, setFormData] = useState({
    bankName: '',
    accountType: 'Current Account',
    accountNumber: '',
    ifsc: '',
    accountHolder: 'Sharma Textiles Pvt Ltd',
    aaConsent: false
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('ledgerai_connected_banks');
    if (saved) setExistingCount(JSON.parse(saved).length);
  }, [isOpen]);

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
      const masked = `XXXX-XXXX-${formData.accountNumber.slice(-4)}`;
      const newBank = {
        bankName: formData.bankName,
        accountType: formData.accountType,
        accountNumberMasked: masked,
        ifscCode: formData.ifsc,
        accountHolderName: formData.accountHolder,
        aaEnabled: formData.aaConsent,
        connectedAt: new Date().toISOString()
      };

      const saved = localStorage.getItem('ledgerai_connected_banks');
      const banks = saved ? JSON.parse(saved) : [];
      banks.push(newBank);
      localStorage.setItem('ledgerai_connected_banks', JSON.stringify(banks));

      setStep('success');
      onAdd(newBank);
      
      setTimeout(() => {
        onClose();
        setStep('form');
        setBankSearch('');
        setFormData({ ...formData, bankName: '', accountNumber: '', ifsc: '', aaConsent: false });
      }, 1500);
    }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
      <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden', maxWidth: 600, width: '90%' }}>
        <button className="modal-close" onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        
        {step === 'form' && (
          <div style={{ padding: 40 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 56, height: 56, background: '#f5f5f7', color: '#000000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CreditCard size={24} />
              </div>
              <h2 className="heading-serif" style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Connect Bank Account</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Securely link your business accounts via RBI AA framework</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bank Name</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" placeholder="Search for your bank..." value={bankSearch} 
                    onChange={(e) => { setBankSearch(e.target.value); setShowDropdown(true); }} 
                    onFocus={() => setShowDropdown(true)} 
                    style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: 8, border: '1px solid var(--border)', background: '#ffffff', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                  />
                  {showDropdown && bankSearch && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#ffffff', border: '1px solid var(--border)', borderRadius: 8, marginTop: 4, zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                      {filteredBanks.map(b => (
                        <div key={b} onClick={() => { setFormData({...formData, bankName: b}); setBankSearch(b); setShowDropdown(false); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)' }}>{b}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Account Type</label>
                  <select value={formData.accountType} onChange={(e) => setFormData({...formData, accountType: e.target.value})} style={{ padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: '#ffffff', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}>
                    <option>Current Account</option><option>Savings Account</option><option>Loan Account</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Account Number</label>
                  <input type="text" placeholder="Enter number" value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value.replace(/\D/g, '')})} style={{ padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: '#ffffff', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                </div>
              </div>

              <div style={{ background: '#f5f5f7', padding: 20, borderRadius: 12, border: `1px solid var(--border)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>Enable RBI AA Integration</strong>
                      <span style={{ fontSize: 10, fontWeight: 800, background: '#000000', color: '#ffffff', padding: '2px 6px', borderRadius: 4 }}>NBFC-AA</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Secure regulated data sharing framework</span>
                  </div>
                  <input type="checkbox" checked={formData.aaConsent} onChange={(e) => setFormData({...formData, aaConsent: e.target.checked})} style={{ width: 20, height: 20 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginTop: 12 }}>
                <button onClick={onClose} style={{ padding: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleConnect} style={{ padding: '14px', background: '#000000', color: '#ffffff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Connect Bank Account</button>
              </div>
            </div>
          </div>
        )}

        {(step === 'loading' || step === 'success') && (
          <div style={{ padding: '80px 40px', textAlign: 'center' }}>
            {step === 'loading' ? <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 24px', color: '#000000' }} /> : <CheckCircle size={60} style={{ margin: '0 auto 24px', color: '#34c759' }} />}
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{step === 'loading' ? `Connecting to ${formData.bankName}...` : 'Account Connected!'}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{step === 'loading' ? 'Authenticating via secure gateway' : 'Your data is being synchronized.'}</p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

export default BankModal;
