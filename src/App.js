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
import SettingsPage from './components/Settings';
import { InvoiceEngine } from './utils/InvoiceEngine';
import { InventoryEngine } from './utils/InventoryEngine';
import { LedgerEngine } from './utils/LedgerEngine';
import { SupabaseRepository } from './utils/SupabaseRepository';
import { supabase } from './supabaseClient';
import { LayoutDashboard, Receipt, FileText, Package, FileBarChart, Bot, Settings, LogOut, ChevronRight, BookOpen, Scale, Landmark, TrendingUp, BarChart2, Activity } from 'lucide-react';
import Auth from './components/Auth';
import logoImg from './assets/logo.png';

function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem('MESO_DEMO_MODE') === 'true');
  const [selectedJournalRef, setSelectedJournalRef] = useState(null);

  const [ledgerVersion, setLedgerVersion] = useState(0);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const handleLedgerUpdate = () => setLedgerVersion(v => v + 1);
    window.addEventListener('ledger-updated', handleLedgerUpdate);

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

    // Hydration & Idempotent Seed
    async function initializePersistence() {
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
    };
  }, []);

  if (!session && !demoMode) {
    return <Auth onDemoLogin={() => {
      localStorage.setItem('MESO_DEMO_MODE', 'true');
      setDemoMode(true);
    }} />;
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

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard key={ledgerVersion} />;
      case 'transactions': return <TransactionList key={ledgerVersion} period="Full Year" />;
      case 'invoicing': return <Invoicing key={ledgerVersion} />;
      case 'inventory': return <Inventory key={ledgerVersion} />;
      case 'reports': return <Statements key={ledgerVersion} period="Full Year" />;
      case 'gst-compliance': return <GSTCompliance key={ledgerVersion} period="Full Year" />;
      case 'brs': return <BankReconciliation key={ledgerVersion} />;
      case 'insights': return <Insights key={ledgerVersion} />;
      case 'insights-level2': return <InsightsLevel2 key={ledgerVersion} />;
      case 'insights-level3': return <InsightsLevel3 key={ledgerVersion} />;
      case 'journal-detail': return <JournalDetail key={selectedJournalRef} journalRef={selectedJournalRef} onBack={() => { window.location.hash = ''; setActiveTab('transactions'); setSelectedJournalRef(null); }} />;
      case 'settings': return <SettingsPage key="settings" />;
      default: return <Dashboard key={ledgerVersion} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div 
          className="sidebar-logo" 
          onClick={() => setActiveTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          title="Go to Dashboard"
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.6px', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              MESO<span style={{ color: '#10b981', marginLeft: '3px' }}>AI</span>
            </span>
            <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.6px', marginTop: '2px' }}>
              BOOKS OF ACCOUNTS
            </span>
          </div>
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
          <div className={`sidebar-item ${activeTab === 'brs' ? 'active' : ''}`} onClick={() => setActiveTab('brs')}>
            <Landmark className="icon" size={16} /> Bank Reconciliation
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
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Meso AI</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Schedule III &amp; AS Compliant</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Double-Entry Verified</span>
            </div>
          </div>

          <div className="sidebar-nav">
            <div className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <Settings className="icon" size={16} /> Settings
            </div>
            <div className="sidebar-item" onClick={async () => {
              await supabase.auth.signOut();
              localStorage.removeItem('MESO_DEMO_MODE');
              setDemoMode(false);
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
