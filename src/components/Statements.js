import React, { useState } from 'react';
import TradingAccount from './TradingAccount';
import IncomeStatement from './IncomeStatement';
import BalanceSheet from './BalanceSheet';
import CashFlowStatement from './CashFlowStatement';
import TrialBalance from './TrialBalance';
import { Download, FileText } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';
import { LedgerEngine } from '../utils/LedgerEngine';

function Statements({ period, currency }) {
  const [activeTab, setActiveTab] = useState('Profit & Loss');
  const tabs = ['Trading A/c', 'Profit & Loss', 'Balance Sheet', 'Cash Flow', 'Trial Balance', 'Notes to Accounts', 'Schedules'];

  const handleExport = () => {
    let data = [];
    let title = '';
    if (activeTab === 'Trading A/c') {
      data = LedgerEngine.calcTradingAccount(period);
      title = `Trading Account - ${period}`;
    } else if (activeTab === 'Profit & Loss') {
      data = LedgerEngine.calcIncomeStatement(period);
      title = `Statement of Profit and Loss - ${period}`;
    } else if (activeTab === 'Balance Sheet') {
      data = LedgerEngine.calcBalanceSheet(period);
      title = `Balance Sheet - ${period}`;
    } else if (activeTab === 'Cash Flow') {
      data = LedgerEngine.calcCashFlow(period);
      title = `Statement of Cash Flows - ${period}`;
    } else {
      alert("PDF export is currently only supported for main financial statements.");
      return;
    }

    exportToPDF(title, data, `${activeTab.replace(/ /g, '_')}_${period}.pdf`);
  };

  return (
    <div className="tab-content" style={{ animation: 'fade-in 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Financial Statements</h2>
        
        <button 
          onClick={handleExport}
          className="action-btn"
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '8px 16px', background: 'var(--text-primary)', color: 'var(--bg-card)',
            borderRadius: '6px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer'
          }}
        >
          <Download size={16} />
          Export PDF
        </button>
      </div>

      <div className="statements-nav" style={{ 
        display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-8)',
        overflowX: 'auto', paddingBottom: '2px'
      }}>
        {tabs.map(tab => (
          <div 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ 
              paddingBottom: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--text-primary)' : '2px solid transparent',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="statement-body">
        {activeTab === 'Trading A/c' && <TradingAccount period={period} currency={currency} />}
        {activeTab === 'Profit & Loss' && <IncomeStatement period={period} currency={currency} />}
        {activeTab === 'Balance Sheet' && <BalanceSheet period={period} currency={currency} />}
        {activeTab === 'Cash Flow' && <CashFlowStatement period={period} currency={currency} />}
        {activeTab === 'Trial Balance' && <TrialBalance period={period} currency={currency} />}
        {(activeTab === 'Notes to Accounts' || activeTab === 'Schedules') && (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <div style={{ fontSize: '14px', fontWeight: 500 }}>Detailed {activeTab.toLowerCase()} will be attached upon year-end finalization.</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Statements;
