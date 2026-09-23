import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { setBusinessProfile, getBusinessProfile, createNewCompany, switchCompany, getActiveCompanyId, saveCompanySnapshot } from '../utils/BusinessEngine';
import { LedgerEngine } from '../utils/LedgerEngine';

export default function FounderOnboardingWizard({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(1);

  // Step 1: Business Details & GSTIN
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [entityType, setEntityType] = useState('Private Limited Company');
  const [industry, setIndustry] = useState('');

  // Step 2: Bank & Opening Balance
  const [bankName, setBankName] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [cashInHand, setCashInHand] = useState('0');

  // Step 3: Setup Mode Choice
  const [setupOption, setSetupOption] = useState('clean');

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) {
      setStep(s => s + 1);
    } else {
      handleFinalize();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleFinalize = () => {
    const profileData = {
      businessName: businessName.trim() || 'My Business',
      legalName: (businessName.trim() || 'My Business') + ' Pvt Ltd',
      gstin: gstin.toUpperCase().trim(),
      pan: (pan || (gstin.length >= 12 ? gstin.slice(2, 12) : '')).toUpperCase().trim(),
      entityType,
      industry: industry || 'General Business',
      bankName,
      ifscCode: ifsc.toUpperCase(),
      currency: 'INR'
    };

    if (setupOption === 'clean') {
      // Build opening balance transactions
      const parsedBankBal = parseFloat(openingBalance) || 0;
      const parsedCashBal = parseFloat(cashInHand) || 0;
      const today = new Date().toISOString().slice(0, 10);
      const newTxs = [];

      if (parsedBankBal > 0) {
        newTxs.push({
          id: `OB-BANK-${Date.now()}A`, date: today, account: 'Cash and Bank',
          amount: parsedBankBal, type: 'Debit',
          narration: `Opening Capital introduced via ${bankName}`,
          ref: 'OB-001', category: 'Opening Balance'
        });
        newTxs.push({
          id: `OB-BANK-${Date.now()}B`, date: today, account: 'Share Capital',
          amount: parsedBankBal, type: 'Credit',
          narration: 'Promoter Share Capital introduced into Bank',
          ref: 'OB-001', category: 'Opening Balance'
        });
      }
      if (parsedCashBal > 0) {
        newTxs.push({
          id: `OB-CASH-${Date.now()}A`, date: today, account: 'Cash and Bank',
          amount: parsedCashBal, type: 'Debit',
          narration: 'Cash in Hand Opening Float',
          ref: 'OB-002', category: 'Opening Balance'
        });
        newTxs.push({
          id: `OB-CASH-${Date.now()}B`, date: today, account: 'Share Capital',
          amount: parsedCashBal, type: 'Credit',
          narration: 'Promoter Cash Float Contribution',
          ref: 'OB-002', category: 'Opening Balance'
        });
      }

      // Create a brand-new company (saves current company first, then switches)
      createNewCompany(profileData, newTxs);
    } else {
      // Keep sample company data — just update the profile name
      setBusinessProfile({ ...getBusinessProfile(), ...profileData });
    }

    if (onComplete) onComplete(profileData);
    if (onClose) onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(10, 15, 29, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: '20px',
        border: '1px solid var(--border)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '28px 32px 20px', borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-card) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', background: 'rgba(6,64,43,0.1)', color: '#06402b', padding: '4px 10px', borderRadius: '100px', fontWeight: 700 }}>
              NEW COMPANY • STEP {step} OF 3
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
            {step === 1 && 'Set Up Your Indian Company Profile'}
            {step === 2 && 'Bank Account & Opening Cash Balances'}
            {step === 3 && 'Choose Your Starting Books Mode'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
            {step === 1 && 'Enter your business GSTIN and entity credentials.'}
            {step === 2 && 'Set your opening bank balance to align Day Book with your real bank.'}
            {step === 3 && 'Start clean from zero, or keep exploring the sample company.'}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: step >= s ? '#06402b' : 'var(--border)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Business Trade Name *</label>
                  <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Acme Tech Innovations"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Entity Structure</label>
                  <select value={entityType} onChange={e => setEntityType(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }}>
                    <option value="Private Limited Company">Private Limited Company</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership / LLP">Partnership / LLP</option>
                    <option value="Public Limited">Public Limited</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>15-Digit GSTIN (Optional)</label>
                  <input type="text" value={gstin} onChange={e => { const v = e.target.value.toUpperCase(); setGstin(v); if (v.length >= 12 && !pan) setPan(v.slice(2, 12)); }} maxLength={15} placeholder="27AABCA1234R1ZM"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>PAN Number (10-Digit)</label>
                  <input type="text" value={pan} onChange={e => setPan(e.target.value.toUpperCase())} maxLength={10} placeholder="AABCA1234R"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Industry / Business Activity</label>
                <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. IT Services, Retail, Logistics"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ background: 'rgba(6,64,43,0.05)', border: '1px solid rgba(6,64,43,0.15)', borderRadius: '10px', padding: '12px', display: 'flex', gap: '10px' }}>
                <ShieldCheck size={18} color="#06402b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  All invoices will automatically inherit your GSTIN and comply with Schedule III Double-Entry format.
                </span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Primary Bank Name</label>
                  <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="HDFC Bank / ICICI / SBI"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>IFSC Code</label>
                  <input type="text" value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} placeholder="HDFC0000060" maxLength={11}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Bank Opening Balance (₹)</label>
                  <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} placeholder="500000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, boxSizing: 'border-box' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Credited as Share Capital into Cash & Bank</span>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Cash in Hand Float (₹)</label>
                  <input type="number" value={cashInHand} onChange={e => setCashInHand(e.target.value)} placeholder="25000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, boxSizing: 'border-box' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Petty cash in office safe</span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>AUTOMATIC DOUBLE-ENTRY PREVIEW:</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  <strong>Debit:</strong> Cash and Bank — ₹{((parseFloat(openingBalance) || 0) + (parseFloat(cashInHand) || 0)).toLocaleString('en-IN')}<br/>
                  <strong>Credit:</strong> Share Capital — ₹{((parseFloat(openingBalance) || 0) + (parseFloat(cashInHand) || 0)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div onClick={() => setSetupOption('clean')} style={{
                border: setupOption === 'clean' ? '2px solid #06402b' : '1px solid var(--border)',
                background: setupOption === 'clean' ? 'rgba(6,64,43,0.04)' : 'var(--bg-surface)',
                borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '14px'
              }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: setupOption === 'clean' ? '6px solid #06402b' : '2px solid var(--border)', marginTop: '2px', boxSizing: 'border-box', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>🟢 Create New Company with Clean Books (Recommended)</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                    A brand-new company will be created. Your Day Book starts from zero with only your opening balances. All tabs (GST, TDS, Reports) will be empty. You can switch back to the sample company anytime.
                  </div>
                </div>
              </div>
              <div onClick={() => setSetupOption('sample')} style={{
                border: setupOption === 'sample' ? '2px solid #06402b' : '1px solid var(--border)',
                background: setupOption === 'sample' ? 'rgba(6,64,43,0.04)' : 'var(--bg-surface)',
                borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '14px'
              }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: setupOption === 'sample' ? '6px solid #06402b' : '2px solid var(--border)', marginTop: '2px', boxSizing: 'border-box', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700 }}>🟡 Just Rename the Current Sample Company</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                    Keep the full 3-year sample ledger and only update the company name. Good for exploring all features first.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 32px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)'
        }}>
          {step > 1 ? (
            <button onClick={handleBack} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)',
              fontWeight: 600, fontSize: '13px', cursor: 'pointer'
            }}>
              <ArrowLeft size={15} /> Back
            </button>
          ) : (
            <button onClick={onClose} style={{
              padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'transparent',
              color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
            }}>Skip for Now</button>
          )}
          <button onClick={handleNext} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px',
            border: 'none', background: '#06402b', color: '#fff', fontWeight: 700, fontSize: '13px',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(6, 64, 43, 0.25)'
          }}>
            {step === 3 ? 'Create Company & Launch' : 'Continue'} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
