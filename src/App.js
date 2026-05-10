import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import ReportCard from './components/ReportCard';
import Ledger from './components/Ledger';
import Statements from './components/Statements';
import { LayoutDashboard, ReceiptText, FileText, Settings, Sparkles, BookOpen, LogOut } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [period, setPeriod] = useState('Full Year'); // Global period state

  useEffect(() => {
    document.body.classList.add('dark-mode');
  }, []);

  const menuItems = [
    { id: 'Dashboard', name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'Transactions', name: 'Transactions', icon: <ReceiptText size={18} /> },
    { id: 'Statements', name: 'Statements', icon: <FileText size={18} /> },
    { id: 'LedgerBook', name: 'Ledger Book', icon: <BookOpen size={18} /> },
    { id: 'AISummary', name: 'AI Summary', icon: <Sparkles size={18} /> },
    { id: 'Settings', name: 'Settings', icon: <Settings size={18} /> }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">LedgerAI</div>
        <div className="sidebar-menu">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleTabChange(item.id)}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </div>
        
        <div style={{ marginTop: 'auto', padding: '0 28px' }}>
          <div className="sidebar-item" style={{ color: 'var(--red)', borderLeft: 'none' }}>
            <LogOut size={18} />
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ marginLeft: '220px', width: 'calc(100% - 220px)' }}>
        <div id="Dashboard" className={activeTab === 'Dashboard' ? '' : 'hidden'}>
          <Dashboard period={period} setPeriod={setPeriod} />
        </div>
        <div id="Transactions" className={activeTab === 'Transactions' ? '' : 'hidden'}>
          <TransactionList period={period} />
        </div>
        <div id="Statements" className={activeTab === 'Statements' ? '' : 'hidden'}>
          <Statements period={period} />
        </div>
        <div id="LedgerBook" className={activeTab === 'LedgerBook' ? '' : 'hidden'}>
          <Ledger period={period} />
        </div>
        <div id="AISummary" className={activeTab === 'AISummary' ? '' : 'hidden'}>
          <ReportCard />
        </div>
        <div id="Settings" className={activeTab === 'Settings' ? '' : 'hidden'}>
          <div className="card">
            <h2>Settings</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 10 }}>Configuration and preferences.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hidden {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default App;
