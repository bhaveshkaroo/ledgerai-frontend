import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import ReportCard from './components/ReportCard';
import Ledger from './components/Ledger';
import Statements from './components/Statements';
import CompliancePanel from './components/CompliancePanel';
import FloatingActionButton from './components/FloatingActionButton';
import { 
  LayoutGrid, ArrowRightLeft, FileText, Scale, Droplets, ClipboardCheck, 
  BookOpen, PenTool, Percent, CalendarDays, CalendarCheck, Sparkles, 
  Search, BarChart3, Settings, LogOut, User, Bell, ChevronRight, Export
} from 'lucide-react';
import { ASValidationEngine } from './utils/ASComplianceEngine';
import { LedgerEngine } from './utils/LedgerEngine';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [expandedSection, setExpandedSection] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [period, setPeriod] = useState('Full Year');
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [complianceStats, setComplianceStats] = useState({ errors: 0, warnings: 0 });

  useEffect(() => {
    // Start in Light mode as per design direction "warm light grey page background"
    document.body.classList.remove('dark-mode');
    runInitialValidation();
  }, []);

  const runInitialValidation = () => {
    const saved = localStorage.getItem('ledgerai-compliance-log');
    let findings = [];
    if (saved) {
      findings = JSON.parse(saved);
    } else {
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

  const navSections = [
    {
      label: null,
      items: [
        { id: 'Dashboard', name: 'Dashboard', icon: <LayoutGrid size={20} /> },
        { id: 'Transactions', name: 'Transactions', icon: <ArrowRightLeft size={20} /> },
      ]
    },
    {
      label: 'Reports',
      items: [
        { id: 'IncomeStatement', name: 'Income Statement', icon: <FileText size={20} /> },
        { id: 'BalanceSheet', name: 'Balance Sheet', icon: <Scale size={20} /> },
        { id: 'CashFlow', name: 'Cash Flow', icon: <Droplets size={20} /> },
        { id: 'TrialBalance', name: 'Trial Balance', icon: <ClipboardCheck size={20} /> },
      ]
    },
    {
      label: 'Books',
      items: [
        { id: 'LedgerBook', name: 'Ledger Book', icon: <BookOpen size={20} /> },
        { id: 'JournalEntries', name: 'Journal Entries', icon: <PenTool size={20} /> },
      ]
    },
    {
      label: 'Tax',
      items: [
        { id: 'GSTCalculator', name: 'GST Calculator', icon: <Percent size={20} /> },
        { id: 'TDSTracker', name: 'TDS Tracker', icon: <CalendarDays size={20} /> },
        { id: 'ComplianceCalendar', name: 'Compliance Calendar', icon: <CalendarCheck size={20} /> },
      ]
    },
    {
      label: 'Intelligence',
      items: [
        { id: 'AISummary', name: 'AI Insights', icon: <Sparkles size={20} /> },
        { id: 'Audit', name: 'Audit', icon: <Search size={20} /> },
        { id: 'Benchmarking', name: 'Benchmarking', icon: <BarChart3 size={20} /> },
      ]
    },
  ];

  const handleIconClick = (sectionIndex) => {
    if (expandedSection === sectionIndex && isSidebarExpanded) {
      setIsSidebarExpanded(false);
    } else {
      setExpandedSection(sectionIndex);
      setIsSidebarExpanded(true);
    }
  };

  const getPageTitle = () => {
    for (const section of navSections) {
      const item = section.items.find(i => i.id === activeTab);
      if (item) return item.name;
    }
    if (activeTab === 'Settings') return 'Settings';
    return 'Dashboard';
  };

  return (
    <div className="app-container" data-theme={document.body.classList.contains('dark-mode') ? 'dark' : 'light'}>
      {/* Redesigned Sidebar */}
      <div className={`sidebar-wrapper ${isSidebarExpanded ? 'expanded' : ''}`}>
        <div className="sidebar-primary">
          <div className="sidebar-logo-icon">
            <Scale size={24} strokeWidth={3} />
          </div>
          
          <div className="sidebar-nav-group">
            {navSections.map((section, idx) => (
              section.items.map(item => (
                <div 
                  key={item.id} 
                  className={`sidebar-item-icon ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    handleIconClick(idx);
                  }}
                >
                  {item.icon}
                  <div className="sidebar-tooltip">{item.name}</div>
                </div>
              ))
            ))}
          </div>

          <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className={`sidebar-item-icon ${activeTab === 'Settings' ? 'active' : ''}`} onClick={() => setActiveTab('Settings')}>
              <Settings size={20} />
              <div className="sidebar-tooltip">Settings</div>
            </div>
            <div className="sidebar-item-icon">
              <User size={20} />
              <div className="sidebar-tooltip">Profile</div>
            </div>
            <div className="sidebar-item-icon" style={{ color: '#ef4444' }}>
              <LogOut size={20} />
              <div className="sidebar-tooltip">Logout</div>
            </div>
          </div>
        </div>

        <div className="sidebar-secondary">
          <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>LedgerAI</span>
          </div>
          {expandedSection !== null && (
            <>
              {navSections[expandedSection].label && (
                <div className="sidebar-section-label">{navSections[expandedSection].label}</div>
              )}
              {navSections[expandedSection].items.map(item => (
                <div 
                  key={item.id} 
                  className={`sidebar-sub-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  {item.name}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Content Area Header */}
        <div className="content-header">
          <div>
            <h1 className="page-title">{getPageTitle()}</h1>
            <div className="breadcrumb">
              <span>Main</span> <ChevronRight size={12} /> <span>{getPageTitle()}</span>
            </div>
            <div className="last-updated">Last updated: Today, 09:45 AM</div>
          </div>
          
          <div className="header-actions">
            <div style={{ display: 'flex', background: '#E2E8F0', padding: 4, borderRadius: 8 }}>
              {['Monthly', 'Quarterly', 'Full Year'].map(p => (
                <button 
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: period === p ? '#fff' : 'transparent',
                    color: period === p ? '#0B1426' : '#64748B',
                    boxShadow: period === p ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setIsBankModalOpen(true)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', 
                borderRadius: 8, background: 'var(--accent-navy)', color: '#fff',
                border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Droplets size={16} /> Connect Bank
            </button>

            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setIsComplianceOpen(true)}>
              <Bell size={20} color="#64748B" />
              {(complianceStats.errors > 0 || complianceStats.warnings > 0) && (
                <div style={{ 
                  position: 'absolute', top: -4, right: -4, width: 8, height: 8, 
                  borderRadius: '50%', background: '#ef4444' 
                }} />
              )}
            </div>

            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#C9A84C', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
              JD
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content" style={{ flex: 1 }}>
          {activeTab === 'Dashboard' && <Dashboard period={period} setPeriod={setPeriod} />}
          {activeTab === 'Transactions' && <TransactionList period={period} />}
          {['IncomeStatement', 'BalanceSheet', 'CashFlow', 'TrialBalance'].includes(activeTab) && <Statements period={period} initialTab={activeTab} />}
          {activeTab === 'LedgerBook' && <Ledger period={period} />}
          {activeTab === 'GSTCalculator' && <GSTCalculator />}
          {activeTab === 'AISummary' && <ReportCard />}
          {activeTab === 'Settings' && (
            <div className="card">
              <h2>Settings</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 10 }}>Configuration and preferences.</p>
            </div>
          )}
        </div>
      </div>

      <CompliancePanel 
        isOpen={isComplianceOpen} 
        onClose={() => setIsComplianceOpen(false)} 
        onRefresh={runInitialValidation}
      />
      <BankModal isOpen={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} onAdd={() => {}} />
      <FloatingActionButton />

      {/* Mobile Bottom Navigation */}
      <div className="bottom-nav">
        {[
          { id: 'Dashboard', icon: <LayoutGrid size={20} />, label: 'Dash' },
          { id: 'Transactions', icon: <ArrowRightLeft size={20} />, label: 'TX' },
          { id: 'IncomeStatement', icon: <FileText size={20} />, label: 'Reports' },
          { id: 'GSTCalculator', icon: <Percent size={20} />, label: 'Tax' },
          { id: 'AISummary', icon: <Sparkles size={20} />, label: 'AI' }
        ].map(item => (
          <div 
            key={item.id} 
            className={`bottom-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: activeTab === item.id ? 'var(--accent-gold)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            {item.icon}
            <span style={{ fontSize: 10, fontWeight: 700 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


export default App;
