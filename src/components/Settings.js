import React, { useState } from 'react';
import { getGeminiApiKey, setGeminiApiKey, clearGeminiApiKey, hasGeminiApiKey } from '../utils/aiConfig';

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

  const [displayFullNames, setDisplayFullNames] = useState(true);
  const [firstDay, setFirstDay] = useState('Sunday');
  const [convertEmojis, setConvertEmojis] = useState(true);
  const [fontSize, setFontSize] = useState('Default');
  const [pointerCursors, setPointerCursors] = useState(true);
  const [theme, setTheme] = useState('Dark');
  const [defaultView, setDefaultView] = useState('Dashboard');
  const [currency, setCurrency] = useState('INR');
  const [autoSync, setAutoSync] = useState(true);
  const [aiInsights, setAiInsights] = useState(true);
  const [complianceAlerts, setComplianceAlerts] = useState(true);

  return (
    <div className="settings-page tab-content">
      <h1>Preferences</h1>

      {/* General */}
      <div className="settings-section">
        <div className="settings-section-title">General</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Default home view</div>
              <div className="settings-row-desc">Which view is opened when you open LedgerAI</div>
            </div>
            <select className="settings-select" value={defaultView} onChange={e => setDefaultView(e.target.value)}>
              <option value="Dashboard">Dashboard</option>
              <option value="Transactions">Transactions</option>
              <option value="LedgerBook">Ledger Book</option>
            </select>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Display full names</div>
              <div className="settings-row-desc">Show full names of users instead of shorter usernames</div>
            </div>
            <ToggleSwitch checked={displayFullNames} onChange={() => setDisplayFullNames(!displayFullNames)} />
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">First day of the week</div>
              <div className="settings-row-desc">Used for date pickers</div>
            </div>
            <select className="settings-select" value={firstDay} onChange={e => setFirstDay(e.target.value)}>
              <option>Sunday</option>
              <option>Monday</option>
              <option>Saturday</option>
            </select>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Base currency</div>
              <div className="settings-row-desc">Default currency for all financial calculations</div>
            </div>
            <select className="settings-select" value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interface and theme */}
      <div className="settings-section">
        <div className="settings-section-title">Interface and theme</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">App sidebar</div>
              <div className="settings-row-desc">Customize sidebar item visibility, ordering, and badge style</div>
            </div>
            <button className="settings-btn">Customize</button>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Font size</div>
              <div className="settings-row-desc">Adjust the size of text across the app</div>
            </div>
            <select className="settings-select" value={fontSize} onChange={e => setFontSize(e.target.value)}>
              <option>Small</option>
              <option>Default</option>
              <option>Large</option>
            </select>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Use pointer cursors</div>
              <div className="settings-row-desc">Change the cursor to a pointer when hovering over any interactive elements</div>
            </div>
            <ToggleSwitch checked={pointerCursors} onChange={() => setPointerCursors(!pointerCursors)} />
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Interface theme</div>
              <div className="settings-row-desc">Select or customize your interface color scheme</div>
            </div>
            <select className="settings-select" value={theme} onChange={e => setTheme(e.target.value)}>
              <option>Dark</option>
              <option>Light</option>
              <option>System</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI & Compliance */}
      <div className="settings-section">
        <div className="settings-section-title">AI and Compliance</div>
        <div className="settings-card">
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
            <div className="settings-row-info">
              <div className="settings-row-label">Gemini AI API Key</div>
              <div className="settings-row-desc">Single centralized API key used across all AI features (AI Manual Entry, AI Audit Assistant, Insights &amp; Forecasting)</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="Paste your Gemini API key (AIzaSy...)"
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}
              />
              <button 
                type="button"
                className="settings-btn" 
                onClick={() => setShowApiKey(!showApiKey)}
                style={{ cursor: 'pointer', padding: '8px 14px' }}
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                className="settings-btn"
                style={{ 
                  background: apiKeyInput.trim() ? 'rgba(16,185,129,0.15)' : undefined, 
                  color: apiKeyInput.trim() ? '#10b981' : undefined,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '8px 16px'
                }}
                onClick={() => {
                  if (apiKeyInput.trim()) {
                    setGeminiApiKey(apiKeyInput.trim());
                    setApiKeySaved(true);
                    setTimeout(() => setApiKeySaved(false), 2000);
                  }
                }}
              >
                {apiKeySaved ? '✓ Saved' : 'Save Key'}
              </button>
              {hasGeminiApiKey() && (
                <button 
                  type="button"
                  className="settings-btn" 
                  style={{ color: '#ef4444', cursor: 'pointer', padding: '8px 14px' }} 
                  onClick={() => {
                    clearGeminiApiKey();
                    setApiKeyInput('');
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: hasGeminiApiKey() ? '#10b981' : '#ef4444' }}></div>
              <span style={{ fontSize: '12px', color: hasGeminiApiKey() ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                {hasGeminiApiKey() ? 'API Key Configured & Active' : 'API Key Missing — AI features unavailable until configured'}
              </span>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">AI-powered insights</div>
              <div className="settings-row-desc">Enable automatic financial analysis and recommendations</div>
            </div>
            <ToggleSwitch checked={aiInsights} onChange={() => setAiInsights(!aiInsights)} />
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Auto-sync bank feeds</div>
              <div className="settings-row-desc">Automatically sync connected bank accounts every 15 minutes</div>
            </div>
            <ToggleSwitch checked={autoSync} onChange={() => setAutoSync(!autoSync)} />
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Compliance alerts</div>
              <div className="settings-row-desc">Show alerts for AS/Ind AS validation errors and GST filing deadlines</div>
            </div>
            <ToggleSwitch checked={complianceAlerts} onChange={() => setComplianceAlerts(!complianceAlerts)} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
