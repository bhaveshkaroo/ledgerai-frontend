import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import ReportCard from './components/ReportCard';
import Ledger from './components/Ledger';
import Statements from './components/Statements';
import CompliancePanel from './components/CompliancePanel';
import BankModal from './components/BankModal';
import Auth from './components/Auth';
import { supabase } from './supabaseClient';
import { 
  LayoutGrid, ArrowRightLeft, FileText, Scale, Droplets, BookOpen, 
  Sparkles, Search, Settings, LogOut, Bell, Plus, Download, RefreshCw, Zap
} from 'lucide-react';
import { ASValidationEngine } from './utils/ASComplianceEngine';
import { LedgerEngine } from './utils/LedgerEngine';

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [period, setPeriod] = useState('Full Year');
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [complianceStats, setComplianceStats] = useState({ errors: 0, warnings: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandMenuOpen(prev => !prev);
        setCommandSearch('');
      }
      if (e.key === 'Escape') {
        setIsCommandMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (session) {
      runInitialValidation();
    }
  }, [session]);

  const runInitialValidation = () => {
    const txs = LedgerEngine.transactions;
    const is = LedgerEngine.calcIncomeStatement('Full Year');
    const cf = LedgerEngine.calcCashFlow('Full Year');
    const bs = LedgerEngine.calcBalanceSheet('Full Year');
    const findings = ASValidationEngine.runFullValidation(txs, is, cf, bs);
    updateStats(findings);
  };

  const updateStats = (findings) => {
    const errors = findings.filter(f => f.severity === 'ERROR' && f.status === 'Unresolved').length;
    const warnings = findings.filter(f => f.severity === 'WARNING' && f.status === 'Unresolved').length;
    setComplianceStats({ errors, warnings });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const navSections = [
    { id: 'Dashboard', name: 'Dashboard', icon: <LayoutGrid size={20} />, category: 'Navigation' },
    { id: 'Transactions', name: 'Transactions', icon: <ArrowRightLeft size={20} />, category: 'Navigation' },
    { id: 'IncomeStatement', name: 'Income Statement', icon: <FileText size={20} />, category: 'Reports' },
    { id: 'BalanceSheet', name: 'Balance Sheet', icon: <Scale size={20} />, category: 'Reports' },
    { id: 'CashFlow', name: 'Cash Flow', icon: <Droplets size={20} />, category: 'Reports' },
    { id: 'LedgerBook', name: 'Ledger Book', icon: <BookOpen size={20} />, category: 'Navigation' },
    { id: 'AISummary', name: 'AI Insights', icon: <Sparkles size={20} />, category: 'AI' },
  ];

  const actions = [
    { id: 'add-tx', name: 'Add Transaction', icon: <Plus size={20} />, category: 'Actions', shortcut: 'A' },
    { id: 'sync-bank', name: 'Sync Bank Account', icon: <RefreshCw size={20} />, category: 'Actions', shortcut: 'S' },
    { id: 'export-audit', name: 'Export Audit Report', icon: <Download size={20} />, category: 'Actions', shortcut: 'E' },
    { id: 'run-ai', name: 'Run AI Analysis', icon: <Zap size={20} />, category: 'AI', shortcut: 'R' },
  ];

  const commandItems = useMemo(() => {
    const all = [...navSections, ...actions];
    if (!commandSearch) return all;
    return all.filter(i => i.name.toLowerCase().includes(commandSearch.toLowerCase()) || i.category.toLowerCase().includes(commandSearch.toLowerCase()));
  }, [commandSearch]);

  const handleCommandAction = (item) => {
    if (item.category === 'Navigation' || item.category === 'Reports' || item.id === 'AISummary') {
      setActiveTab(item.id);
    } else if (item.id === 'sync-bank') {
      setIsBankModalOpen(true);
    } else if (item.id === 'export-audit') {
      runInitialValidation();
      alert('Audit Report Generation Started...');
    }
    setIsCommandMenuOpen(false);
    setCommandSearch('');
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="sidebar-logo">L</div>
        
        <div className="sidebar-menu">
          {navSections.filter(i => i.category === 'Navigation' || i.id === 'AISummary').map(item => (
            <button 
              key={item.id} 
              className={`sidebar-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              title={item.name}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', width: '100%', padding: '0 12px' }}>
          <button className="sidebar-btn" onClick={() => setActiveTab('Settings')}>
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <button className="sidebar-btn" onClick={handleSignOut} style={{ color: '#ef4444' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <main className="main-content">
        <header className="dash-header">
          <div className="dash-title-container">
            <h1 style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>LedgerAI /</h1>
            <h2 style={{ fontSize: '24px', fontWeight: 600 }}>{activeTab}</h2>
          </div>
          
          <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="command-bar-trigger" onClick={() => setIsCommandMenuOpen(true)}>
              <Search size={14} />
              <span>Search or command...</span>
              <span className="shortcut-hint">⌘K</span>
            </div>

            <button className="sidebar-btn" style={{ width: 'auto', background: 'var(--bg-surface)' }} onClick={() => setIsComplianceOpen(true)}>
              <Bell size={18} />
              {complianceStats.errors > 0 && <span className="status-dot emerald"></span>}
            </button>
          </div>
        </header>

        <div className="tab-content">
          {activeTab === 'Dashboard' && <Dashboard period={period} setPeriod={setPeriod} />}
          {activeTab === 'Transactions' && <TransactionList period={period} />}
          {['IncomeStatement', 'BalanceSheet', 'CashFlow', 'TrialBalance'].includes(activeTab) && <Statements period={period} initialTab={activeTab} />}
          {activeTab === 'LedgerBook' && <Ledger period={period} />}
          {activeTab === 'AISummary' && <ReportCard />}
        </div>
      </main>

      {isCommandMenuOpen && (
        <div className="command-menu-overlay" onClick={() => setIsCommandMenuOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', 
          paddingTop: '15vh', zIndex: 2000, backdropFilter: 'blur(8px)'
        }}>
          <div className="command-menu-card" onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '600px', background: 'var(--bg-card)', 
            border: '1px solid var(--border-bright)', borderRadius: '12px',
            boxShadow: '0 20px 70px rgba(0,0,0,0.5)', overflow: 'hidden'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Search size={18} color="var(--text-muted)" />
              <input 
                autoFocus 
                placeholder="Search actions..." 
                value={commandSearch}
                onChange={e => setCommandSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '16px', outline: 'none', width: '100%' }}
              />
            </div>
            <div style={{ padding: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              {commandItems.length > 0 ? (
                commandItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="command-item" 
                    onClick={() => handleCommandAction(item)}
                    style={{ 
                      padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', 
                      display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ opacity: 0.7 }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', opacity: 0.5 }}>{item.category}</div>
                    </div>
                    {item.shortcut && <span className="shortcut-hint">{item.shortcut}</span>}
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No results for "{commandSearch}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CompliancePanel 
        isOpen={isComplianceOpen} 
        onClose={() => setIsComplianceOpen(false)} 
        onRefresh={runInitialValidation}
      />
      <BankModal isOpen={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} onAdd={() => {}} />
    </div>
  );
}

export default App;
