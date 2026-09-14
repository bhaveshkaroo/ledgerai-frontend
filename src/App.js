import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import Invoicing from './components/Invoicing';
import Inventory from './components/Inventory';
import Statements from './components/Statements';
import CompliancePanel from './components/CompliancePanel';
import GSTCompliance from './components/GSTCompliance';
import BankReconciliation from './components/BankReconciliation';
import Insights from './components/Insights';
import InsightsLevel2 from './components/InsightsLevel2';
import InsightsLevel3 from './components/InsightsLevel3';
import JournalDetail from './components/JournalDetail';
import TDSManager from './components/TDSManager';
import SettingsPage from './components/Settings';
import BusinessHub from './components/BusinessHub';
import InvestorShowcase from './components/InvestorShowcase';
import CAAuditPortal from './components/CAAuditPortal';
import FounderOnboardingWizard from './components/FounderOnboardingWizard';
import { InvoiceEngine } from './utils/InvoiceEngine';
import { InventoryEngine } from './utils/InventoryEngine';
import { LedgerEngine } from './utils/LedgerEngine';
import { SupabaseRepository } from './utils/SupabaseRepository';
import { supabase } from './supabaseClient';
import { 
  LayoutDashboard, Receipt, FileText, Package, FileBarChart, Bot, Settings, 
  LogOut, ChevronRight, BookOpen, Scale, Landmark, TrendingUp, BarChart2, 
  Activity, IndianRupee, Sun, Moon, DollarSign, Building2, Sparkles, ShieldCheck,
  PlusCircle, RefreshCw
} from 'lucide-react';
import { ThemeEngine, getTheme, toggleTheme } from './utils/ThemeEngine';
import { CurrencyEngine, getCurrency, toggleCurrency } from './utils/CurrencyEngine';
import { getBusinessProfile, getWorkspaceMode, setWorkspaceMode } from './utils/BusinessEngine';
import { initRealtimeSync } from './utils/RealtimeSync';
import Auth from './components/Auth';
import logoImg from './assets/logo.png';

function App() {
  const [session, setSession] = useState(null);
  const [authUser, setAuthUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('MESO_AUTH_USER'));
    } catch (_) {
      return null;
    }
  });
  const [businessProfile, setBusinessProfileState] = useState(() => getBusinessProfile());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [portalMode, setPortalMode] = useState('founder'); // 'founder' | 'audit' | 'investor'
  const [workspaceMode, setWorkspaceModeState] = useState(() => getWorkspaceMode()); // 'production' | 'demo'
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem('MESO_DEMO_MODE') === 'true');
  const [selectedJournalRef, setSelectedJournalRef] = useState(null);

  const [ledgerVersion, setLedgerVersion] = useState(0);
  const [dataReady, setDataReady] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => ThemeEngine.initTheme());
  const [currentCurrency, setCurrentCurrency] = useState(() => getCurrency());

  useEffect(() => {
    ThemeEngine.initTheme();
    initRealtimeSync();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const handleLedgerUpdate = () => setLedgerVersion(v => v + 1);
    const handleThemeChange = (e) => setCurrentTheme(e.detail?.theme || getTheme());
    const handleCurrencyChange = () => {
      setCurrentCurrency(getCurrency());
      setLedgerVersion(v => v + 1);
    };

    const handleProfileUpdate = (e) => setBusinessProfileState(e.detail?.profile || getBusinessProfile());
    const handleWorkspaceChange = (e) => setWorkspaceModeState(e.detail?.mode || getWorkspaceMode());

    window.addEventListener('ledger-updated', handleLedgerUpdate);
    window.addEventListener('theme-changed', handleThemeChange);
    window.addEventListener('currency-changed', handleCurrencyChange);
    window.addEventListener('business-profile-updated', handleProfileUpdate);
    window.addEventListener('workspace-changed', handleWorkspaceChange);

    // Hash routing for deep links: #/investor, #/audit, #/founder, #/journal/:ref
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('#/investor')) {
        setPortalMode('investor');
      } else if (hash.includes('#/audit')) {
        setPortalMode('audit');
      } else if (hash.includes('#/founder')) {
        setPortalMode('founder');
      } else {
        const journalMatch = hash.match(/#\/journal\/(.+)/);
        if (journalMatch) {
          setSelectedJournalRef(decodeURIComponent(journalMatch[1]));
          setActiveTab('journal-detail');
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    // Check if user is fresh and should trigger onboarding
    const hasCompletedOnboarding = localStorage.getItem('MESO_ONBOARDING_COMPLETED');
    if (!hasCompletedOnboarding && LedgerEngine.transactions.length === 0) {
      setIsOnboardingOpen(true);
    }

    // Hydration & Idempotent Seed & Currency Rate Sync
    async function initializePersistence() {
      CurrencyEngine.syncExchangeRate().catch(() => {});

      try {
        const isSeeded = await SupabaseRepository.isSeeded();
        if (!isSeeded) {
          console.log('[Meso AI] Database is not seeded or offline. Seeding demo dataset...');
          if (InvoiceEngine.invoices.length === 0) {
            InventoryEngine.seedPurchases();
            InvoiceEngine.seedInvoices();
          }
          SupabaseRepository.seedAccounts().catch(() => {});
          SupabaseRepository.seedTransactionsBatch(LedgerEngine.transactions).catch(() => {});
          InvoiceEngine.invoices.forEach(inv => SupabaseRepository.saveInvoice(inv));
        } else {
          console.log('[Meso AI] Hydrating from Supabase database...');
          await Promise.all([
            LedgerEngine.hydrate(),
            InvoiceEngine.hydrate(),
            InventoryEngine.hydrate()
          ]);
        }
      } catch (err) {
        console.warn('[Meso AI] Initialization warning:', err.message);
      } finally {
        setDataReady(true);
      }
    }

    initializePersistence();

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('ledger-updated', handleLedgerUpdate);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('theme-changed', handleThemeChange);
      window.removeEventListener('currency-changed', handleCurrencyChange);
      window.removeEventListener('business-profile-updated', handleProfileUpdate);
      window.removeEventListener('workspace-changed', handleWorkspaceChange);
    };
  }, []);

  // Hash-based Investor mode is completely public / auth-free
  const isInvestorRoute = portalMode === 'investor' || (typeof window !== 'undefined' && window.location.hash.includes('#/investor'));

  if (isInvestorRoute) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logoImg} alt="Meso AI" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.5px' }}>MESO AI • INVESTOR COCKPIT</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                window.location.hash = '#/founder';
                setPortalMode('founder');
              }}
              style={{ padding: '8px 14px', background: '#06402b', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
            >
              Open Founder Portal
            </button>
            <button
              onClick={() => {
                window.location.hash = '#/audit';
                setPortalMode('audit');
              }}
              style={{ padding: '8px 14px', background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: '8px', border: '1px solid var(--border)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
            >
              Open CA Audit Portal
            </button>
          </div>
        </div>
        <InvestorShowcase onNavigateToApp={(tab) => {
          if (tab === 'founder' || tab === 'dashboard') {
            window.location.hash = '#/founder';
            setPortalMode('founder');
            setActiveTab('dashboard');
          } else if (tab === 'audit') {
            window.location.hash = '#/audit';
            setPortalMode('audit');
          }
        }} />
      </div>
    );
  }

  if (!session && !demoMode && !authUser) {
    return <Auth 
      onDemoLogin={() => {
        localStorage.setItem('MESO_DEMO_MODE', 'true');
        setDemoMode(true);
      }} 
      onLoginSuccess={(user) => {
        setAuthUser(user);
        setDemoMode(false);
      }}
    />;
  }

  if (!dataReady) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        color: 'var(--text-primary)',
        gap: '16px'
      }}>
        <img src={logoImg} alt="Meso" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
        <div style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }}>
          Loading Books of Accounts...
        </div>
      </div>
    );
  }

  const currentFY = LedgerEngine.getCurrentFiscalYear();

  const renderContent = () => {
    // If CA Audit portal mode is selected
    if (portalMode === 'audit') {
      return <CAAuditPortal key={ledgerVersion} onSelectClient={() => {}} />;
    }

    switch(activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'transactions': return <TransactionList key={ledgerVersion} period={currentFY} />;
      case 'invoicing': return <Invoicing key={ledgerVersion} period={currentFY} />;
      case 'inventory': return <Inventory key={ledgerVersion} period={currentFY} />;
      case 'reports': return <Statements key={ledgerVersion} period={currentFY} />;
      case 'gst-compliance': return <GSTCompliance key={ledgerVersion} period={currentFY} />;
      case 'brs': return <BankReconciliation key={ledgerVersion} />;
      case 'insights': return <Insights key={ledgerVersion} />;
      case 'insights-level2': return <InsightsLevel2 key={ledgerVersion} />;
      case 'insights-level3': return <InsightsLevel3 key={ledgerVersion} />;
      case 'journal-detail': return <JournalDetail key={selectedJournalRef} journalRef={selectedJournalRef} onBack={() => { window.location.hash = ''; setActiveTab('transactions'); setSelectedJournalRef(null); }} />;
      case 'settings': return <SettingsPage key="settings" />;
      case 'tds': return <TDSManager key={ledgerVersion} />;
      case 'business-hub': return <BusinessHub key={ledgerVersion} />;
      default: return <Dashboard key={ledgerVersion} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div 
          className="sidebar-logo" 
          onClick={() => setActiveTab('business-hub')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          title="Business Hub & Setup"
        >
          <img 
            src={logoImg} 
            alt="Meso Logo" 
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              objectFit: 'cover',
              boxShadow: '0 3px 10px rgba(6, 64, 43, 0.2)',
              border: '1px solid rgba(6, 64, 43, 0.12)',
              flexShrink: 0
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.4px', color: 'var(--text-primary)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {businessProfile?.businessName || 'MESO AI'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.6px' }}>
                {portalMode === 'audit' ? 'CA AUDIT DESK' : 'FOUNDER BOOKS'}
              </span>
              <span style={{ 
                fontSize: '8px', fontWeight: 700, 
                color: workspaceMode === 'production' ? '#10b981' : '#f59e0b', 
                background: workspaceMode === 'production' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', 
                padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.3px' 
              }}>
                {workspaceMode === 'production' ? 'LIVE' : 'SAMPLE'}
              </span>
            </div>
          </div>
        </div>

        {/* Portal Switcher Pill: Founder ⇄ CA Firm ⇄ Investor Mode */}
        <div style={{
          background: 'var(--bg-surface)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '12px',
          border: '1px solid var(--border)',
          display: 'flex',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => {
              setPortalMode('founder');
              window.location.hash = '#/founder';
            }}
            title="Founder & Business Operational Portal"
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: '6px',
              border: 'none',
              background: portalMode === 'founder' ? '#06402b' : 'transparent',
              color: portalMode === 'founder' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            🏢 Founder
          </button>
          <button
            type="button"
            onClick={() => {
              setPortalMode('audit');
              window.location.hash = '#/audit';
            }}
            title="CA Audit Desk & Tax Audit 3CD Workpapers"
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: '6px',
              border: 'none',
              background: portalMode === 'audit' ? '#1e3a8a' : 'transparent',
              color: portalMode === 'audit' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            ⚖️ CA Desk
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#/investor';
              setPortalMode('investor');
            }}
            title="Public Shareable Investor Showcase"
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            🚀 Pitch
          </button>
        </div>

        {/* Guided Setup Trigger Button for Founders */}
        {portalMode === 'founder' && (
          <button
            type="button"
            onClick={() => setIsOnboardingOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: '1px dashed #06402b',
              background: 'rgba(6,64,43,0.06)',
              color: '#06402b',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            <Sparkles size={13} />
            <span>Setup Wizard (Start from Zero)</span>
          </button>
        )}

        {/* 1-Click Quick Controls: Theme & Currency */}
        <div style={{
          display: 'flex',
          gap: '6px',
          background: 'var(--bg-surface)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '16px',
          border: '1px solid var(--border)'
        }}>
          {/* 1-Click Theme Switch */}
          <button
            type="button"
            onClick={() => {
              const next = toggleTheme();
              setCurrentTheme(next);
            }}
            title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 8px',
              borderRadius: '7px',
              border: 'none',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}
          >
            {currentTheme === 'dark' ? <Sun size={13} color="#f59e0b" /> : <Moon size={13} color="#38bdf8" />}
            <span>{currentTheme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {/* 1-Click INR ⇄ USD Currency Switch */}
          <button
            type="button"
            onClick={() => {
              const next = toggleCurrency();
              setCurrentCurrency(next);
            }}
            title={`Switch reporting currency to ${currentCurrency === 'INR' ? 'USD ($)' : 'INR (₹)'}`}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '6px 8px',
              borderRadius: '7px',
              border: 'none',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}
          >
            <span style={{ color: '#10b981', fontWeight: 700 }}>{currentCurrency === 'INR' ? '₹' : '$'}</span>
            <span>{currentCurrency === 'INR' ? 'INR ⇄ USD' : 'USD ⇄ INR'}</span>
          </button>
        </div>

        <div className="sidebar-section-title" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
          Books of Accounts
        </div>

        <nav className="sidebar-nav">
          <div className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); if (portalMode === 'audit') setPortalMode('founder'); }}>
            <LayoutDashboard className="icon" size={16} /> Dashboard
          </div>
          <div className={`sidebar-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => { setActiveTab('transactions'); if (portalMode === 'audit') setPortalMode('founder'); }}>
            <Receipt className="icon" size={16} /> Day Book / Journal
          </div>
          <div className={`sidebar-item ${activeTab === 'invoicing' ? 'active' : ''}`} onClick={() => { setActiveTab('invoicing'); if (portalMode === 'audit') setPortalMode('founder'); }}>
            <FileText className="icon" size={16} /> Invoicing
          </div>
          <div className={`sidebar-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => { setActiveTab('inventory'); if (portalMode === 'audit') setPortalMode('founder'); }}>
            <Package className="icon" size={16} /> Inventory
          </div>
          <div className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => { setActiveTab('reports'); if (portalMode === 'audit') setPortalMode('founder'); }}>
            <FileBarChart className="icon" size={16} /> Final Accounts
          </div>
          <div className={`sidebar-item ${activeTab === 'gst-compliance' ? 'active' : ''}`} onClick={() => { setActiveTab('gst-compliance'); if (portalMode === 'audit') setPortalMode('founder'); }}>
            <Scale className="icon" size={16} /> GST &amp; Statutory Hub
          </div>
          <div className={`sidebar-item ${activeTab === 'tds' ? 'active' : ''}`} onClick={() => { setActiveTab('tds'); if (portalMode === 'audit') setPortalMode('founder'); }}>
            <IndianRupee className="icon" size={16} /> TDS &amp; Withholding
          </div>
          <div className={`sidebar-item ${activeTab === 'brs' ? 'active' : ''}`} onClick={() => { setActiveTab('brs'); if (portalMode === 'audit') setPortalMode('founder'); }}>
            <Landmark className="icon" size={16} /> Bank Reconciliation
          </div>

          <div className="sidebar-section-title" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            Business Setup
          </div>
          <div className={`sidebar-item ${activeTab === 'business-hub' ? 'active' : ''}`} onClick={() => { setActiveTab('business-hub'); if (portalMode === 'audit') setPortalMode('founder'); }}>
            <Building2 className="icon" size={16} /> Business Hub &amp; Setup
          </div>

          <div className="sidebar-section-title" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            Advisory &amp; Insights
          </div>

          <div className={`sidebar-item ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => { setActiveTab('insights'); if (portalMode === 'audit') setPortalMode('founder'); }}>
            <TrendingUp className="icon" size={16} /> Level 1: Health
          </div>
          <div className={`sidebar-item ${activeTab === 'insights-level2' ? 'active' : ''}`} onClick={() => { setActiveTab('insights-level2'); if (portalMode === 'audit') setPortalMode('founder'); }}>
            <BarChart2 className="icon" size={16} /> Level 2: Forecast
          </div>
          <div className={`sidebar-item ${activeTab === 'insights-level3' ? 'active' : ''}`} onClick={() => { setActiveTab('insights-level3'); if (portalMode === 'audit') setPortalMode('founder'); }}>
            <Activity className="icon" size={16} /> Level 3: Strategic
          </div>
          <div className="sidebar-item" onClick={() => setIsBotOpen(true)}>
            <Bot className="icon" size={16} /> AI Audit Assistant
            <span className="badge" style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Live</span>
          </div>

          <div className="sidebar-section-title" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            Preferences &amp; System
          </div>
          <div className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); if (portalMode === 'audit') setPortalMode('founder'); }}>
            <Settings className="icon" size={16} /> Settings &amp; API Key
          </div>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              {businessProfile?.businessName || 'Meso AI'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Schedule III &amp; AS Compliant</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Double-Entry Verified</span>
            </div>
            {(authUser?.email || session?.user?.email) && (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                👤 {authUser?.email || session?.user?.email}
              </div>
            )}
          </div>

          <div className="sidebar-nav">
            <div className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <Settings className="icon" size={16} /> Settings
            </div>
            <div className="sidebar-item" onClick={async () => {
              await supabase.auth.signOut();
              localStorage.removeItem('MESO_AUTH_USER');
              localStorage.removeItem('MESO_DEMO_MODE');
              setAuthUser(null);
              setDemoMode(false);
              setSession(null);
            }}>
              <LogOut className="icon" size={16} /> Log Out
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {renderContent()}
      </main>

      {/* Founder Guided Onboarding Wizard Modal */}
      <FounderOnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => {
          setIsOnboardingOpen(false);
          setActiveTab('dashboard');
        }}
      />

      {/* AI Audit Bot Panel */}
      <CompliancePanel isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} />
    </div>
  );
}

export default App;
