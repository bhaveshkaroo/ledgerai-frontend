import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import Statements from './components/Statements';
import CompliancePanel from './components/CompliancePanel';
import GSTCompliance from './components/GSTCompliance';
import { InvoiceEngine } from './utils/InvoiceEngine';
import { supabase } from './supabaseClient';
import { LayoutDashboard, Receipt, FileBarChart, Bot, Settings, LogOut, ChevronRight, BookOpen, Scale } from 'lucide-react';
import Auth from './components/Auth';

function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Ensure invoices are seeded (idempotent if handled, but we run once here)
    if (InvoiceEngine.invoices.length === 0) {
      InvoiceEngine.seedInvoices();
    }

    return () => subscription.unsubscribe();
  }, []);

  if (!session && !demoMode) {
    return <Auth onDemoLogin={() => setDemoMode(true)} />;
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'transactions': return <TransactionList period="Full Year" />;
      case 'reports': return <Statements period="Full Year" />;
      case 'gst-compliance': return <GSTCompliance period="Full Year" />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'var(--text-primary)', color: 'var(--bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 700
          }}>M</div>
          MESO
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
          <div className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <FileBarChart className="icon" size={16} /> Final Accounts
          </div>
          <div className={`sidebar-item ${activeTab === 'gst-compliance' ? 'active' : ''}`} onClick={() => setActiveTab('gst-compliance')}>
            <Scale className="icon" size={16} /> GST Compliance
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
            <div className="sidebar-item" onClick={() => {}}>
              <Settings className="icon" size={16} /> Settings
            </div>
            <div className="sidebar-item" onClick={async () => {
              await supabase.auth.signOut();
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
