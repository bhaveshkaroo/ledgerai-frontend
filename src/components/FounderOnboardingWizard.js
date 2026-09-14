import React, { useState } from 'react';
import { 
  Building2, Landmark, CheckCircle2, ArrowRight, ArrowLeft, 
  Sparkles, FileSpreadsheet, Plus, Info, Check, ShieldCheck 
} from 'lucide-react';
import { setBusinessProfile, getBusinessProfile } from '../utils/BusinessEngine';
import { LedgerEngine } from '../utils/LedgerEngine';

export default function FounderOnboardingWizard({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const existingProfile = getBusinessProfile();

  // Step 1: Business Details & GSTIN
  const [businessName, setBusinessName] = useState(existingProfile?.businessName || '');
  const [legalName, setLegalName] = useState(existingProfile?.legalName || '');
  const [gstin, setGstin] = useState(existingProfile?.gstin || '');
  const [pan, setPan] = useState(existingProfile?.pan || '');
  const [entityType, setEntityType] = useState(existingProfile?.entityType || 'Private Limited Company');
  const [industry, setIndustry] = useState(existingProfile?.industry || 'Services / Technology');

  // Step 2: Bank & Opening Balance
  const [bankName, setBankName] = useState(existingProfile?.bankName || 'HDFC Bank');
  const [accountNo, setAccountNo] = useState(existingProfile?.bankAccountNo || '');
  const [ifsc, setIfsc] = useState(existingProfile?.ifscCode || '');
  const [openingBalance, setOpeningBalance] = useState('500000');
  const [cashInHand, setCashInHand] = useState('25000');

  // Step 3: Setup Mode Choice
  const [setupOption, setSetupOption] = useState('clean'); // 'clean' or 'sample'

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
    // 1. Save Profile
    const updatedProfile = {
      ...existingProfile,
      businessName: businessName.trim() || 'My Business',
      legalName: legalName.trim() || businessName.trim() || 'My Business Pvt Ltd',
      gstin: gstin.toUpperCase().trim() || '27AABCA1234R1ZM',
      pan: (pan || gstin.slice(2, 12)).toUpperCase().trim() || 'AABCA1234R',
      entityType,
      industry,
      bankName,
      bankAccountNo: accountNo,
      ifscCode: ifsc.toUpperCase(),
      currency: 'INR'
    };
    setBusinessProfile(updatedProfile);

    // 2. If clean setup selected:
    if (setupOption === 'clean') {
      const parsedBankBal = parseFloat(openingBalance) || 0;
      const parsedCashBal = parseFloat(cashInHand) || 0;
      const totalEquity = parsedBankBal + parsedCashBal;

      const today = new Date().toISOString().slice(0, 10);
      const newTxs = [];

      if (totalEquity > 0) {
        // Initial capital contribution
        if (parsedBankBal > 0) {
          newTxs.push({
            id: `OB-BANK-${Date.now()}`,
            date: today,
            account: 'Cash and Bank',
            amount: parsedBankBal,
            type: 'Debit',
            narration: `Opening Capital introduced via ${bankName}`,
            ref: 'OB-001',
            category: 'Opening Balance'
          });
          newTxs.push({
            id: `OB-CAP1-${Date.now()}`,
            date: today,
            account: 'Share Capital',
            amount: parsedBankBal,
            type: 'Credit',
            narration: 'Promoter Share Capital introduced into Bank',
            ref: 'OB-001',
            category: 'Opening Balance'
          });
        }
        if (parsedCashBal > 0) {
          newTxs.push({
            id: `OB-CASH-${Date.now()}`,
            date: today,
            account: 'Cash and Bank',
            amount: parsedCashBal,
            type: 'Debit',
            narration: 'Cash in Hand Opening Float',
            ref: 'OB-002',
            category: 'Opening Balance'
          });
          newTxs.push({
            id: `OB-CAP2-${Date.now()}`,
            date: today,
            account: 'Share Capital',
            amount: parsedCashBal,
            type: 'Credit',
            narration: 'Promoter Cash Float Contribution',
            ref: 'OB-002',
            category: 'Opening Balance'
          });
        }
      }

      LedgerEngine.transactions = newTxs;
      localStorage.setItem('MESO_WORKSPACE_MODE', 'production');
      window.dispatchEvent(new Event('ledger-updated'));
    } else {
      // Keep sample company active
      localStorage.setItem('MESO_WORKSPACE_MODE', 'demo');
    }

    localStorage.setItem('MESO_ONBOARDING_COMPLETED', 'true');
    if (onComplete) onComplete(updatedProfile);
    if (onClose) onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(10, 15, 29, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '28px 32px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-card) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', background: 'rgba(6,64,43,0.1)', color: '#06402b', padding: '4px 10px', borderRadius: '100px', fontWeight: 700 }}>
              INDIAN FOUNDER SETUP • ZERO-TO-ONE
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Step {step} of 3</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
            {step === 1 && 'Set Up Your Indian Company Profile'}
            {step === 2 && 'Bank Account & Opening Cash Balances'}
            {step === 3 && 'Choose Your Starting Books Mode'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
            {step === 1 && 'Enter your business GSTIN and entity credentials for compliant GST and tax invoices.'}
            {step === 2 && 'Set your opening bank balance to align Day Book cash with your real bank account.'}
            {step === 3 && 'Start completely clean from zero, or explore pre-populated Indian sample books.'}
          </p>

          {/* Stepper Progress Bar */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: step >= 1 ? '#06402b' : 'var(--border)', transition: 'background 0.3s' }} />
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: step >= 2 ? '#06402b' : 'var(--border)', transition: 'background 0.3s' }} />
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: step >= 3 ? '#06402b' : 'var(--border)', transition: 'background 0.3s' }} />
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '28px 32px' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Business Trade Name *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Tech Innovations"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Entity Structure
                  </label>
                  <select
                    value={entityType}
                    onChange={e => setEntityType(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px' }}
                  >
                    <option value="Private Limited Company">Private Limited Company</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership / LLP">Partnership / LLP</option>
                    <option value="Public Limited">Public Limited</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    15-Digit GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setGstin(val);
                      if (val.length >= 12 && !pan) {
                        setPan(val.slice(2, 12));
                      }
                    }}
                    maxLength={15}
                    placeholder="27AABCA1234R1ZM"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    PAN Number (10-Digit)
                  </label>
                  <input
                    type="text"
                    value={pan}
                    onChange={e => setPan(e.target.value.toUpperCase())}
                    maxLength={10}
                    placeholder="AABCA1234R"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Industry / Business Activity
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  placeholder="e.g. IT Services, Retail, Textile, Logistics"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px' }}
                />
              </div>

              <div style={{ background: 'rgba(6,64,43,0.05)', border: '1px solid rgba(6,64,43,0.15)', borderRadius: '10px', padding: '12px', display: 'flex', gap: '10px' }}>
                <ShieldCheck size={18} color="#06402b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  All invoices generated will automatically inherit your legal GSTIN, state code, and comply with Schedule III Double-Entry format.
                </span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Primary Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="HDFC Bank / ICICI / SBI"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={e => setIfsc(e.target.value.toUpperCase())}
                    placeholder="HDFC0000060"
                    maxLength={11}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Bank Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                    placeholder="500000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Credited as Share Capital into Cash & Bank
                  </span>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Cash in Hand Float (₹)
                  </label>
                  <input
                    type="number"
                    value={cashInHand}
                    onChange={e => setCashInHand(e.target.value)}
                    placeholder="25000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Petty cash in office safe
                  </span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  AUTOMATIC DOUBLE-ENTRY POSTING PREVIEW:
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  <strong>Debit:</strong> Cash and Bank (Assets) — ₹{((parseFloat(openingBalance) || 0) + (parseFloat(cashInHand) || 0)).toLocaleString('en-IN')}<br/>
                  <strong>Credit:</strong> Share Capital / Equity — ₹{((parseFloat(openingBalance) || 0) + (parseFloat(cashInHand) || 0)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Option Clean */}
              <div 
                onClick={() => setSetupOption('clean')}
                style={{
                  border: setupOption === 'clean' ? '2px solid #06402b' : '1px solid var(--border)',
                  background: setupOption === 'clean' ? 'rgba(6,64,43,0.04)' : 'var(--bg-surface)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px'
                }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: setupOption === 'clean' ? '6px solid #06402b' : '2px solid var(--border)', marginTop: '2px', boxSizing: 'border-box' }} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    🟢 Start with Clean, Real Books (Recommended for New Founders)
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                    Your Day Book will start from zero with only your entered opening bank & cash balances. You can create invoices, record real expenses, or import your existing Tally/Zoho ledger via CSV.
                  </div>
                </div>
              </div>

              {/* Option Sample */}
              <div 
                onClick={() => setSetupOption('sample')}
                style={{
                  border: setupOption === 'sample' ? '2px solid #06402b' : '1px solid var(--border)',
                  background: setupOption === 'sample' ? 'rgba(6,64,43,0.04)' : 'var(--bg-surface)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px'
                }}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: setupOption === 'sample' ? '6px solid #06402b' : '2px solid var(--border)', marginTop: '2px', boxSizing: 'border-box' }} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    🟡 Keep Indian Sample Company Data (Apex Innovations Pvt Ltd)
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                    Retain the complete 3-year sample ledger with sales, purchases, TDS challans, and GST reconciliation records to test out all platform features.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-surface)'
        }}>
          {step > 1 ? (
            <button
              onClick={handleBack}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
              }}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                padding: '10px 16px', borderRadius: '8px', border: 'none',
                background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
              }}
            >
              Skip Setup for Now
            </button>
          )}

          <button
            onClick={handleNext}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              background: '#06402b', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(6, 64, 43, 0.25)'
            }}
          >
            <span>{step === 3 ? 'Launch My Books' : 'Continue'}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
