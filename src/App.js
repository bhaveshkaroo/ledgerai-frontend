import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import ReportCard from './components/ReportCard';
import Ledger from './components/Ledger';
import Statements from './components/Statements';
import CompliancePanel from './components/CompliancePanel';
import { LayoutDashboard, ReceiptText, FileText, Settings, Sparkles, BookOpen, LogOut, Trash2, Shield, Bell } from 'lucide-react';
import { ASValidationEngine } from './utils/ASComplianceEngine';
import { LedgerEngine } from './utils/LedgerEngine';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [period, setPeriod] = useState('Full Year');
  const [connectedBanks, setConnectedBanks] = useState([]);
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [complianceStats, setComplianceStats] = useState({ errors: 0, warnings: 0 });

  useEffect(() => {
    document.body.classList.add('dark-mode');
    loadBanks();
    runInitialValidation();
  }, []);

  const runInitialValidation = () => {
    const saved = localStorage.getItem('ledgerai-compliance-log');
    let findings = [];
    if (saved) {
      findings = JSON.parse(saved);
    } else {
      // Run once on fresh load if no log exists
      const txs = LedgerEngine.transactions;
      const is = LedgerEngine.calcIncomeStatement('Full Year');
      const cf = LedgerEngine.calcCashFlow('Full Year');
      const bs = LedgerEngine.calcBalanceSheet('Full Year');
      findings = ASValidationEngine.runFullValidation(txs, is, cf, bs);
    }
    updateStats(findings);
  };

  const updateStats = (findings) => {
    const errors = findings.filter(f => f.severity === 'ERROR' && f.status === 'Unresolved').length;
    const warnings = findings.filter(f => f.severity === 'WARNING' && f.status === 'Unresolved').length;
    setComplianceStats({ errors, warnings });
  };

  const loadBanks = () => {
    const saved = localStorage.getItem('ledgerai_connected_banks');
    if (saved) setConnectedBanks(JSON.parse(saved));
  };

  const removeBank = (index) => {
    if (window.confirm("Are you sure you want to disconnect this bank account?")) {
      const updated = connectedBanks.filter((_, i) => i !== index);
      setConnectedBanks(updated);
      localStorage.setItem('ledgerai_connected_banks', JSON.stringify(updated));
    }
  };

  const menuItems = [
    { id: 'Dashboard', name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'Transactions', name: 'Transactions', icon: <ReceiptText size={18} /> },
    { id: 'Statements', name: 'Statements', icon: <FileText size={18} /> },
    { id: 'LedgerBook', name: 'Ledger Book', icon: <BookOpen size={18} /> },
    { id: 'AISummary', name: 'AI Summary', icon: <Sparkles size={18} /> },
    { id: 'Settings', name: 'Settings', icon: <Settings size={18} /> }
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">LedgerAI</div>
        <div className="sidebar-menu">
          {menuItems.map(item => (
            <button key={item.id} className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </div>
        
        <div className="sidebar-banks" style={{ marginTop: 'auto', padding: '20px' }}>
          <label style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, display: 'block' }}>Connected Banks</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {connectedBanks.map((bank, i) => (
              <div key={i} className="bank-sidebar-card" style={{ background: '#1e293b', padding: 12, borderRadius: 8, border: '1px solid #334155', position: 'relative' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{bank.bankName}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0' }}>{bank.accountType}</div>
                <div style={{ fontSize: 11, color: '#cbd5e1', fontFamily: 'monospace' }}>{bank.accountNumberMasked}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 9, color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> Connected
                  </span>
                  <button onClick={() => removeBank(i)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {connectedBanks.length === 0 && (
              <div style={{ fontSize: 11, color: '#475569', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>No banks connected</div>
            )}
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          <div className="sidebar-item" style={{ color: '#ef4444', borderLeft: 'none', padding: '12px' }}>
            <LogOut size={18} />
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ marginLeft: '220px', width: 'calc(100% - 220px)' }}>
        {/* Topbar */}
        <div className="topbar" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 40px', background: 'transparent', position: 'sticky', top: 0, zIndex: 100 }}>
          <div className="compliance-trigger" onClick={() => setIsComplianceOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1e293b', padding: '8px 16px', borderRadius: 30, cursor: 'pointer', border: '1px solid #334155' }}>
            <Shield size={18} style={{ color: complianceStats.errors > 0 ? '#ef4444' : (complianceStats.warnings > 0 ? '#f59e0b' : '#10b981') }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>AS Compliance</span>
            {(complianceStats.errors > 0 || complianceStats.warnings > 0) && (
              <span className={`compliance-badge ${complianceStats.errors > 0 ? 'error' : 'warning'}`}>
                {complianceStats.errors > 0 ? complianceStats.errors : complianceStats.warnings}
              </span>
            )}
          </div>
        </div>

        <div id="Dashboard" className={activeTab === 'Dashboard' ? '' : 'hidden'}>
          <Dashboard period={period} setPeriod={setPeriod} />
        </div>
        <div id="Transactions" className={activeTab === 'Transactions' ? '' : 'hidden'}>
          <TransactionList period={period} />
        </div>
        <div id="Statements" className={activeTab === 'Statements' ? '' : 'hidden'}>
          <Statements period={period} />
        </div>
        <div id="LedgerBook" className={activeTab === 'LedgerBook' ? '' : 'hidden'}>
          <Ledger period={period} />
        </div>
        <div id="AISummary" className={activeTab === 'AISummary' ? '' : 'hidden'}>
          <ReportCard />
        </div>
        <div id="Settings" className={activeTab === 'Settings' ? '' : 'hidden'}>
          <div className="card">
            <h2>Settings</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 10 }}>Configuration and preferences.</p>
          </div>
        </div>
      </div>

      <CompliancePanel 
        isOpen={isComplianceOpen} 
        onClose={() => setIsComplianceOpen(false)} 
        onRefresh={() => {
          const saved = localStorage.getItem('ledgerai-compliance-log');
          if (saved) updateStats(JSON.parse(saved));
        }}
      />

      <style jsx>{`
        .hidden { display: none; }
        .compliance-badge { font-size: 10px; font-weight: 800; color: #fff; padding: 2px 6px; border-radius: 10px; min-width: 18px; text-align: center; }
        .compliance-badge.error { background: #ef4444; }
        .compliance-badge.warning { background: #f59e0b; }
      `}</style>
    </div>
  );
}

export default App;
