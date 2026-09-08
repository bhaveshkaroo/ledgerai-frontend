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
import { InvoiceEngine } from './utils/InvoiceEngine';
import { InventoryEngine } from './utils/InventoryEngine';
import { LedgerEngine } from './utils/LedgerEngine';
import { SupabaseRepository } from './utils/SupabaseRepository';
import { supabase } from './supabaseClient';
import { LayoutDashboard, Receipt, FileText, Package, FileBarChart, Bot, Settings, LogOut, ChevronRight, BookOpen, Scale, Landmark, TrendingUp, BarChart2, Activity, IndianRupee, Sun, Moon, DollarSign, Building2 } from 'lucide-react';
import { ThemeEngine, getTheme, toggleTheme } from './utils/ThemeEngine';
import { CurrencyEngine, getCurrency, toggleCurrency } from './utils/CurrencyEngine';
import { getBusinessProfile } from './utils/BusinessEngine';
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
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem('MESO_DEMO_MODE') === 'true');
  const [selectedJournalRef, setSelectedJournalRef] = useState(null);

  const [ledgerVersion, setLedgerVersion] = useState(0);
  const [dataReady, setDataReady] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => ThemeEngine.initTheme());
  const [currentCurrency, setCurrentCurrency] = useState(() => getCurrency());

  useEffect(() => {
    ThemeEngine.initTheme();

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

    window.addEventListener('ledger-updated', handleLedgerUpdate);
    window.addEventListener('theme-changed', handleThemeChange);
    window.addEventListener('currency-changed', handleCurrencyChange);
    window.addEventListener('business-profile-updated', handleProfileUpdate);

    const handleHashChange = () => {
      const hash = window.location.hash;
      const journalMatch = hash.match(/#\/journal\/(.+)/);
      if (journalMatch) {
        setSelectedJournalRef(decodeURIComponent(journalMatch[1]));
        setActiveTab('journal-detail');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    // Hydration & Idempotent Seed & Currency Rate Sync
    async function initializePersistence() {
      // Background sync of live USD/INR exchange rate (cached 24h)
      CurrencyEngine.syncExchangeRate().catch(() => {});

      try {
        const isSeeded = await SupabaseRepository.isSeeded();
        if (!isSeeded) {
          console.log('[Meso AI] Database is not seeded or offline. Seeding demo dataset...');
          // Seed in memory first
          if (InvoiceEngine.invoices.length === 0) {
            InventoryEngine.seedPurchases();
            InvoiceEngine.seedInvoices();
          }
          // Seed to Supabase in background
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
    };
  }, []);

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
    switch(activeTab) {
      case 'dashboard': return <Dashboard key={ledgerVersion} />;
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
                BOOKS OF ACCOUNTS
              </span>
              {authUser && (
                <span style={{ fontSize: '8px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.3px' }}>
                  LIVE
                </span>
              )}
            </div>
          </div>
        </div>

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
          <div className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard className="icon" size={16} /> Dashboard
          </div>
          <div className={`sidebar-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
            <Receipt className="icon" size={16} /> Day Book / Journal
          </div>
          <div className={`sidebar-item ${activeTab === 'invoicing' ? 'active' : ''}`} onClick={() => setActiveTab('invoicing')}>
            <FileText className="icon" size={16} /> Invoicing
          </div>
          <div className={`sidebar-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            <Package className="icon" size={16} /> Inventory
          </div>
          <div className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <FileBarChart className="icon" size={16} /> Final Accounts
          </div>
          <div className={`sidebar-item ${activeTab === 'gst-compliance' ? 'active' : ''}`} onClick={() => setActiveTab('gst-compliance')}>
            <Scale className="icon" size={16} /> GST Compliance
          </div>
          <div className={`sidebar-item ${activeTab === 'tds' ? 'active' : ''}`} onClick={() => setActiveTab('tds')}>
            <IndianRupee className="icon" size={16} /> TDS &amp; Withholding
          </div>
          <div className={`sidebar-item ${activeTab === 'brs' ? 'active' : ''}`} onClick={() => setActiveTab('brs')}>
            <Landmark className="icon" size={16} /> Bank Reconciliation
          </div>

          <div className="sidebar-section-title" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            Business Setup
          </div>
          <div className={`sidebar-item ${activeTab === 'business-hub' ? 'active' : ''}`} onClick={() => setActiveTab('business-hub')}>
            <Building2 className="icon" size={16} /> Business Hub & Setup
          </div>

          <div className="sidebar-section-title" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            Advisory &amp; Insights
          </div>

          <div className={`sidebar-item ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
            <TrendingUp className="icon" size={16} /> Level 1: Health
          </div>
          <div className={`sidebar-item ${activeTab === 'insights-level2' ? 'active' : ''}`} onClick={() => setActiveTab('insights-level2')}>
            <BarChart2 className="icon" size={16} /> Level 2: Forecast
          </div>
          <div className={`sidebar-item ${activeTab === 'insights-level3' ? 'active' : ''}`} onClick={() => setActiveTab('insights-level3')}>
            <Activity className="icon" size={16} /> Level 3: Strategic
          </div>
          <div className="sidebar-item" onClick={() => setIsBotOpen(true)}>
            <Bot className="icon" size={16} /> AI Audit Assistant
            <span className="badge" style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Live</span>
          </div>

          <div className="sidebar-section-title" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
            Preferences &amp; System
          </div>
          <div className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
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

      {/* AI Audit Bot Panel */}
      <CompliancePanel isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} />
    </div>
  );
}

export default App;
