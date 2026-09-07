import React, { useState, useEffect } from 'react';
import { getGeminiApiKey, setGeminiApiKey, clearGeminiApiKey, hasGeminiApiKey } from '../utils/aiConfig';
import { ThemeEngine, getTheme, setTheme } from '../utils/ThemeEngine';
import { CurrencyEngine, getCurrency, setCurrency, USD_EXCHANGE_RATE } from '../utils/CurrencyEngine';
import { 
  Sun, Moon, Key, Check, AlertCircle, RefreshCw, Sparkles, 
  DollarSign, IndianRupee, Save, RotateCcw, ShieldCheck 
} from 'lucide-react';

const ToggleSwitch = ({ checked, onChange }) => (
  <label className="toggle-switch">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="toggle-slider"></span>
  </label>
);

function Settings() {
  // Saved baseline state (from persistent storage)
  const [savedSettings, setSavedSettings] = useState(() => ({
    currency: getCurrency(),
    theme: getTheme(),
    apiKey: getGeminiApiKey(),
    fontSize: localStorage.getItem('MESO_FONT_SIZE') || 'Default',
    pointerCursors: localStorage.getItem('MESO_POINTER_CURSORS') !== 'false',
    firstDay: localStorage.getItem('MESO_FIRST_DAY') || 'Monday',
    displayFullNames: localStorage.getItem('MESO_FULL_NAMES') !== 'false',
    aiInsights: localStorage.getItem('MESO_AI_INSIGHTS') !== 'false',
    autoSync: localStorage.getItem('MESO_AUTO_SYNC') !== 'false',
    complianceAlerts: localStorage.getItem('MESO_COMPLIANCE_ALERTS') !== 'false',
  }));

  // Working draft state (edited in the UI)
  const [draft, setDraft] = useState(() => ({ ...savedSettings }));
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Check whether any field in draft differs from saved baseline
  const hasUnsavedChanges = 
    draft.currency !== savedSettings.currency ||
    draft.theme !== savedSettings.theme ||
    draft.apiKey !== savedSettings.apiKey ||
    draft.fontSize !== savedSettings.fontSize ||
    draft.pointerCursors !== savedSettings.pointerCursors ||
    draft.firstDay !== savedSettings.firstDay ||
    draft.displayFullNames !== savedSettings.displayFullNames ||
    draft.aiInsights !== savedSettings.aiInsights ||
    draft.autoSync !== savedSettings.autoSync ||
    draft.complianceAlerts !== savedSettings.complianceAlerts;

  // Sync state if external changes happen
  useEffect(() => {
    const handleCurrencyEvent = (e) => {
      const curr = e.detail?.currency || getCurrency();
      setSavedSettings(prev => ({ ...prev, currency: curr }));
    };
    const handleThemeEvent = (e) => {
      const th = e.detail?.theme || getTheme();
      setSavedSettings(prev => ({ ...prev, theme: th }));
    };

    window.addEventListener('currency-changed', handleCurrencyEvent);
    window.addEventListener('theme-changed', handleThemeEvent);

    return () => {
      window.removeEventListener('currency-changed', handleCurrencyEvent);
      window.removeEventListener('theme-changed', handleThemeEvent);
    };
  }, []);

  // Update a single draft field
  const updateDraft = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  // Discard all unsaved changes
  const handleDiscard = () => {
    setDraft({ ...savedSettings });
    setSaveToast({ type: 'info', message: 'Unsaved changes discarded.' });
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Save changes and apply globally
  const handleSave = async () => {
    if (!hasUnsavedChanges || isSaving) return;
    setIsSaving(true);

    try {
      // 1. Currency
      if (draft.currency !== savedSettings.currency) {
        setCurrency(draft.currency);
        // Inform backend asynchronously
        try {
          fetch('/api/settings/currency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currency: draft.currency })
          }).catch(() => {});
        } catch (_) {}
      }

      // 2. Theme
      if (draft.theme !== savedSettings.theme) {
        setTheme(draft.theme);
      }

      // 3. API Key
      if (draft.apiKey !== savedSettings.apiKey) {
        if (draft.apiKey.trim()) {
          setGeminiApiKey(draft.apiKey.trim());
        } else {
          clearGeminiApiKey();
        }
      }

      // 4. Other preferences to localStorage
      localStorage.setItem('MESO_FONT_SIZE', draft.fontSize);
      localStorage.setItem('MESO_POINTER_CURSORS', String(draft.pointerCursors));
      localStorage.setItem('MESO_FIRST_DAY', draft.firstDay);
      localStorage.setItem('MESO_FULL_NAMES', String(draft.displayFullNames));
      localStorage.setItem('MESO_AI_INSIGHTS', String(draft.aiInsights));
      localStorage.setItem('MESO_AUTO_SYNC', String(draft.autoSync));
      localStorage.setItem('MESO_COMPLIANCE_ALERTS', String(draft.complianceAlerts));

      // 5. Update saved baseline
      setSavedSettings({ ...draft });

      // 6. Broadcast global events
      window.dispatchEvent(new Event('ledger-updated'));
      window.dispatchEvent(new Event('currency-changed'));

      setSaveToast({
        type: 'success',
        message: `✓ Settings saved! Currency updated to ${draft.currency} ($/₹) and applied across all dashboards & reports.`
      });
    } catch (err) {
      setSaveToast({ type: 'error', message: `Failed to save: ${err.message}` });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveToast(null), 4000);
    }
  };

  return (
    <div className="settings-page tab-content animate-fade">
      {/* Top Header with Sticky Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
        position: 'sticky',
        top: 0,
        background: 'var(--bg-page)',
        paddingTop: '12px',
        paddingBottom: '16px',
        zIndex: 20,
        borderBottom: '1px solid var(--border)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Preferences &amp; Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Configure currency translation, dark/light mode, and centralized AI credentials.
          </p>
        </div>

        {/* Action Controls: Save & Discard Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Status Badge */}
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: hasUnsavedChanges ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            color: hasUnsavedChanges ? '#d97706' : '#10b981',
            border: `1px solid ${hasUnsavedChanges ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: hasUnsavedChanges ? '#d97706' : '#10b981',
              boxShadow: hasUnsavedChanges ? '0 0 8px #d97706' : 'none'
            }} />
            <span>{hasUnsavedChanges ? 'Unsaved Changes' : 'All Settings Saved'}</span>
          </div>

          {/* Discard Button */}
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!hasUnsavedChanges}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: hasUnsavedChanges ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed',
              opacity: hasUnsavedChanges ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <RotateCcw size={14} />
            <span>Discard</span>
          </button>

          {/* Save Button (Blurred & Unclickable if no changes; Bright & Prominent if changed) */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              background: hasUnsavedChanges ? '#06402b' : 'var(--text-muted)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 700,
              cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed',
              opacity: hasUnsavedChanges ? 1 : 0.32,
              filter: hasUnsavedChanges ? 'none' : 'blur(0.4px)',
              pointerEvents: hasUnsavedChanges ? 'auto' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: hasUnsavedChanges ? '0 4px 14px rgba(6, 64, 43, 0.4)' : 'none',
              transform: hasUnsavedChanges ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.2s ease'
            }}
          >
            <Save size={15} />
            <span>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes Now' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: saveToast.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          color: saveToast.type === 'success' ? '#059669' : '#dc2626',
          border: `1px solid ${saveToast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          fontWeight: 600,
          fontSize: '13px'
        }}>
          {saveToast.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
          <span>{saveToast.message}</span>
        </div>
      )}

      {/* 1. Base Currency Translation (INR ⇄ USD) */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={16} color="#10b981" />
          <span>Base Reporting Currency &amp; Figures</span>
        </div>
        <div className="settings-card" style={{ borderLeft: '3px solid #10b981' }}>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Primary Currency</div>
              <div className="settings-row-desc">
                Select your reporting currency. When you click <strong>Save Changes</strong>, all figures across Dashboard KPIs, Revenue, Net Profit, Day Book, Balance Sheet, Invoicing, Inventory, TDS, and Insights instantly convert.
                <span style={{ display: 'block', marginTop: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  Live exchange rate: <strong>1 USD = ₹{USD_EXCHANGE_RATE.toFixed(2)} INR</strong>
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
                <span>₹ INR (Indian Rupee)</span>
              </button>
              <button
                type="button"
                className={`option-pill ${draft.currency === 'USD' ? 'active' : ''}`}
                onClick={() => updateDraft('currency', 'USD')}
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                <DollarSign size={15} color={draft.currency === 'USD' ? '#10b981' : 'currentColor'} />
                <span>$ USD (US Dollar)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Appearance & Dark/Light Mode */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#3b82f6" />
          <span>Appearance &amp; Theme</span>
        </div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Interface Theme</div>
              <div className="settings-row-desc">
                Switch between light mode and dark mode across all accounting screens
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
                <span>Light Mode</span>
              </button>
              <button
                type="button"
                className={`option-pill ${draft.theme === 'dark' ? 'active' : ''}`}
                onClick={() => updateDraft('theme', 'dark')}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <Moon size={15} color={draft.theme === 'dark' ? '#38bdf8' : 'currentColor'} />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Font Size</div>
              <div className="settings-row-desc">Scale UI typography for dense financial view or comfortable reading</div>
            </div>
            <select 
              className="settings-select" 
              value={draft.fontSize} 
              onChange={e => updateDraft('fontSize', e.target.value)}
            >
              <option value="Small">Compact (Dense Ledger)</option>
              <option value="Default">Standard (Default)</option>
              <option value="Large">Comfortable</option>
            </select>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Pointer Cursors</div>
              <div className="settings-row-desc">Show interactive pointer cursor when hovering cards and table rows</div>
            </div>
            <ToggleSwitch 
              checked={draft.pointerCursors} 
              onChange={() => updateDraft('pointerCursors', !draft.pointerCursors)} 
            />
          </div>
        </div>
      </div>

      {/* 3. AI Credentials & Centralized API Key */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={16} color="#10b981" />
          <span>AI Engine &amp; Centralized Credentials</span>
        </div>
        <div className="settings-card">
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '14px' }}>
            <div className="settings-row-info">
              <div className="settings-row-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Gemini AI API Key</span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: draft.apiKey.trim() ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  color: draft.apiKey.trim() ? '#10b981' : '#ef4444',
                  fontWeight: 600
                }}>
                  {draft.apiKey.trim() ? '● Configured' : '○ Not Configured'}
                </span>
              </div>
              <div className="settings-row-desc">
                Single centralized API key powering <strong>all</strong> AI capabilities: AI Smart Journal Entry, Live Compliance &amp; Audit Assistant, and Strategic Forecasts.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={draft.apiKey}
                onChange={e => updateDraft('apiKey', e.target.value)}
                placeholder="Paste Gemini API Key (e.g. AIzaSy...)"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  outline: 'none'
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

      {/* 4. Accounting & Compliance Preferences */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} color="#8b5cf6" />
          <span>Accounting &amp; Automation Preferences</span>
        </div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">First Day of the Week</div>
              <div className="settings-row-desc">Calendar start day for date pickers and fiscal week grouping</div>
            </div>
            <select 
              className="settings-select" 
              value={draft.firstDay} 
              onChange={e => updateDraft('firstDay', e.target.value)}
            >
              <option value="Monday">Monday (Standard Indian)</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Display Full Names</div>
              <div className="settings-row-desc">Show full party and customer names on invoices and ledgers</div>
            </div>
            <ToggleSwitch 
              checked={draft.displayFullNames} 
              onChange={() => updateDraft('displayFullNames', !draft.displayFullNames)} 
            />
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Automatic AI Financial Insights</div>
              <div className="settings-row-desc">Run background variance and trend analysis on ledger updates</div>
            </div>
            <ToggleSwitch 
              checked={draft.aiInsights} 
              onChange={() => updateDraft('aiInsights', !draft.aiInsights)} 
            />
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Bank Feed Auto-Reconciliation</div>
              <div className="settings-row-desc">Automatically match bank statement feeds with General Ledger</div>
            </div>
            <ToggleSwitch 
              checked={draft.autoSync} 
              onChange={() => updateDraft('autoSync', !draft.autoSync)} 
            />
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Tax &amp; Statutory Compliance Alerts</div>
              <div className="settings-row-desc">Notify on approaching GST filing and TDS Challan 281 deadlines</div>
            </div>
            <ToggleSwitch 
              checked={draft.complianceAlerts} 
              onChange={() => updateDraft('complianceAlerts', !draft.complianceAlerts)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
