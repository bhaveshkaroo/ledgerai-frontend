import React, { useState } from 'react';
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

  const navbarStyle = {
    backgroundColor: '#0A1628',
    color: 'white',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'sans-serif'
  };

  const logoStyle = { fontSize: '24px', fontWeight: 'bold', margin: 0 };
  const taglineStyle = { fontSize: '14px', margin: 0 };

  const tabContainerStyle = {
    display: 'flex',
    backgroundColor: '#f0f0f0',
    padding: '10px 20px',
    gap: '10px',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid #ddd'
  };

  const getTabStyle = (tabName) => ({
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    backgroundColor: activeTab === tabName ? '#1D9E75' : 'transparent',
    color: activeTab === tabName ? 'white' : '#333',
    flexShrink: 0
  });

  const containerStyle = {
    padding: '20px',
    fontFamily: 'sans-serif'
  };

  return (
    <div style={{ margin: 0, padding: 0 }}>
      <nav style={navbarStyle}>
        <h1 style={logoStyle}>LedgerAI</h1>
        <p style={taglineStyle}>Real-time financials for your business</p>
      </nav>

      <div style={tabContainerStyle}>
        {tabs.map(tab => (
          <button key={tab} style={getTabStyle(tab)} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <div style={containerStyle}>
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
