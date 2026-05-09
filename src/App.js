import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import ReportCard from './components/ReportCard';
import Ledger from './components/Ledger';
import TrialBalance from './components/TrialBalance';
import GSTCalculator from './components/GSTCalculator';
import BalanceSheet from './components/BalanceSheet';
import CashFlowStatement from './components/CashFlowStatement';
import IncomeStatement from './components/IncomeStatement';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const tabs = [
    'Dashboard', 'Transactions', 'Ledger', 'Trial Balance',
    'GST Calculator', 'Balance Sheet', 'Cash Flow', 'Income Statement', 'AI Summary'
  ];

  return (
    <div style={{ margin: 0, padding: 0, minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navbar */}
      <nav style={{
        backgroundColor: 'var(--primary)',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: 1 }}>LedgerAI</h1>
        <p style={{ fontSize: 13, margin: 0, opacity: 0.8 }}>Real-time financials for your business</p>
      </nav>

      {/* Tab Bar */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--card)',
        padding: '0 16px',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: 14,
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '3px solid var(--accent)' : '3px solid transparent',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 16px' }}>
        {activeTab === 'Dashboard' && <Dashboard />}
        {activeTab === 'Transactions' && <TransactionList />}
        {activeTab === 'Ledger' && <Ledger />}
        {activeTab === 'Trial Balance' && <TrialBalance />}
        {activeTab === 'GST Calculator' && <GSTCalculator />}
        {activeTab === 'Balance Sheet' && <BalanceSheet />}
        {activeTab === 'Cash Flow' && <CashFlowStatement />}
        {activeTab === 'Income Statement' && <IncomeStatement />}
        {activeTab === 'AI Summary' && <ReportCard />}
      </div>
    </div>
  );
}

export default App;
