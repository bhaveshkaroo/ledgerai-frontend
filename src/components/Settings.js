import React, { useState, useEffect } from 'react';
import { getGeminiApiKey, setGeminiApiKey, clearGeminiApiKey } from '../utils/aiConfig';
import { getTheme, setTheme } from '../utils/ThemeEngine';
import { getCurrency, setCurrency, getExchangeRate, getRateMetadata, syncExchangeRate } from '../utils/CurrencyEngine';
import { 
  Sun, Moon, Key, DollarSign, IndianRupee, Save, RotateCcw, ShieldCheck, Globe, Building2, CheckCircle2, PlusCircle
} from 'lucide-react';
import { 
  getCompanyList, getActiveCompanyId, switchCompany, createNewCompany, isSampleCompanyActive 
} from '../utils/BusinessEngine';

function Settings({ onOpenNewCompanyModal }) {
  const [savedSettings, setSavedSettings] = useState(() => ({
    currency: getCurrency(),
    theme: getTheme(),
    apiKey: getGeminiApiKey()
  }));

  const [draft, setDraft] = useState(() => ({ ...savedSettings }));
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Multi-Company switch state
  const [companies, setCompanies] = useState(() => getCompanyList());
  const [activeCoId, setActiveCoId] = useState(() => getActiveCompanyId());

  const hasUnsavedChanges = 
    draft.currency !== savedSettings.currency ||
    draft.theme !== savedSettings.theme ||
    draft.apiKey !== savedSettings.apiKey;

  useEffect(() => {
    const handleCurrencyEvent = (e) => {
      const curr = e.detail?.currency || getCurrency();
      setSavedSettings(prev => ({ ...prev, currency: curr }));
    };
    const handleThemeEvent = (e) => {
      const th = e.detail?.theme || getTheme();
      setSavedSettings(prev => ({ ...prev, theme: th }));
    };
    const handleCompanySwitched = (e) => {
      setCompanies(getCompanyList());
      setActiveCoId(e.detail?.companyId || getActiveCompanyId());
    };

    window.addEventListener('currency-changed', handleCurrencyEvent);
    window.addEventListener('theme-changed', handleThemeEvent);
    window.addEventListener('company-switched', handleCompanySwitched);

    return () => {
      window.removeEventListener('currency-changed', handleCurrencyEvent);
      window.removeEventListener('theme-changed', handleThemeEvent);
      window.removeEventListener('company-switched', handleCompanySwitched);
    };
  }, []);

  const updateDraft = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleDiscard = () => {
    setDraft({ ...savedSettings });
    setSaveToast({ type: 'info', message: 'Unsaved changes discarded.' });
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleCompanySelect = (coId) => {
    if (coId === activeCoId) return;
    switchCompany(coId);
    setActiveCoId(coId);
    setSaveToast({
      type: 'success',
      message: `✓ Switched active business profile. Ledger & books updated instantly.`
    });
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges || isSaving) return;
    setIsSaving(true);

    try {
      if (draft.currency !== savedSettings.currency) {
        setCurrency(draft.currency);
      }
      if (draft.theme !== savedSettings.theme) {
        setTheme(draft.theme);
      }
      if (draft.apiKey !== savedSettings.apiKey) {
        if (draft.apiKey.trim()) {
          setGeminiApiKey(draft.apiKey.trim());
        } else {
          clearGeminiApiKey();
        }
      }

      setSavedSettings({ ...draft });
      window.dispatchEvent(new Event('ledger-updated'));
      window.dispatchEvent(new Event('currency-changed'));

      setSaveToast({
        type: 'success',
        message: `✓ Settings saved successfully.`
      });
    } catch (err) {
      setSaveToast({ type: 'error', message: `Failed to save: ${err.message}` });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  return (
    <div className="settings-page tab-content animate-fade" style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', flexWrap: 'wrap', gap: '16px',
        position: 'sticky', top: 0, background: 'var(--bg-page)',
        paddingTop: '12px', paddingBottom: '16px', zIndex: 20,
        borderBottom: '1px solid var(--border)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>System Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Switch businesses, configure currency &amp; theme, and manage AI keys.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!hasUnsavedChanges}
            style={{
              padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--border)',
              background: 'var(--bg-card)', color: hasUnsavedChanges ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '13px', fontWeight: 600, cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed',
              opacity: hasUnsavedChanges ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <RotateCcw size={14} />
            <span>Discard</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            style={{
              padding: '9px 20px', borderRadius: '8px', border: 'none',
              background: hasUnsavedChanges ? '#06402b' : 'var(--text-muted)', color: 'white',
              fontSize: '13px', fontWeight: 700, cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed',
              opacity: hasUnsavedChanges ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Save size={15} />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div style={{
          padding: '12px 18px', borderRadius: '10px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: saveToast.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          color: saveToast.type === 'success' ? '#059669' : '#dc2626',
          border: `1px solid ${saveToast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          fontWeight: 600, fontSize: '13px'
        }}>
          <ShieldCheck size={18} />
          <span>{saveToast.message}</span>
        </div>
      )}

      {/* 1. Multi-Company & Business Entity Switcher */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={16} color="var(--color-positive)" />
          <span>Active Business Profile &amp; Books</span>
        </div>
        <div className="settings-card" style={{ borderLeft: '3px solid var(--color-positive)' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Switch Operating Company</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Each company maintains completely isolated Books of Accounts, Day Book, GST, and TDS ledgers.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {companies.map(co => {
              const isActive = co.id === activeCoId;
              return (
                <div
                  key={co.id}
                  onClick={() => handleCompanySelect(co.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: 'var(--radius-md)',
                    border: isActive ? '2px solid var(--color-positive)' : '1px solid var(--border)',
                    background: isActive ? 'var(--color-positive-bg)' : 'var(--bg-surface)',
                    cursor: 'pointer', transition: 'all var(--duration-fast) ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                      background: isActive ? 'var(--color-positive)' : 'var(--border)',
                      color: isActive ? '#ffffff' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '13px'
                    }}>
                      {co.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {co.name} {co.isSample && <span style={{ fontSize: '10px', background: 'var(--color-warning-bg)', color: 'var(--color-warning)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', border: '1px solid var(--color-warning-border)' }}>SAMPLE CO</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {co.gstin ? `GSTIN: ${co.gstin}` : 'No GSTIN registered'}
                      </div>
                    </div>
                  </div>

                  {isActive ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-positive)', fontSize: '12px', fontWeight: 700 }}>
                      <CheckCircle2 size={16} /> Active Books
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCompanySelect(co.id); }}
                      className="settings-btn"
                    >
                      Switch to This
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                if (onOpenNewCompanyModal) onOpenNewCompanyModal();
                else window.dispatchEvent(new CustomEvent('open-onboarding-wizard'));
              }}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={14} /> + Add New Business
            </button>
          </div>
        </div>
      </div>

      {/* 2. Base Currency Translation (INR ⇄ USD) */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={16} color="#10b981" />
          <span>Base Reporting Currency</span>
        </div>
        <div className="settings-card" style={{ borderLeft: '3px solid #10b981' }}>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Reporting Currency</div>
              <div className="settings-row-desc">
                Select your functional reporting currency. Converts Dashboard KPIs, P&amp;L, Day Book, and Balance Sheet.
                <span style={{ display: 'block', marginTop: '4px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  Live exchange rate: <strong>1 USD = ₹{getExchangeRate().toFixed(2)} INR</strong>
                </span>
              </div>
            </div>

            <div className="option-pill-group">
              <button
                type="button"
                className={`option-pill ${draft.currency === 'INR' ? 'active' : ''}`}
                onClick={() => updateDraft('currency', 'INR')}
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                <IndianRupee size={15} color={draft.currency === 'INR' ? '#10b981' : 'currentColor'} />
                <span>₹ INR</span>
              </button>
              <button
                type="button"
                className={`option-pill ${draft.currency === 'USD' ? 'active' : ''}`}
                onClick={() => updateDraft('currency', 'USD')}
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                <DollarSign size={15} color={draft.currency === 'USD' ? '#10b981' : 'currentColor'} />
                <span>$ USD</span>
              </button>
            </div>
          </div>

          <div style={{
            marginTop: '14px', padding: '10px 14px', borderRadius: '8px',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={14} color="#3b82f6" />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Forex Rate: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>1 USD = ₹{getExchangeRate().toFixed(2)}</strong>
                <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  ({getRateMetadata().provider})
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                const res = await syncExchangeRate(true);
                setSaveToast({
                  type: 'success',
                  message: `✓ Exchange rate updated: 1 USD = ₹${res.rate.toFixed(2)}`
                });
                setTimeout(() => setSaveToast(null), 3000);
              }}
              style={{
                background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px',
                padding: '4px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Sync Live Rate
            </button>
          </div>
        </div>
      </div>

      {/* 3. Appearance & Dark/Light Mode */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sun size={16} color="#f59e0b" />
          <span>Appearance &amp; Theme</span>
        </div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Color Scheme</div>
              <div className="settings-row-desc">
                Toggle between light and dark theme
              </div>
            </div>

            <div className="option-pill-group">
              <button
                type="button"
                className={`option-pill ${draft.theme === 'light' ? 'active' : ''}`}
                onClick={() => updateDraft('theme', 'light')}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <Sun size={15} color={draft.theme === 'light' ? '#f59e0b' : 'currentColor'} />
                <span>Light</span>
              </button>
              <button
                type="button"
                className={`option-pill ${draft.theme === 'dark' ? 'active' : ''}`}
                onClick={() => updateDraft('theme', 'dark')}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <Moon size={15} color={draft.theme === 'dark' ? '#38bdf8' : 'currentColor'} />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. AI Credentials & Centralized API Key */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={16} color="#10b981" />
          <span>Gemini AI API Key</span>
        </div>
        <div className="settings-card">
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '14px' }}>
            <div className="settings-row-info">
              <div className="settings-row-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>API Key Configuration</span>
                <span style={{
                  fontSize: '11px', padding: '2px 8px', borderRadius: '12px',
                  background: draft.apiKey.trim() ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  color: draft.apiKey.trim() ? '#10b981' : '#ef4444', fontWeight: 600
                }}>
                  {draft.apiKey.trim() ? '● Configured' : '○ Not Configured'}
                </span>
              </div>
              <div className="settings-row-desc">
                Powers AI Smart Journal Entry, Section 43B(h) Auditor, and Compliance Assistant.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={draft.apiKey}
                onChange={e => updateDraft('apiKey', e.target.value)}
                placeholder="Paste Gemini API Key (e.g. AIzaSy...)"
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid var(--border)', background: 'var(--bg-surface)',
                  color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'monospace', outline: 'none'
                }}
              />
              <button
                type="button"
                className="settings-btn"
                onClick={() => setShowApiKey(!showApiKey)}
                style={{ minWidth: '70px' }}
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
              {draft.apiKey && (
                <button
                  type="button"
                  className="settings-btn"
                  onClick={() => updateDraft('apiKey', '')}
                  style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
