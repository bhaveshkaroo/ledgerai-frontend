import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import './MesoCards.css';
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
import FounderOnboardingWizard from './components/FounderOnboardingWizard';
import { InvoiceEngine } from './utils/InvoiceEngine';
import { InventoryEngine } from './utils/InventoryEngine';
import { LedgerEngine } from './utils/LedgerEngine';
import { SupabaseRepository } from './utils/SupabaseRepository';
import { supabase } from './supabaseClient';
import { 
  LayoutDashboard, Receipt, FileText, Package, FileBarChart, Bot, Settings, 
  LogOut, Scale, Landmark, TrendingUp, BarChart2, 
  Activity, IndianRupee, Sun, Moon, Building2,
  PlusCircle, Check, ChevronDown, Sparkles,
  Menu, X, ChevronRight
} from 'lucide-react';
import { ThemeEngine, getTheme, toggleTheme } from './utils/ThemeEngine';
import { getCurrency, toggleCurrency } from './utils/CurrencyEngine';
import { 
  getBusinessProfile, 
  getWorkspaceMode, 
  getCompanyList, 
  getActiveCompanyId, 
  switchCompany, 
  isSampleCompanyActive 
} from './utils/BusinessEngine';
import { initRealtimeSync } from './utils/RealtimeSync';
import Auth from './components/Auth';
import logoImg from './assets/logo.png';

/* ═══════════════════════════════════════════════════════════
   NAV CONFIGURATION
   Top bar has 4 groups. Each group maps to sidebar sub-items.
   ═══════════════════════════════════════════════════════════ */
const NAV_GROUPS = {
  dashboard: {
    label: 'Dashboard',
    icon: LayoutDashboard,
    tab: 'dashboard',
    // No sidebar — Dashboard is a single page
    sidebarItems: null,
  },
  operations: {
    label: 'Operations',
    icon: Receipt,
    tab: null, // opens sidebar
    sidebarItems: [
      { id: 'transactions', label: 'Day Book / Journal', icon: Receipt },
      { id: 'invoicing', label: 'Invoicing', icon: FileText },
      { id: 'inventory', label: 'Inventory', icon: Package },
      { id: 'brs', label: 'Bank Reconciliation', icon: Landmark },
    ],
  },
  books: {
    label: 'Books of Accounts',
    icon: FileBarChart,
    tab: null,
    sidebarItems: [
      { id: 'reports', label: 'Final Accounts', icon: FileBarChart },
      { id: 'gst-compliance', label: 'GST & Statutory Hub', icon: Scale },
      { id: 'tds', label: 'TDS & Withholding', icon: IndianRupee },
      { id: 'business-hub', label: 'Business Hub & Setup', icon: Building2 },
    ],
  },
  insights: {
    label: 'Insights',
    icon: TrendingUp,
    tab: null,
    sidebarItems: [
      { id: 'insights', label: 'Level 1: Health', icon: TrendingUp },
      { id: 'insights-level2', label: 'Level 2: Forecast', icon: BarChart2 },
      { id: 'insights-level3', label: 'Level 3: Strategic', icon: Activity },
    ],
  },
};

// Helper: find which nav group a tab belongs to
function getNavGroupForTab(tab) {
  for (const [groupKey, group] of Object.entries(NAV_GROUPS)) {
    if (group.tab === tab) return groupKey;
    if (group.sidebarItems) {
      for (const item of group.sidebarItems) {
        if (item.id === tab) return groupKey;
      }
    }
  }
  return 'dashboard';
}

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
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem('MESO_DEMO_MODE') === 'true');
  const [selectedJournalRef, setSelectedJournalRef] = useState(null);

  // Multi-Company state & User dropdown
  const [companies, setCompanies] = useState(() => getCompanyList());
  const [activeCompanyId, setActiveCompanyIdState] = useState(() => getActiveCompanyId());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const [ledgerVersion, setLedgerVersion] = useState(0);
  const [dataReady, setDataReady] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => ThemeEngine.initTheme());
  const [currentCurrency, setCurrentCurrency] = useState(() => getCurrency());

  // Navigation state
  const [activeNavGroup, setActiveNavGroup] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('MESO_SIDEBAR_COLLAPSED') === 'true';
  });

  // Sync activeNavGroup when activeTab changes
  useEffect(() => {
    setActiveNavGroup(getNavGroupForTab(activeTab));
  }, [activeTab]);

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
    const handleCompanySwitch = (e) => {
      setCompanies(getCompanyList());
      setActiveCompanyIdState(e.detail?.companyId || getActiveCompanyId());
      setBusinessProfileState(e.detail?.profile || getBusinessProfile());
      setLedgerVersion(v => v + 1);
    };

    const handleOpenWizard = () => setIsOnboardingOpen(true);

    window.addEventListener('ledger-updated', handleLedgerUpdate);
    window.addEventListener('theme-changed', handleThemeChange);
    window.addEventListener('currency-changed', handleCurrencyChange);
    window.addEventListener('business-profile-updated', handleProfileUpdate);
    window.addEventListener('company-switched', handleCompanySwitch);
    window.addEventListener('open-onboarding-wizard', handleOpenWizard);

    // Close user dropdown on outside click
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Hash routing for deep links
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

    // Auto-collapse sidebar on small screens
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // initial check

    // Hydration & Database check
    async function initializePersistence() {
      try {
        const isSample = isSampleCompanyActive();
        if (isSample) {
          const isSeeded = await SupabaseRepository.isSeeded();
          if (!isSeeded) {
            if (InvoiceEngine.invoices.length === 0) {
              InventoryEngine.seedPurchases();
              InvoiceEngine.seedInvoices();
            }
            SupabaseRepository.seedAccounts().catch(() => {});
            SupabaseRepository.seedTransactionsBatch(LedgerEngine.transactions).catch(() => {});
          } else {
            await Promise.all([
              LedgerEngine.hydrate(),
              InvoiceEngine.hydrate(),
              InventoryEngine.hydrate()
            ]);
          }
        }
      } catch (err) {
        console.warn('[Meso AI] Persistence init:', err.message);
      } finally {
        setDataReady(true);
      }
    }

    initializePersistence();

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('ledger-updated', handleLedgerUpdate);
      window.removeEventListener('theme-changed', handleThemeChange);
      window.removeEventListener('currency-changed', handleCurrencyChange);
      window.removeEventListener('business-profile-updated', handleProfileUpdate);
      window.removeEventListener('company-switched', handleCompanySwitch);
      window.removeEventListener('open-onboarding-wizard', handleOpenWizard);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCompanyChange = (coId) => {
    switchCompany(coId);
    setIsUserMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('MESO_AUTH_USER');
    localStorage.removeItem('MESO_DEMO_MODE');
    setAuthUser(null);
    setDemoMode(false);
    setSession(null);
    setIsUserMenuOpen(false);
  };

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('MESO_SIDEBAR_COLLAPSED', String(next));
      return next;
    });
  }, []);

  const handleNavGroupClick = useCallback((groupKey) => {
    const group = NAV_GROUPS[groupKey];
    if (group.tab) {
      // Direct tab (like Dashboard)
      setActiveTab(group.tab);
      setActiveNavGroup(groupKey);
    } else if (group.sidebarItems) {
      // Group with sidebar items
      if (activeNavGroup === groupKey) {
        // Already on this group — toggle sidebar
        handleToggleSidebar();
      } else {
        setActiveNavGroup(groupKey);
        setSidebarCollapsed(false);
        localStorage.setItem('MESO_SIDEBAR_COLLAPSED', 'false');
        // Navigate to first item in group
        setActiveTab(group.sidebarItems[0].id);
      }
    }
  }, [activeNavGroup, handleToggleSidebar]);

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
        background: 'var(--bg-page)',
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
    const renderKey = `${activeCompanyId}-${ledgerVersion}`;
    switch(activeTab) {
      case 'dashboard': return <Dashboard key={renderKey} />;
      case 'transactions': return <TransactionList key={renderKey} period={currentFY} />;
      case 'invoicing': return <Invoicing key={renderKey} period={currentFY} />;
      case 'inventory': return <Inventory key={renderKey} period={currentFY} />;
      case 'reports': return <Statements key={renderKey} period={currentFY} />;
      case 'gst-compliance': return <GSTCompliance key={renderKey} period={currentFY} />;
      case 'brs': return <BankReconciliation key={renderKey} />;
      case 'insights': return <Insights key={renderKey} />;
      case 'insights-level2': return <InsightsLevel2 key={renderKey} />;
      case 'insights-level3': return <InsightsLevel3 key={renderKey} />;
      case 'journal-detail': return <JournalDetail key={selectedJournalRef} journalRef={selectedJournalRef} onBack={() => { window.location.hash = ''; setActiveTab('transactions'); setSelectedJournalRef(null); }} />;
      case 'settings': return <SettingsPage key={renderKey} onOpenNewCompanyModal={() => setIsOnboardingOpen(true)} />;
      case 'tds': return <TDSManager key={renderKey} />;
      case 'business-hub': return <BusinessHub key={renderKey} />;
      default: return <Dashboard key={renderKey} />;
    }
  };

  const isSample = isSampleCompanyActive();
  const userDisplayName = authUser?.email || session?.user?.email || (isSample ? 'demo@mesoai.in' : 'founder@mesoai.in');
  const currentNavGroup = NAV_GROUPS[activeNavGroup];
  const showSidebar = currentNavGroup?.sidebarItems && !sidebarCollapsed;

  return (
    <div className="app-container">
      {/* ═══ TOP NAVIGATION BAR ═══ */}
      <header className="topbar">
        {/* Logo */}
        <div className="topbar-logo" onClick={() => { setActiveTab('dashboard'); setActiveNavGroup('dashboard'); }}>
          <img src={logoImg} alt="Meso" />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span className="topbar-logo-text">
              {businessProfile?.businessName || 'MESO AI'}
            </span>
            <span className="topbar-logo-badge" style={{
              color: isSample ? 'var(--color-warning)' : 'var(--color-positive)',
              background: isSample ? 'var(--color-warning-bg)' : 'var(--color-positive-bg)',
            }}>
              {isSample ? 'SAMPLE' : 'LIVE'}
            </span>
          </div>
        </div>

        {/* Nav Groups */}
        <nav className="topbar-nav">
          {Object.entries(NAV_GROUPS).map(([key, group]) => {
            const Icon = group.icon;
            const isActive = activeNavGroup === key;
            return (
              <div
                key={key}
                className={`topbar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavGroupClick(key)}
              >
                <Icon size={16} />
                <span>{group.label}</span>
              </div>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="topbar-right">
          {/* Theme Toggle */}
          <button
            className="topbar-icon-btn"
            onClick={() => {
              const next = toggleTheme();
              setCurrentTheme(next);
            }}
            title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {currentTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Currency Toggle */}
          <button
            className="topbar-icon-btn"
            onClick={() => {
              const next = toggleCurrency();
              setCurrentCurrency(next);
            }}
            title={`Switch to ${currentCurrency === 'INR' ? 'USD' : 'INR'}`}
            style={{ width: 'auto', padding: '0 12px', fontSize: '12px', fontWeight: 600, gap: '4px', display: 'flex', alignItems: 'center' }}
          >
            <span style={{ color: 'var(--color-positive)', fontWeight: 700 }}>
              {currentCurrency === 'INR' ? '\u20B9' : '$'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {currentCurrency}
            </span>
          </button>

          {/* Settings */}
          <button
            className="topbar-icon-btn"
            onClick={() => setActiveTab('settings')}
            title="Settings"
          >
            <Settings size={16} />
          </button>

          <div className="topbar-divider" />

          {/* Profile Pill + Dropdown */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              className="profile-pill"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <div className="profile-avatar" style={{
                background: isSample ? 'var(--color-warning)' : 'var(--color-positive)',
              }}>
                {(businessProfile?.businessName || 'M')[0].toUpperCase()}
              </div>
              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {businessProfile?.businessName || userDisplayName}
              </span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="user-dropdown">
                {/* User Info Header */}
                <div className="user-dropdown-header">
                  <div className="user-dropdown-label">Signed in as</div>
                  <div className="user-dropdown-email">{userDisplayName}</div>
                </div>

                {/* Company Switcher Section */}
                <div>
                  <div className="user-dropdown-section-title">Switch Business</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '180px', overflowY: 'auto' }}>
                    {companies.map(co => {
                      const isActive = co.id === activeCompanyId;
                      return (
                        <div
                          key={co.id}
                          className={`user-dropdown-company ${isActive ? 'active' : ''}`}
                          onClick={() => handleCompanyChange(co.id)}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '190px' }}>
                            {co.name} {co.isSample && '(Sample)'}
                          </span>
                          {isActive && <Check size={14} />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Create New Company */}
                <div className="user-dropdown-divider">
                  <button
                    className="user-dropdown-action positive"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsOnboardingOpen(true);
                    }}
                  >
                    <PlusCircle size={14} />
                    <span>+ Add New Business</span>
                  </button>
                </div>

                {/* Settings & Logout */}
                <div className="user-dropdown-divider" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <button
                    className="user-dropdown-action"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setActiveTab('settings');
                    }}
                  >
                    <Settings size={14} />
                    <span>System Settings</span>
                  </button>

                  <button className="user-dropdown-action danger" onClick={handleLogout}>
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ BODY: SIDEBAR + CONTENT ═══ */}
      <div className="app-body">
        {/* Contextual Left Sidebar */}
        {currentNavGroup?.sidebarItems && (
          <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
              <span className="sidebar-title">{currentNavGroup.label}</span>
              <button className="sidebar-collapse-btn" onClick={handleToggleSidebar} title="Collapse sidebar">
                <X size={16} />
              </button>
            </div>

            <nav className="sidebar-nav">
              {currentNavGroup.sidebarItems.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <Icon size={16} className="icon" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="sidebar-footer">
              <div className="sidebar-footer-title">{businessProfile?.businessName || 'Meso AI'}</div>
              <div className="sidebar-footer-subtitle">Schedule III & AS Compliant</div>
              <div className="sidebar-footer-status">
                <div className="sidebar-footer-dot"></div>
                <span>Double-Entry Verified</span>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="main-content">
          {renderContent()}
        </main>
      </div>

      {/* ═══ FLOATING AI BUTTON ═══ */}
      <button
        className="floating-ai-btn"
        onClick={() => setIsBotOpen(true)}
        title="AI Audit Assistant"
      >
        <Sparkles size={20} />
      </button>

      {/* ═══ MODALS & PANELS ═══ */}
      <FounderOnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => {
          setIsOnboardingOpen(false);
          setActiveTab('dashboard');
        }}
      />

      <CompliancePanel isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} />
    </div>
  );
}

export default App;
