import React, { useState, useEffect } from 'react';
import { getGeminiApiKey, setGeminiApiKey, clearGeminiApiKey, hasGeminiApiKey } from '../utils/aiConfig';
import { ThemeEngine, getTheme, setTheme } from '../utils/ThemeEngine';
import { CurrencyEngine, getCurrency, setCurrency, USD_EXCHANGE_RATE } from '../utils/CurrencyEngine';
import { Sun, Moon, Key, Check, AlertCircle, RefreshCw, Sparkles, DollarSign, IndianRupee } from 'lucide-react';

const ToggleSwitch = ({ checked, onChange }) => (
  <label className="toggle-switch">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="toggle-slider"></span>
  </label>
);

function Settings() {
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const [activeTheme, setActiveTheme] = useState(getTheme());
  const [activeCurrency, setActiveCurrency] = useState(getCurrency());

  const [displayFullNames, setDisplayFullNames] = useState(true);
  const [firstDay, setFirstDay] = useState('Monday');
  const [fontSize, setFontSize] = useState('Default');
  const [pointerCursors, setPointerCursors] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [aiInsights, setAiInsights] = useState(true);
  const [complianceAlerts, setComplianceAlerts] = useState(true);

  // Sync state if external changes happen
  useEffect(() => {
    const handleThemeChange = (e) => {
      setActiveTheme(e.detail?.theme || getTheme());
    };
    const handleCurrencyChange = () => {
      setActiveCurrency(getCurrency());
    };

    window.addEventListener('theme-changed', handleThemeChange);
    window.addEventListener('currency-changed', handleCurrencyChange);

    return () => {
      window.removeEventListener('theme-changed', handleThemeChange);
      window.removeEventListener('currency-changed', handleCurrencyChange);
    };
  }, []);

  const handleThemeSelect = (themeMode) => {
    setTheme(themeMode);
    setActiveTheme(themeMode);
  };

  const handleCurrencySelect = (currencyCode) => {
    setCurrency(currencyCode);
    setActiveCurrency(currencyCode);
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setGeminiApiKey(apiKeyInput.trim());
      setApiKeySaved(true);
      setTimeout(() => setApiKeySaved(false), 2500);
    }
  };

  return (
    <div className="settings-page tab-content animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Preferences &amp; Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '-16px' }}>
            Manage API credentials, themes, currency translations, and accounting preferences
          </p>
        </div>
      </div>

      {/* 1. AI Credentials & Centralized API Key */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={16} color="#10b981" />
          <span>AI Engine &amp; Centralized API Key</span>
        </div>
        <div className="settings-card" style={{ borderLeft: '3px solid #10b981' }}>
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '14px' }}>
            <div className="settings-row-info">
              <div className="settings-row-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Gemini AI API Key</span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: hasGeminiApiKey() ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  color: hasGeminiApiKey() ? '#10b981' : '#ef4444',
                  fontWeight: 600
                }}>
                  {hasGeminiApiKey() ? '● Active' : '○ Not Configured'}
                </span>
              </div>
              <div className="settings-row-desc">
                Single centralized API key powering <strong>all</strong> AI capabilities: AI Smart Journal Entry, Live Compliance &amp; Audit Assistant, and Strategic Forecasts.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
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
              <button
                type="button"
                className="settings-btn"
                onClick={handleSaveApiKey}
                style={{
                  background: '#06402b',
                  color: 'white',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {apiKeySaved ? <><Check size={14} /> Saved!</> : 'Save Key'}
              </button>
              {hasGeminiApiKey() && (
                <button
                  type="button"
                  className="settings-btn"
                  onClick={() => {
                    clearGeminiApiKey();
                    setApiKeyInput('');
                  }}
                  style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                >
                  Clear
                </button>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: hasGeminiApiKey() ? '#10b981' : '#ef4444',
              background: hasGeminiApiKey() ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
              padding: '8px 12px',
              borderRadius: '6px'
            }}>
              {hasGeminiApiKey() ? (
                <>
                  <Check size={14} />
                  <span>Configured. Calls will automatically use Gemini models with graceful fallbacks.</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} />
                  <span>No key set. AI Journal, Audit Assistant, and Strategic Insights require a Gemini API key.</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interface Theme (Dark / Light 1-Click Switch) */}
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
                Switch instantly between light mode and dark mode across all accounting screens
              </div>
            </div>

            <div className="option-pill-group">
              <button
                type="button"
                className={`option-pill ${activeTheme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeSelect('light')}
              >
                <Sun size={14} color={activeTheme === 'light' ? '#f59e0b' : 'currentColor'} />
                <span>Light Mode</span>
              </button>
              <button
                type="button"
                className={`option-pill ${activeTheme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeSelect('dark')}
              >
                <Moon size={14} color={activeTheme === 'dark' ? '#38bdf8' : 'currentColor'} />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Font Size</div>
              <div className="settings-row-desc">Scale UI typography for dense financial view or comfortable reading</div>
            </div>
            <select className="settings-select" value={fontSize} onChange={e => setFontSize(e.target.value)}>
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
            <ToggleSwitch checked={pointerCursors} onChange={() => setPointerCursors(!pointerCursors)} />
          </div>
        </div>
      </div>

      {/* 3. Currency Translation (INR ⇄ USD 1-Click Switch) */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={16} color="#10b981" />
          <span>Currency &amp; Localization</span>
        </div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Base Reporting Currency</div>
              <div className="settings-row-desc">
                Translates every balance, revenue, expense, and statement in real-time.
                <span style={{ display: 'block', marginTop: '4px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  Live reference rate: <strong>1 USD = ₹{USD_EXCHANGE_RATE.toFixed(2)} INR</strong>
                </span>
              </div>
            </div>

            <div className="option-pill-group">
              <button
                type="button"
                className={`option-pill ${activeCurrency === 'INR' ? 'active' : ''}`}
                onClick={() => handleCurrencySelect('INR')}
              >
                <IndianRupee size={14} color={activeCurrency === 'INR' ? '#10b981' : 'currentColor'} />
                <span>₹ INR (Indian Rupee)</span>
              </button>
              <button
                type="button"
                className={`option-pill ${activeCurrency === 'USD' ? 'active' : ''}`}
                onClick={() => handleCurrencySelect('USD')}
              >
                <DollarSign size={14} color={activeCurrency === 'USD' ? '#10b981' : 'currentColor'} />
                <span>$ USD (US Dollar)</span>
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">First Day of the Week</div>
              <div className="settings-row-desc">Calendar start day for date pickers and fiscal week grouping</div>
            </div>
            <select className="settings-select" value={firstDay} onChange={e => setFirstDay(e.target.value)}>
              <option value="Monday">Monday (Standard Indian)</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Display Full Names</div>
              <div className="settings-row-desc">Show full party and customer names on invoices and ledgers</div>
            </div>
            <ToggleSwitch checked={displayFullNames} onChange={() => setDisplayFullNames(!displayFullNames)} />
          </div>
        </div>
      </div>

      {/* 4. Automation & Compliance */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} color="#8b5cf6" />
          <span>Automation &amp; Compliance Rules</span>
        </div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Automatic AI Financial Insights</div>
              <div className="settings-row-desc">Run background variance and trend analysis on ledger updates</div>
            </div>
            <ToggleSwitch checked={aiInsights} onChange={() => setAiInsights(!aiInsights)} />
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Bank Feed Auto-Reconciliation</div>
              <div className="settings-row-desc">Automatically match bank statement feeds with General Ledger</div>
            </div>
            <ToggleSwitch checked={autoSync} onChange={() => setAutoSync(!autoSync)} />
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Tax &amp; Statutory Compliance Alerts</div>
              <div className="settings-row-desc">Notify on approaching GST filing and TDS Challan 281 deadlines</div>
            </div>
            <ToggleSwitch checked={complianceAlerts} onChange={() => setComplianceAlerts(!complianceAlerts)} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
