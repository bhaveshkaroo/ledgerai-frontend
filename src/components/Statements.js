import React, { useState, useEffect } from 'react';
import TradingAccount from './TradingAccount';
import IncomeStatement from './IncomeStatement';
import BalanceSheet from './BalanceSheet';
import CashFlowStatement from './CashFlowStatement';
import TrialBalance from './TrialBalance';
import { Download, FileText } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';
import { LedgerEngine } from '../utils/LedgerEngine';

function Statements({ period, currency }) {
  const [selectedPeriod, setSelectedPeriod] = useState(period || LedgerEngine.getCurrentFiscalYear());
  const [activeTab, setActiveTab] = useState('Profit & Loss');
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    window.addEventListener('ledger-updated', handleUpdate);
    return () => window.removeEventListener('ledger-updated', handleUpdate);
  }, []);
  const tabs = ['Trading A/c', 'Profit & Loss', 'Balance Sheet', 'Cash Flow', 'Trial Balance', 'Notes to Accounts', 'Schedules'];

  const handleExport = () => {
    let data = [];
    let title = '';
    if (activeTab === 'Trading A/c') {
      data = LedgerEngine.calcTradingAccount(selectedPeriod);
      title = `Trading Account - ${selectedPeriod}`;
    } else if (activeTab === 'Profit & Loss') {
      data = LedgerEngine.calcIncomeStatement(selectedPeriod);
      title = `Statement of Profit and Loss - ${selectedPeriod}`;
    } else if (activeTab === 'Balance Sheet') {
      data = LedgerEngine.calcBalanceSheet(selectedPeriod);
      title = `Balance Sheet - ${selectedPeriod}`;
    } else if (activeTab === 'Cash Flow') {
      data = LedgerEngine.calcCashFlow(selectedPeriod);
      title = `Statement of Cash Flows - ${selectedPeriod}`;
    } else {
      alert("PDF export is currently only supported for main financial statements.");
      return;
    }

    exportToPDF(title, data, `${activeTab.replace(/ /g, '_')}_${selectedPeriod}.pdf`);
  };

  return (
    <div className="tab-content" style={{ animation: 'fade-in 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>
            Financial Statements — {selectedPeriod === 'Full Year' ? 'All 3 Years' : selectedPeriod}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Schedule III (Companies Act 2013) &amp; AS Compliant — {LedgerEngine.getPeriodDateRange(selectedPeriod).name}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="Full Year">All 3 Years</option>
            <option value="FY 2024-25">FY 2024-25</option>
            <option value="FY 2025-26">FY 2025-26</option>
            <option value={LedgerEngine.getCurrentFiscalYear()}>{LedgerEngine.getCurrentFiscalYear()} (Current)</option>
          </select>

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
        {activeTab === 'Trading A/c' && <TradingAccount period={selectedPeriod} currency={currency} />}
        {activeTab === 'Profit & Loss' && <IncomeStatement period={selectedPeriod} currency={currency} />}
        {activeTab === 'Balance Sheet' && <BalanceSheet period={selectedPeriod} currency={currency} />}
        {activeTab === 'Cash Flow' && <CashFlowStatement period={selectedPeriod} currency={currency} />}
        {activeTab === 'Trial Balance' && <TrialBalance period={selectedPeriod} currency={currency} />}

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
