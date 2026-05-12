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
import Settings from './components/Settings';
import { supabase } from './supabaseClient';
import { 
  LayoutGrid, ArrowRightLeft, FileText, Scale, Droplets, BookOpen, 
  Sparkles, Search, Settings as SettingsIcon, LogOut, Bell, Plus, Download, 
  RefreshCw, Zap, ChevronRight, User, ShieldCheck, HelpCircle, MessageCircle
} from 'lucide-react';
import { ASValidationEngine } from './utils/ASComplianceEngine';
import { LedgerEngine } from './utils/LedgerEngine';

function App() {
  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [period, setPeriod] = useState('Full Year');
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [complianceStats, setComplianceStats] = useState({ errors: 0, warnings: 0 });
  const [accountOpen, setAccountOpen] = useState(true);

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
    if (session || isGuest) {
      runInitialValidation();
    }
  }, [session, isGuest]);

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
    if (isGuest) {
      setIsGuest(false);
    } else {
      await supabase.auth.signOut();
    }
  };

  const navSections = [
    { id: 'Dashboard', name: 'Dashboard', icon: <LayoutGrid size={18} />, category: 'Navigation' },
    { id: 'Transactions', name: 'Transactions', icon: <ArrowRightLeft size={18} />, category: 'Navigation' },
    { id: 'IncomeStatement', name: 'Income Statement', icon: <FileText size={18} />, category: 'Reports' },
    { id: 'BalanceSheet', name: 'Balance Sheet', icon: <Scale size={18} />, category: 'Reports' },
    { id: 'CashFlow', name: 'Cash Flow', icon: <Droplets size={18} />, category: 'Reports' },
    { id: 'LedgerBook', name: 'Ledger Book', icon: <BookOpen size={18} />, category: 'Navigation' },
    { id: 'AISummary', name: 'AI Insights', icon: <Sparkles size={18} />, category: 'AI' },
  ];

  const actions = [
    { id: 'add-tx', name: 'Add Transaction', icon: <Plus size={18} />, category: 'Actions', shortcut: 'A' },
    { id: 'sync-bank', name: 'Sync Bank Account', icon: <RefreshCw size={18} />, category: 'Actions', shortcut: 'S' },
    { id: 'export-audit', name: 'Export Audit Report', icon: <Download size={18} />, category: 'Actions', shortcut: 'E' },
    { id: 'run-ai', name: 'Run AI Analysis', icon: <Zap size={18} />, category: 'AI', shortcut: 'R' },
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
    }
    setIsCommandMenuOpen(false);
    setCommandSearch('');
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-page)' }}>
        <div className="sidebar-logo" style={{ width: 48, height: 48, fontSize: 24, animation: 'fade-in 1s infinite alternate' }}>L</div>
      </div>
    );
  }

  if (!session && !isGuest) {
    return <Auth onDemoLogin={() => setIsGuest(true)} />;
  }

  return (
    <div className="app-container">

      {/* ─── Linear Sidebar ─── */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">L</div>
          <span className="sidebar-brand">LedgerAI</span>
          <Search size={16} className="sidebar-search-icon" onClick={() => setIsCommandMenuOpen(true)} />
        </div>

        <div className="sidebar-nav">
          {/* Main Navigation */}
          <button className={`sidebar-btn ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}>
            <LayoutGrid size={18} /> Dashboard
            <ChevronRight size={14} className="chevron" />
          </button>
          <button className={`sidebar-btn ${activeTab === 'Transactions' ? 'active' : ''}`} onClick={() => setActiveTab('Transactions')}>
            <ArrowRightLeft size={18} /> Transactions
            <ChevronRight size={14} className="chevron" />
          </button>

          {/* Account Section */}
          <button className="sidebar-btn" onClick={() => setAccountOpen(!accountOpen)} style={{ marginTop: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Reports</span>
            <ChevronRight size={14} className="chevron" style={{ transform: accountOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {accountOpen && (
            <>
              <button className={`sidebar-btn sub-item ${activeTab === 'IncomeStatement' ? 'active' : ''}`} onClick={() => setActiveTab('IncomeStatement')}>
                <FileText size={16} /> Income Statement
              </button>
              <button className={`sidebar-btn sub-item ${activeTab === 'BalanceSheet' ? 'active' : ''}`} onClick={() => setActiveTab('BalanceSheet')}>
                <Scale size={16} /> Balance Sheet
              </button>
              <button className={`sidebar-btn sub-item ${activeTab === 'CashFlow' ? 'active' : ''}`} onClick={() => setActiveTab('CashFlow')}>
                <Droplets size={16} /> Cash Flow
              </button>
              <button className={`sidebar-btn sub-item ${activeTab === 'LedgerBook' ? 'active' : ''}`} onClick={() => setActiveTab('LedgerBook')}>
                <BookOpen size={16} /> Ledger Book
              </button>
            </>
          )}

          {/* Other top-level items */}
          <button className={`sidebar-btn ${activeTab === 'AISummary' ? 'active' : ''}`} onClick={() => setActiveTab('AISummary')} style={{ marginTop: '4px' }}>
            <Sparkles size={18} /> AI Insights
            <ChevronRight size={14} className="chevron" />
          </button>
          <button className={`sidebar-btn ${activeTab === 'Settings' ? 'active' : ''}`} onClick={() => setActiveTab('Settings')}>
            <SettingsIcon size={18} /> Settings
            <ChevronRight size={14} className="chevron" />
          </button>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-btn">
            <HelpCircle size={18} /> Documentation
          </button>
          <button className="sidebar-btn">
            <MessageCircle size={18} /> Contact support
          </button>
          <button className="sidebar-btn" onClick={handleSignOut} style={{ color: '#ef4444' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      {/* ─── Main Content ─── */}
      <main className="main-content">
        <header className="dash-header">
          <div className="dash-title-container">
            <h1>{activeTab === 'Settings' ? 'Preferences' : activeTab}</h1>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="command-bar-trigger" onClick={() => setIsCommandMenuOpen(true)}>
              <Search size={14} />
              <span>Search or command...</span>
              <span className="shortcut-hint">⌘K</span>
            </div>

            <button className="sidebar-btn" style={{ width: 'auto', background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: '6px' }} onClick={() => setIsComplianceOpen(true)}>
              <Bell size={16} />
              {complianceStats.errors > 0 && <span className="status-dot emerald" style={{ marginLeft: 0 }}></span>}
            </button>
          </div>
        </header>

        <div className="tab-content">
          {activeTab === 'Dashboard' && <Dashboard period={period} setPeriod={setPeriod} />}
          {activeTab === 'Transactions' && <TransactionList period={period} />}
          {['IncomeStatement', 'BalanceSheet', 'CashFlow', 'TrialBalance'].includes(activeTab) && <Statements period={period} initialTab={activeTab} />}
          {activeTab === 'LedgerBook' && <Ledger period={period} />}
          {activeTab === 'AISummary' && <ReportCard />}
          {activeTab === 'Settings' && <Settings />}
        </div>
      </main>

      {/* ─── Command Menu ─── */}
      {isCommandMenuOpen && (
        <div onClick={() => setIsCommandMenuOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', 
          paddingTop: '15vh', zIndex: 2000, backdropFilter: 'blur(8px)'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '560px', background: 'var(--bg-card)', 
            border: '1px solid var(--border-bright)', borderRadius: '12px',
            boxShadow: '0 20px 70px rgba(0,0,0,0.5)', overflow: 'hidden'
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Search size={16} color="var(--text-muted)" />
              <input 
                autoFocus 
                placeholder="Search actions..." 
                value={commandSearch}
                onChange={e => setCommandSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '15px', outline: 'none', width: '100%', fontFamily: 'var(--font-sans)' }}
              />
            </div>
            <div style={{ padding: '6px', maxHeight: '360px', overflowY: 'auto' }}>
              {commandItems.length > 0 ? (
                commandItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="command-item" 
                    onClick={() => handleCommandAction(item)}
                    style={{ 
                      padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', 
                      display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)',
                      transition: 'background 0.12s'
                    }}
                  >
                    <div style={{ opacity: 0.5 }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</div>
                    </div>
                    {item.shortcut && <span className="shortcut-hint">{item.shortcut}</span>}
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
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
