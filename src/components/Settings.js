import React, { useState } from 'react';

const ToggleSwitch = ({ checked, onChange }) => (
  <label className="toggle-switch">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="toggle-slider"></span>
  </label>
);

function Settings() {
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
