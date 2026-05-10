import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import ReportCard from './components/ReportCard';
import Ledger from './components/Ledger';
import TrialBalance from './components/TrialBalance';
import GSTCalculator from './components/GSTCalculator';
import BalanceSheet from './components/BalanceSheet';
import CashFlowStatement from './components/CashFlowStatement';
import Statements from './components/Statements';
import { LayoutDashboard, ReceiptText, FileText, Settings, Sparkles, BookOpen } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  useEffect(() => {
    // Force dark mode logic for the new UI to match design requested
    document.body.classList.add('dark-mode');
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Transactions', icon: <ReceiptText size={18} /> },
    { name: 'Statements', icon: <FileText size={18} /> },
    { name: 'Ledger Book', icon: <BookOpen size={18} /> },
    { name: 'AI Summary', icon: <Sparkles size={18} /> },
    { name: 'Settings', icon: <Settings size={18} /> }
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">LedgerAI</div>
        <div className="sidebar-menu">
          {menuItems.map(item => (
            <button
              key={item.name}
              className={`sidebar-btn ${activeTab === item.name ? 'active' : ''}`}
              onClick={() => setActiveTab(item.name)}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {activeTab === 'Dashboard' && <Dashboard />}
        {activeTab === 'Transactions' && <TransactionList />}
        {activeTab === 'Statements' && <Statements />}
        {activeTab === 'AI Summary' && <ReportCard />}
        {activeTab === 'Ledger Book' && <Ledger />}
        {/* Placeholder for settings or other old components */}
        {(activeTab === 'Ledger' || activeTab === 'Trial Balance' || activeTab === 'GST Calculator') && (
           <div style={{color: 'var(--text-muted)'}}>Please use Statements tab or specific routes.</div>
        )}
      </div>
    </div>
  );
}

export default App;
