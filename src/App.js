import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import Statements from './components/Statements';
import CompliancePanel from './components/CompliancePanel';
import { supabase } from './supabaseClient';
import { LayoutDashboard, Receipt, FileBarChart, Bot, Settings, LogOut, ChevronRight } from 'lucide-react';
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
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar - Rafion AI Aesthetic */}
      <aside className="sidebar">
        <div className="sidebar-logo">RAFION AI</div>
        
        <div className="sidebar-section-title">
          Data <span className="dim">Records</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-item" style={{ background: 'var(--bg-surface)', marginBottom: '16px', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <LayoutDashboard size={16} /> All Departments
            </span>
            <ChevronRight size={14} />
          </div>

          <div className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard className="icon" size={16} /> Dashboard
            {activeTab === 'dashboard' && <span className="badge">12/100</span>}
          </div>
          <div className={`sidebar-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
            <Receipt className="icon" size={16} /> Transactions
            <span className="badge">Balanced</span>
          </div>
          <div className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <FileBarChart className="icon" size={16} /> Financial Reports
          </div>
          <div className="sidebar-item" onClick={() => setIsBotOpen(true)}>
            <Bot className="icon" size={16} /> AI Audit Assistant
            <span className="badge">72/100</span>
          </div>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <button className="btn-lime">Go Pro</button>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Rafion AI Free Trial - 30 Days</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Get deeper AI accounting insights.</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span className="digital-number" style={{ fontSize: '24px', fontWeight: 600 }}>30</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Days</span>
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

      {/* Compliance / AI Bot Panel */}
      <CompliancePanel isOpen={isBotOpen} onClose={() => setIsBotOpen(false)} />
    </div>
  );
}

export default App;
